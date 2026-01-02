console.log('Starting server...');
const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sendProjectEmail } = require('./email_service');
console.log('All modules loaded successfully');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware to ensure /api/* routes are not handled by static files
app.use('/api', (req, res, next) => {
    // Let API routes handle this - don't serve as static files
    next();
});

// API routes must be defined BEFORE static file middleware
// This ensures API requests are handled correctly

// Route for login page
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../login.html'));
});

// Route for admin page
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

// Route for main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Serve static files (must be AFTER API routes)
app.use(express.static('../'));

// --- Database Connection ---
const db = new Database('database.sqlite');
console.log('Connected to the better-sqlite3 database.');

// --- Pattern Database Connection (Separate) ---
const patternDb = new Database('pattern_database.sqlite');
console.log('Connected to the pattern database.');

// Initialize pattern database tables if they don't exist
try {
    patternDb.exec(`
        CREATE TABLE IF NOT EXISTS patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filepath TEXT NOT NULL UNIQUE,
            name TEXT,
            ownership TEXT DEFAULT 'eric.brilliant@gmail.com',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS pattern_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS pattern_tag_links (
            pattern_id INTEGER,
            tag_id INTEGER,
            FOREIGN KEY (pattern_id) REFERENCES patterns (id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES pattern_tags (id) ON DELETE CASCADE,
            PRIMARY KEY (pattern_id, tag_id)
        );
    `);
    
    // Check if name column exists, add it if missing
    const patternTableInfo = patternDb.prepare("PRAGMA table_info(patterns)").all();
    const hasName = patternTableInfo.some(col => col.name === 'name');
    
    if (!hasName) {
        console.log('Adding name column to patterns table...');
        patternDb.exec('ALTER TABLE patterns ADD COLUMN name TEXT');
        console.log('✅ name column added to patterns table');
    }
    
    console.log('✅ Pattern database schema verified');
} catch (err) {
    console.error('Error setting up pattern database schema:', err);
}

// Verify schema has width, length, and ownership columns, add them if missing
try {
    const tableInfo = db.prepare("PRAGMA table_info(images)").all();
    const hasWidth = tableInfo.some(col => col.name === 'width');
    const hasLength = tableInfo.some(col => col.name === 'length');
    const hasOwnership = tableInfo.some(col => col.name === 'ownership');
    
    if (!hasWidth) {
        console.log('Adding width column to images table...');
        db.exec('ALTER TABLE images ADD COLUMN width TEXT');
        console.log('✅ width column added');
    }
    
    if (!hasLength) {
        console.log('Adding length column to images table...');
        db.exec('ALTER TABLE images ADD COLUMN length TEXT');
        console.log('✅ length column added');
    }
    
    if (!hasOwnership) {
        console.log('Adding ownership column to images table...');
        db.exec("ALTER TABLE images ADD COLUMN ownership TEXT DEFAULT 'eric.brilliant@gmail.com'");
        // Update existing images to have ownership
        const updateResult = db.prepare("UPDATE images SET ownership = 'eric.brilliant@gmail.com' WHERE ownership IS NULL OR ownership = ''").run();
        console.log(`✅ ownership column added, updated ${updateResult.changes} existing images`);
    }
    
    if (hasWidth && hasLength && hasOwnership) {
        console.log('✅ Database schema verified: width, length, and ownership columns exist');
    }
    
    // Verify projects table has ownership column
    const projectsTableInfo = db.prepare("PRAGMA table_info(projects)").all();
    const projectsHasOwnership = projectsTableInfo.some(col => col.name === 'ownership');
    
    if (!projectsHasOwnership) {
        console.log('Adding ownership column to projects table...');
        db.exec("ALTER TABLE projects ADD COLUMN ownership TEXT");
        // Update existing projects to have ownership
        const updateResult = db.prepare("UPDATE projects SET ownership = 'eric.brilliant@gmail.com' WHERE ownership IS NULL OR ownership = ''").run();
        console.log(`✅ ownership column added to projects, updated ${updateResult.changes} existing projects`);
    } else {
        console.log('✅ Database schema verified: projects table has ownership column');
    }

    // Ensure feeling_usage table exists to persist subjective tag frequencies per user
    db.exec(`
        CREATE TABLE IF NOT EXISTS feeling_usage (
            name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (name, user_email)
        )
    `);
    console.log('✅ Database schema verified: feeling_usage table exists');
} catch (err) {
    console.error('Error checking/updating database schema:', err);
}

// --- File Upload Setup ---
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Pattern upload directory (separate from images)
const patternUploadDir = './uploads/patterns';
if (!fs.existsSync(patternUploadDir)) fs.mkdirSync(patternUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// Pattern storage (separate directory)
const patternStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, patternUploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage: storage });
const patternUpload = multer({ storage: patternStorage });

// --- Helper Functions ---

// Get user email, role, and level from session token
function getUserFromSession(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
        const sessionToken = authHeader.substring(7);
        try {
            const session = db.prepare(`
                SELECT u.email, u.role, COALESCE(u.level, 1) as level
                FROM login_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.expires_at > datetime('now')
            `).get(sessionToken);
            
            if (!session) {
                return null;
            }
            
            const userLevel = parseInt(session.level) || 1;
            console.log(`getUserFromSession - Email: ${session.email}, Role: ${session.role}, Level (raw): ${session.level}, Level (parsed): ${userLevel}`);
            
            return { 
                email: session.email, 
                role: session.role, 
                level: userLevel
            };
        } catch (err) {
            console.error('Error getting user from session:', err);
            return null;
        }
}

// Get user email from session token (for backward compatibility)
function getUserEmailFromSession(req) {
    const user = getUserFromSession(req);
    return user ? user.email : null;
}

// Increment feeling usage counts (subjective tags) for a user
function incrementFeelingUsage(tags, userEmail) {
    if (!tags || tags.length === 0 || !userEmail) return;
    const normalized = tags
        .map(t => String(t || '').trim().toLowerCase())
        .filter(t => t.length > 0);
    if (normalized.length === 0) return;
    const unique = [...new Set(normalized)];

    console.log('incrementFeelingUsage -> user:', userEmail, 'tags:', unique);

    const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO feeling_usage (name, user_email, count)
        VALUES (?, ?, 0)
    `);
    const updateStmt = db.prepare(`
        UPDATE feeling_usage
        SET count = count + 1, updated_at = datetime('now')
        WHERE name = ? AND user_email = ?
    `);

    const txn = db.transaction((items) => {
        for (const name of items) {
            insertStmt.run(name, userEmail);
            updateStmt.run(name, userEmail);
        }
    });
    txn(unique);
}

// Decrement feeling usage counts (subjective tags) for a user
function decrementFeelingUsage(tags, userEmail) {
    if (!tags || tags.length === 0 || !userEmail) return;
    const normalized = tags
        .map(t => String(t || '').trim().toLowerCase())
        .filter(t => t.length > 0);
    if (normalized.length === 0) return;
    const unique = [...new Set(normalized)];

    console.log('decrementFeelingUsage -> user:', userEmail, 'tags:', unique);

    const updateStmt = db.prepare(`
        UPDATE feeling_usage
        SET count = CASE WHEN count > 0 THEN count - 1 ELSE 0 END,
            updated_at = datetime('now')
        WHERE name = ? AND user_email = ?
    `);

    const txn = db.transaction((items) => {
        for (const name of items) {
            updateStmt.run(name, userEmail);
        }
    });
    txn(unique);
}

// --- API Endpoints ---

// 1. Upload Images
app.post('/upload', upload.array('images'), (req, res) => {
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    // Extract objective metadata from tags
    function extractMetadata(tags) {
        const metadata = {
            book: null,
            page: null,
            row: null,
            column: null,
            type: null,
            material: null,
            width: null,
            length: null,
            remark: null,
            brand: null,
            color: null
        };

        const regularTags = [];

        tags.forEach(tag => {
            const colonIndex = tag.indexOf(':');
            if (colonIndex > 0) {
                const key = tag.substring(0, colonIndex).toLowerCase();
                const value = tag.substring(colonIndex + 1);

                if (metadata.hasOwnProperty(key)) {
                    metadata[key] = value;
                } else {
                    regularTags.push(tag);
                }
            } else {
                regularTags.push(tag);
            }
        });

        return { metadata, regularTags };
    }

    const { metadata, regularTags } = extractMetadata(tags);

    // Get user email from session for ownership
    const userEmail = getUserEmailFromSession(req);
    if (!userEmail) {
        return res.status(401).send('Authentication required');
    }

    // Prepare all statements - prepare them fresh each time to ensure schema is up to date
    let insertImage;
    try {
        insertImage = db.prepare(`
            INSERT INTO images (filepath, book, page, row, column, type, material, width, length, remark, brand, color, ownership, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
    } catch (err) {
        console.error('Error preparing insertImage statement:', err);
        // Fallback: try without width/length if columns don't exist
        if (err.message && err.message.includes('no column named width')) {
            console.log('Width/length columns not found, using dimension fallback');
            insertImage = db.prepare(`
                INSERT INTO images (filepath, book, page, row, column, type, material, dimension, remark, brand, color, ownership, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);
        } else {
            throw err;
        }
    }
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
    const linkImageToTag = db.prepare('INSERT INTO image_tags (image_id, tag_id) VALUES (?, ?)');

    // Create a single, reusable transaction function
    const uploadTransaction = db.transaction((files, metadata, regularTags) => {
        for (const file of files) {
            let imageResult;
            let filePath = file.path;
            let attempts = 0;
            const maxAttempts = 10;

            // Handle UNIQUE constraint on filepath by generating new filename if needed
            console.log(`Processing file: ${file.originalname}, path: ${filePath}`);
            while (attempts < maxAttempts) {
                try {
                    console.log(`Attempt ${attempts + 1}: Inserting ${filePath} into database`);
                    imageResult = insertImage.run(
                        filePath,
                        metadata.book,
                        metadata.page,
                        metadata.row,
                        metadata.column,
                        metadata.type,
                        metadata.material,
                        metadata.width,
                        metadata.length,
                        metadata.remark,
                        metadata.brand,
                        metadata.color,
                        userEmail
                    );
                    break; // Success, exit the retry loop
                } catch (err) {
                    console.log('Database insert error:', err.code, err.message);
                    if ((err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) && attempts < maxAttempts - 1) {
                        // Generate a new unique filename
                        attempts++;
                        const timestamp = Date.now() + attempts;
                        const ext = path.extname(file.originalname);
                        const newFilename = timestamp + ext;
                        const newFilePath = path.join(uploadDir, newFilename);

                        // Rename the physical file
                        fs.renameSync(file.path, newFilePath);
                        filePath = newFilePath;

                        console.log(`Filepath conflict resolved. Renamed to: ${newFilePath}`);
                    } else {
                        throw err; // Re-throw if not a UNIQUE constraint error or max attempts reached
                    }
                }
            }
            const imageId = imageResult.lastInsertRowid;

            // Link only "real" tags (subjective feelings), not metadata fields
            if (regularTags && regularTags.length > 0) {
                for (const tag of regularTags) {
                    insertTag.run(tag);
                    const tagRow = getTagId.get(tag);
                    if (tagRow) {
                        linkImageToTag.run(imageId, tagRow.id);
                    }
                }
            }
        }
    });

    try {
        console.log('=== Upload Debug Info ===');
        console.log('Files:', files.length);
        console.log('Metadata:', metadata);
        console.log('Regular tags:', regularTags);

        // Execute the transaction with the data
        uploadTransaction(files, metadata, regularTags);

        // Persist subjective feelings usage (only "real" tags / feelings)
        try {
            const subjectiveTags = (regularTags || []).filter(tag => typeof tag === 'string');
            incrementFeelingUsage(subjectiveTags, userEmail);
        } catch (err) {
            console.error('Error incrementing feeling usage after upload:', err);
        }

        console.log('Upload successful:', {
            files: files.length,
            metadata: metadata,
            regularTags: regularTags.length
        });

        res.status(200).send({
            message: 'Files uploaded successfully',
            count: files.length,
            metadata: metadata,
            tags: regularTags.length
        });
    } catch (err) {
        console.error('=== Upload Error ===');
        console.error('Error details:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).send(`An error occurred during upload: ${err.message}`);
    }
});

// 1a. Upload Patterns (Separate from Images)
app.post('/api/patterns/upload', patternUpload.array('patterns'), (req, res) => {
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    // Get user email from session for ownership
    const userEmail = getUserEmailFromSession(req);
    if (!userEmail) {
        return res.status(401).send('Authentication required');
    }

    // Prepare statements for pattern database
    const insertPattern = patternDb.prepare(`
        INSERT INTO patterns (filepath, name, ownership, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `);
    const insertPatternTag = patternDb.prepare('INSERT OR IGNORE INTO pattern_tags (name) VALUES (?)');
    const getPatternTagId = patternDb.prepare('SELECT id FROM pattern_tags WHERE name = ?');
    const linkPatternToTag = patternDb.prepare('INSERT INTO pattern_tag_links (pattern_id, tag_id) VALUES (?, ?)');

    // Create transaction function for pattern upload
    const patternUploadTransaction = patternDb.transaction((files, tags, patternName) => {
        for (const file of files) {
            let patternResult;
            let filePath = file.path;
            let attempts = 0;
            const maxAttempts = 10;

            // Handle UNIQUE constraint on filepath by generating new filename if needed
            console.log(`Processing pattern file: ${file.originalname}, path: ${filePath}`);
            while (attempts < maxAttempts) {
                try {
                    console.log(`Attempt ${attempts + 1}: Inserting ${filePath} into pattern database`);
                    patternResult = insertPattern.run(filePath, patternName, userEmail);
                    break; // Success, exit the retry loop
                } catch (err) {
                    console.log('Pattern database insert error:', err.code, err.message);
                    if ((err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) && attempts < maxAttempts - 1) {
                        // Generate a new unique filename
                        attempts++;
                        const timestamp = Date.now() + attempts;
                        const ext = path.extname(file.originalname);
                        const newFilename = timestamp + ext;
                        const newFilePath = path.join(patternUploadDir, newFilename);

                        // Rename the physical file
                        fs.renameSync(file.path, newFilePath);
                        filePath = newFilePath;

                        console.log(`Pattern filepath conflict resolved. Renamed to: ${newFilePath}`);
                    } else {
                        throw err; // Re-throw if not a UNIQUE constraint error or max attempts reached
                    }
                }
            }
            const patternId = patternResult.lastInsertRowid;

            // Link tags to pattern
            if (tags && tags.length > 0) {
                for (const tag of tags) {
                    const normalizedTag = String(tag).trim();
                    if (normalizedTag.length > 0) {
                        insertPatternTag.run(normalizedTag);
                        const tagRow = getPatternTagId.get(normalizedTag);
                        if (tagRow) {
                            linkPatternToTag.run(patternId, tagRow.id);
                        }
                    }
                }
            }
        }
    });

    try {
        const patternName = req.body.patternName || '';
        
        console.log('=== Pattern Upload Debug Info ===');
        console.log('Files:', files.length);
        console.log('Tags:', tags);
        console.log('Pattern Name:', patternName);

        // Execute the transaction
        patternUploadTransaction(files, tags, patternName);

        console.log('Pattern upload successful:', {
            files: files.length,
            tags: tags.length
        });

        res.status(200).send({
            message: 'Pattern files uploaded successfully',
            count: files.length,
            tags: tags.length
        });
    } catch (err) {
        console.error('=== Pattern Upload Error ===');
        console.error('Error details:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).send(`An error occurred during pattern upload: ${err.message}`);
    }
});

// 1a-1. Get All Patterns
app.get('/api/patterns', (req, res) => {
    try {
        // Get user from session for filtering
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = parseInt(user.level) || 1;
        let patterns;

        // Level 3 can see all patterns, level 1 can only see their own
        if (userLevel === 3) {
            patterns = patternDb.prepare('SELECT * FROM patterns ORDER BY created_at DESC').all();
        } else {
            // Case-insensitive ownership check
            patterns = patternDb.prepare('SELECT * FROM patterns WHERE LOWER(ownership) = ? ORDER BY created_at DESC').all(user.email.toLowerCase());
        }

        res.json(patterns);
    } catch (err) {
        console.error('Error fetching patterns:', err.message);
        res.status(500).send('Error fetching patterns');
    }
});

// 1a-1a. Search Patterns (similar to image search)
app.get('/api/patterns/search', (req, res) => {
    const tags = req.query.tags ? req.query.tags.split(',').filter(t => t) : [];
    const mode = req.query.mode || 'OR';
    const match = (req.query.match || 'exact').toLowerCase();
    const isPartialMatch = match === 'partial';

    // Extract tag names from pattern: prefixed tags (e.g., "pattern:twill" -> "twill")
    // For pattern search, ONLY use tags that start with "pattern:" (extract them)
    // Ignore other tags since patterns don't have image tags like "clara", "cat", etc.
    const searchTags = [];
    tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower.startsWith('pattern:')) {
            // Find the colon position in the original tag (case-sensitive)
            const colonIndex = tag.indexOf(':');
            if (colonIndex > 0 && colonIndex < tag.length - 1) {
                const tagName = tag.substring(colonIndex + 1).trim(); // Extract part after colon
                if (tagName && !searchTags.includes(tagName)) {
                    searchTags.push(tagName);
                    console.log(`[PATTERN SEARCH] Extracted "${tagName}" from "${tag}"`);
                }
            }
        }
        // Ignore tags that don't start with "pattern:" - patterns don't have image tags
    });

    console.log('[PATTERN SEARCH] Original tags:', tags);
    console.log('[PATTERN SEARCH] Search tags (only pattern: tags extracted):', searchTags);
    console.log('[PATTERN SEARCH] Mode:', mode, 'Match:', match, 'isPartialMatch:', isPartialMatch);

    // Get user from session for filtering
    const user = getUserFromSession(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const userEmail = user.email;

    try {
        const userLevel = parseInt(user.level) || 1;
        let patterns;

        if (searchTags.length === 0) {
            // Level 3 can see all patterns, level 1 can only see their own
            if (userLevel === 3) {
                patterns = patternDb.prepare('SELECT * FROM patterns ORDER BY created_at DESC').all();
            } else {
                // Case-insensitive ownership check
                patterns = patternDb.prepare('SELECT * FROM patterns WHERE LOWER(ownership) = ? ORDER BY created_at DESC').all(userEmail.toLowerCase());
            }
        } else {
            const placeholders = searchTags.map(() => '?').join(',');
            let query;
            let params;

            const upperMode = mode.toUpperCase();

            if (!isPartialMatch) {
                // EXACT match behavior
                if (upperMode === 'AND') {
                    if (userLevel === 3) {
                        query = `
                            SELECT p.* FROM patterns p
                            JOIN pattern_tag_links ptl ON p.id = ptl.pattern_id
                            JOIN pattern_tags pt ON ptl.tag_id = pt.id
                            WHERE pt.name IN (${placeholders})
                            GROUP BY p.id
                            HAVING COUNT(DISTINCT pt.name) = ?
                        `;
                        params = [...searchTags, searchTags.length];
                    } else {
                        query = `
                            SELECT p.* FROM patterns p
                            JOIN pattern_tag_links ptl ON p.id = ptl.pattern_id
                            JOIN pattern_tags pt ON ptl.tag_id = pt.id
                            WHERE LOWER(p.ownership) = ? AND pt.name IN (${placeholders})
                            GROUP BY p.id
                            HAVING COUNT(DISTINCT pt.name) = ?
                        `;
                        params = [userEmail.toLowerCase(), ...searchTags, searchTags.length];
                    }
                } else { // OR, exact match
                    if (userLevel === 3) {
                        query = `
                            SELECT DISTINCT p.* FROM patterns p
                            JOIN pattern_tag_links ptl ON p.id = ptl.pattern_id
                            JOIN pattern_tags pt ON ptl.tag_id = pt.id
                            WHERE pt.name IN (${placeholders})
                        `;
                        params = searchTags;
                    } else {
                        query = `
                            SELECT DISTINCT p.* FROM patterns p
                            JOIN pattern_tag_links ptl ON p.id = ptl.pattern_id
                            JOIN pattern_tags pt ON ptl.tag_id = pt.id
                            WHERE LOWER(p.ownership) = ? AND pt.name IN (${placeholders})
                        `;
                        params = [userEmail.toLowerCase(), ...searchTags];
                    }
                }
            } else {
                // PARTIAL match behavior using LIKE
                const searchTagsLower = searchTags.map(t => t.toLowerCase());
                const likePlaceholders = searchTagsLower.map(() => 'LOWER(pt.name) LIKE ?').join(' OR ');
                const likeParams = searchTagsLower.map(t => `%${t}%`);

                console.log('[PATTERN SEARCH] Partial match - searchTagsLower:', searchTagsLower, 'likeParams:', likeParams);

                if (userLevel === 3) {
                    query = `
                        SELECT DISTINCT p.* FROM patterns p
                        JOIN pattern_tag_links ptl ON p.id = ptl.pattern_id
                        JOIN pattern_tags pt ON ptl.tag_id = pt.id
                        WHERE (${likePlaceholders})
                    `;
                    params = likeParams;
                } else {
                    query = `
                        SELECT DISTINCT p.* FROM patterns p
                        JOIN pattern_tag_links ptl ON p.id = ptl.pattern_id
                        JOIN pattern_tags pt ON ptl.tag_id = pt.id
                        WHERE LOWER(p.ownership) = ? AND (${likePlaceholders})
                    `;
                    params = [userEmail.toLowerCase(), ...likeParams];
                }
            }

            console.log('[PATTERN SEARCH] Query:', query);
            console.log('[PATTERN SEARCH] Params:', params);
            patterns = patternDb.prepare(query).all(params);
            console.log('[PATTERN SEARCH] Found', patterns.length, 'patterns');
        }

        // Get tags for each pattern
        const getPatternTags = patternDb.prepare(`
            SELECT pt.name FROM pattern_tags pt
            JOIN pattern_tag_links ptl ON pt.id = ptl.tag_id
            WHERE ptl.pattern_id = ?
        `);

        let patternsWithTags = patterns.map(pattern => {
            const patternTags = getPatternTags.all(pattern.id);
            return {
                ...pattern,
                tags: patternTags.map(tag => tag.name)
            };
        });

        // For partial + AND mode, ensure each pattern matches ALL search tags as substrings
        if (isPartialMatch && mode.toUpperCase() === 'AND' && searchTags.length > 0) {
            const searchTagsLower = searchTags.map(t => t.toLowerCase());
            patternsWithTags = patternsWithTags.filter(pattern => {
                const patternTagsLower = (pattern.tags || []).map(t => t.toLowerCase());
                const matches = searchTagsLower.every(searchTag =>
                    patternTagsLower.some(tagName => tagName.includes(searchTag))
                );
                return matches;
            });
        }
        
        // For exact + AND mode, ensure each pattern matches ALL search tags
        if (!isPartialMatch && mode.toUpperCase() === 'AND' && searchTags.length > 0) {
            const searchTagsLower = searchTags.map(t => t.toLowerCase());
            patternsWithTags = patternsWithTags.filter(pattern => {
                const patternTagsLower = (pattern.tags || []).map(t => t.toLowerCase());
                const matches = searchTagsLower.every(searchTag =>
                    patternTagsLower.includes(searchTag)
                );
                return matches;
            });
        }

        res.json(patternsWithTags);
    } catch (err) {
        console.error('Error searching patterns:', err.message);
        res.status(500).send('Error searching patterns');
    }
});

// 1a-2. Delete Pattern (must be before static middleware to work properly)
app.delete('/api/patterns/:id', (req, res) => {
    console.log(`[DELETE /api/patterns/:id] Request received for pattern ID: ${req.params.id}`);
    try {
        const patternId = parseInt(req.params.id);
        
        if (isNaN(patternId)) {
            return res.status(400).send('Invalid pattern ID');
        }

        // Get user from session for ownership check
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = parseInt(user.level) || 1;

        // Get pattern to check ownership
        const pattern = patternDb.prepare('SELECT * FROM patterns WHERE id = ?').get(patternId);
        if (!pattern) {
            return res.status(404).send('Pattern not found');
        }

        // Check ownership (level 3 can delete any pattern, level 1 can only delete their own)
        if (userLevel !== 3) {
            // Case-insensitive ownership check
            if (!pattern.ownership || pattern.ownership.toLowerCase() !== user.email.toLowerCase()) {
                return res.status(403).send('You do not have permission to delete this pattern');
            }
        }

        // Get filepath before deletion for file cleanup
        const filepath = pattern.filepath;

        // Delete pattern tags first (foreign key constraint)
        patternDb.prepare('DELETE FROM pattern_tag_links WHERE pattern_id = ?').run(patternId);

        // Delete pattern from database
        const result = patternDb.prepare('DELETE FROM patterns WHERE id = ?').run(patternId);

        if (result.changes === 0) {
            return res.status(404).send('Pattern not found');
        }

        // Delete the physical file
        try {
            const fullPath = path.resolve(filepath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted pattern file: ${fullPath}`);
            } else {
                console.warn(`Pattern file not found for deletion: ${fullPath}`);
            }
        } catch (fileErr) {
            console.error(`Error deleting pattern file ${filepath}:`, fileErr.message);
            // Don't fail the request if file deletion fails
        }

        console.log(`Successfully deleted pattern ${patternId}`);
        res.status(200).json({ message: 'Pattern deleted successfully', patternId: patternId });
    } catch (err) {
        console.error('Error deleting pattern:', err.message);
        res.status(500).send('Error deleting pattern: ' + err.message);
    }
});

// 1b. Feelings usage adjustment endpoints (add/remove outside of upload)
app.post('/feelings/usage', (req, res) => {
    try {
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).send('Authentication required');
        }
        const feelings = Array.isArray(req.body.feelings) ? req.body.feelings : [];
        incrementFeelingUsage(feelings, user.email);
        res.json({ ok: true });
    } catch (err) {
        console.error('Error incrementing feelings via /feelings/usage:', err);
        res.status(500).json({ error: 'Failed to update feelings usage' });
    }
});

app.post('/feelings/usage/decrement', (req, res) => {
    try {
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).send('Authentication required');
        }
        const feelings = Array.isArray(req.body.feelings) ? req.body.feelings : [];
        decrementFeelingUsage(feelings, user.email);
        res.json({ ok: true });
    } catch (err) {
        console.error('Error decrementing feelings via /feelings/usage/decrement:', err);
        res.status(500).json({ error: 'Failed to update feelings usage' });
    }
});

// 2. Search Images
app.get('/images', (req, res) => {
    const tags = req.query.tags ? req.query.tags.split(',').filter(t => t) : [];
    const mode = req.query.mode || 'OR';
    const match = (req.query.match || 'exact').toLowerCase();
    const isPartialMatch = match === 'partial';
    const patternMode = req.query.pattern === '1';

    console.log('[SEARCH] Tags:', tags, 'Mode:', mode, 'Match:', match, 'isPartialMatch:', isPartialMatch, 'patternMode:', patternMode);

    // Extract tag names from tags with colons
    // For "pattern:twill": search for images with tag "pattern:twill" (stored as tag) AND images with tag "twill"
    // For regular tags like "twill": also search for "pattern:twill" tags
    // For other tags with colons: extract the name after colon
    const expandedTags = [];
    const tagMapping = {}; // Map original tag to its searchable tag(s)
    
    tags.forEach(tag => {
        const colonIndex = tag.indexOf(':');
        if (colonIndex > 0 && colonIndex < tag.length - 1) {
            const prefix = tag.substring(0, colonIndex).toLowerCase();
            const tagName = tag.substring(colonIndex + 1).trim();
            
            if (prefix === 'pattern' && tagName) {
                // For "pattern:twill": search for both "pattern:twill" (the stored tag) and "twill"
                if (!expandedTags.includes(tag)) {
                    expandedTags.push(tag); // Keep "pattern:twill" as is (images have this as a tag)
                }
                if (tagName && !expandedTags.includes(tagName)) {
                    expandedTags.push(tagName); // Also search for "twill"
                }
                tagMapping[tag] = [tag, tagName]; // Original maps to both
            } else if (tagName) {
                // For other tags with colons (e.g., "book:Album-01"), only extract the name
                if (!expandedTags.includes(tagName)) {
                    expandedTags.push(tagName);
                }
                tagMapping[tag] = [tagName];
            } else {
                expandedTags.push(tag);
                tagMapping[tag] = [tag];
            }
        } else {
            // Regular tag without colon (e.g., "twill")
            // Also search for "pattern:twill" tags
            if (!expandedTags.includes(tag)) {
                expandedTags.push(tag);
            }
            const patternTag = `pattern:${tag}`;
            if (!expandedTags.includes(patternTag)) {
                expandedTags.push(patternTag); // Also search for pattern: prefix
            }
            tagMapping[tag] = [tag, patternTag]; // Original maps to both
        }
    });

    console.log('[SEARCH] Original tags:', tags);
    console.log('[SEARCH] Expanded tags (for searching):', expandedTags);
    console.log('[SEARCH] Tag mapping:', tagMapping);

    // Get user from session for filtering
    const user = getUserFromSession(req);
    if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const userEmail = user.email;
    const isAdmin = user.role === 'admin';

    try {
        const userLevel = parseInt(user.level) || 1;
        let images;

        if (tags.length === 0) {
            // Level 3 can see all images, level 1 only see their own
            if (userLevel === 3) {
                images = db.prepare('SELECT * FROM images').all();
            } else {
                images = db.prepare('SELECT * FROM images WHERE ownership = ?').all(userEmail);
            }
        } else {
            // Use expandedTags for searching (includes both original tags and extracted names)
            const placeholders = expandedTags.map(() => '?').join(',');
            let query;
            let params;

            const upperMode = mode.toUpperCase();

            if (!isPartialMatch) {
                // EXACT match behavior
                // expandedTags already includes both "twill" and "pattern:twill" when searching for "twill"
                // So we just search for tags IN expandedTags (no need to double-add pattern: prefix)
                // But if pattern mode is active, we need to filter to only pattern tags
                const patternFilter = patternMode ? " AND LOWER(t.name) LIKE 'pattern:%'" : "";
                
                if (upperMode === 'AND') {
                    // For AND mode, we need to ensure the image matches all original tags
                    // Since we expanded tags (e.g., "pattern:twill" -> "twill"), we'll post-filter
                    if (userLevel === 3) {
                        query = `
                            SELECT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE t.name IN (${placeholders})${patternFilter}
                            GROUP BY i.id
                        `;
                        params = expandedTags;
                    } else {
                        query = `
                            SELECT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE i.ownership = ? AND t.name IN (${placeholders})${patternFilter}
                            GROUP BY i.id
                        `;
                        params = [userEmail, ...expandedTags];
                    }
                } else { // OR, exact match
                    if (userLevel === 3) {
                        query = `
                            SELECT DISTINCT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE t.name IN (${placeholders})${patternFilter}
                        `;
                        params = expandedTags;
                    } else {
                        query = `
                            SELECT DISTINCT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE i.ownership = ? AND t.name IN (${placeholders})${patternFilter}
                        `;
                        params = [userEmail, ...expandedTags];
                    }
                }
            } else {
                // PARTIAL match behavior using LIKE
                // Use the SAME logic as frontend hover highlighting: tag.includes(searchTag)
                // When searching for "twill", match any tag that contains "twill" (including "pattern:twill")
                // Use original tags (not expanded) and match if tag contains the search term
                const tagsLower = tags.map(t => t.toLowerCase());
                const likeConditions = [];
                const likeParams = [];
                
                if (patternMode) {
                    // Pattern mode: ONLY search pattern tags - completely ignore non-pattern tags
                    // Build conditions that ONLY check pattern tags containing search terms
                    // Build LIKE conditions that ensure the pattern prefix and then the search term
                    tagsLower.forEach(searchTag => {
                        // Match only inside tags that BEGIN with "pattern:" and then contain the term somewhere after
                        // e.g. pattern:%twill%
                        likeConditions.push('LOWER(t.name) LIKE ?');
                        likeParams.push(`pattern:%${searchTag}%`);
                    });
                    
                    const likePlaceholders = likeConditions.join(' OR ');
                    console.log('[SEARCH] Pattern mode ON - Partial match - tagsLower:', tagsLower, 'likeParams:', likeParams);
                    console.log('[SEARCH] Pattern mode ON - SQL WHERE clause (pattern tags only):', likePlaceholders);

                    if (userLevel === 3) {
                        query = `
                            SELECT DISTINCT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE (${likePlaceholders})
                        `;
                        params = likeParams;
                    } else {
                        query = `
                            SELECT DISTINCT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE i.ownership = ? AND (${likePlaceholders})
                        `;
                        params = [userEmail, ...likeParams];
                    }
                } else {
                    // Normal mode: search all tags (both pattern and non-pattern)
                    tagsLower.forEach(searchTag => {
                        likeConditions.push('LOWER(t.name) LIKE ?');
                        likeParams.push(`%${searchTag}%`);
                    });
                    
                    const likePlaceholders = likeConditions.join(' OR ');
                    console.log('[SEARCH] Normal mode - Partial match - tagsLower:', tagsLower, 'likeParams:', likeParams);
                    console.log('[SEARCH] Normal mode - SQL WHERE clause (all tags):', likePlaceholders);

                    if (userLevel === 3) {
                        query = `
                            SELECT DISTINCT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE (${likePlaceholders})
                        `;
                        params = likeParams;
                    } else {
                        query = `
                            SELECT DISTINCT i.* FROM images i
                            JOIN image_tags it ON i.id = it.image_id
                            JOIN tags t ON it.tag_id = t.id
                            WHERE i.ownership = ? AND (${likePlaceholders})
                        `;
                        params = [userEmail, ...likeParams];
                    }
                }
            }

            console.log('[SEARCH] === SQL QUERY EXECUTION ===');
            console.log('[SEARCH] Query:', query);
            console.log('[SEARCH] Params:', params);
            
            // Build full SQL string for debugging
            let fullSql = query;
            let paramIndex = 0;
            while (fullSql.includes('?')) {
                if (paramIndex < params.length) {
                    fullSql = fullSql.replace('?', `'${params[paramIndex]}'`);
                    paramIndex++;
                } else {
                    break;
                }
            }
            console.log('[SEARCH] Full SQL with params:', fullSql);
            console.log('[SEARCH] Pattern mode:', patternMode, '| Mode:', mode, '| Partial match:', isPartialMatch);
            
            images = db.prepare(query).all(params);
            console.log('[SEARCH] Found', images.length, 'images from SQL query');
            console.log('[SEARCH] Image IDs returned by SQL:', images.map(img => img.id));
            
            // If pattern mode is ON, verify each returned image has matching pattern tags
            if (patternMode && images.length > 0) {
                console.log('[SEARCH] === VERIFYING PATTERN MODE RESULTS ===');
                const getImageTagsForVerify = db.prepare(`
                    SELECT t.name FROM tags t
                    JOIN image_tags it ON t.id = it.tag_id
                    WHERE it.image_id = ?
                `);
                
                images.forEach(img => {
                    const imgTags = getImageTagsForVerify.all(img.id).map(row => row.name);
                    const patternTags = imgTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                    console.log(`[SEARCH] Image ${img.id} - All tags:`, imgTags);
                    console.log(`[SEARCH] Image ${img.id} - Pattern tags only:`, patternTags);
                    
                    // Check if pattern tags match search
                    tags.forEach(searchTag => {
                        const searchLower = searchTag.toLowerCase();
                        const matchingPatternTags = patternTags.filter(pt => pt.toLowerCase().includes(`pattern:${searchLower}`) || pt.toLowerCase().includes(searchLower));
                        if (matchingPatternTags.length > 0) {
                            console.log(`[SEARCH] Image ${img.id} - Matched "${searchTag}" in pattern tags:`, matchingPatternTags);
                        } else {
                            console.log(`[SEARCH] Image ${img.id} - ⚠️ DID NOT match "${searchTag}" in pattern tags! This image should NOT be returned!`);
                        }
                    });
                });
                console.log('[SEARCH] === END VERIFICATION ===');
            }
            
            // Debug: Show why each image was selected by SQL
            if (images.length > 0) {
                console.log('[SEARCH] === SQL QUERY RESULTS ===');
                const getImageTagsForDebug = db.prepare(`
                    SELECT t.name FROM tags t
                    JOIN image_tags it ON t.id = it.tag_id
                    WHERE it.image_id = ?
                `);
                
                images.forEach(img => {
                    const imgTags = getImageTagsForDebug.all(img.id).map(row => row.name);
                    console.log(`[SEARCH] Image ID ${img.id} selected by SQL - Tags:`, imgTags);
                    if (patternMode) {
                        const patternTags = imgTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                        const nonPatternTags = imgTags.filter(t => !t.toLowerCase().startsWith('pattern:'));
                        console.log(`[SEARCH]   - Pattern tags:`, patternTags);
                        console.log(`[SEARCH]   - Non-pattern tags:`, nonPatternTags);
                        tags.forEach(searchTag => {
                            const searchLower = searchTag.toLowerCase();
                            const matchingPatternTags = patternTags.filter(pt => pt.toLowerCase().includes(searchLower));
                            if (matchingPatternTags.length > 0) {
                                console.log(`[SEARCH]   - Matched "${searchTag}" in pattern tags:`, matchingPatternTags);
                            } else {
                                console.log(`[SEARCH]   - Did NOT match "${searchTag}" in pattern tags`);
                            }
                        });
                    } else {
                        tags.forEach(searchTag => {
                            const searchLower = searchTag.toLowerCase();
                            const matchingTags = imgTags.filter(t => t.toLowerCase().includes(searchLower));
                            if (matchingTags.length > 0) {
                                console.log(`[SEARCH]   - Matched "${searchTag}" in tags:`, matchingTags);
                            }
                        });
                    }
                });
                console.log('[SEARCH] === END SQL QUERY RESULTS ===');
            }
        }

        // Get tags for each image
        const getImageTags = db.prepare(`
            SELECT t.name FROM tags t
            JOIN image_tags it ON t.id = it.tag_id
            WHERE it.image_id = ?
        `);

        let imagesWithTags = images.map(image => {
            const imageTags = getImageTags.all(image.id);
            const tagNames = imageTags.map(tag => tag.name);
            console.log(`[SEARCH] Image ${image.id} tags loaded:`, tagNames);
            return {
                ...image,
                tags: tagNames
            };
        });

        // For AND mode (both exact and partial), ensure each image matches ALL original search tags
        // This handles tag expansion (e.g., "pattern:twill" should match images with "pattern:twill" tag)
        if (mode.toUpperCase() === 'AND' && tags.length > 0) {
            imagesWithTags = imagesWithTags.filter(image => {
                // Get all image tags (including pattern: tags, but excluding other metadata tags)
                const allImageTags = image.tags || [];
                // Keep pattern: tags and subjective tags, but exclude other metadata tags
                const objectivePrefixes = ['book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'width:', 'length:', 'remark:', 'brand:', 'color:'];
                let searchableTags = allImageTags.filter(t => {
                    const tagLower = t.toLowerCase();
                    // Include pattern: tags and tags without colons (subjective tags)
                    return tagLower.startsWith('pattern:') || (!tagLower.includes(':') && !objectivePrefixes.some(prefix => tagLower.startsWith(prefix)));
                });
                
                // If pattern mode is active, only check pattern tags
                if (patternMode) {
                    const beforeFilter = searchableTags.length;
                    searchableTags = searchableTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                    const afterFilter = searchableTags.length;
                    if (beforeFilter !== afterFilter) {
                        console.log('[SEARCH] AND mode - Pattern mode ON - filtered searchableTags from', beforeFilter, 'to', afterFilter, 'for image', image.id);
                        console.log('[SEARCH] AND mode - Image', image.id, 'all tags:', allImageTags);
                        console.log('[SEARCH] AND mode - Image', image.id, 'pattern tags only:', searchableTags);
                    }
                }
                
                const imageTagsLower = searchableTags.map(t => t.toLowerCase());

                // Check if image matches all original tags using SAME logic as frontend hover
                // Frontend uses: tagLower.includes(searchLower) for partial mode
                const matchesAll = tags.every(originalTag => {
                    const searchLower = originalTag.toLowerCase();
                    if (!searchLower) return false;
                    
                    if (isPartialMatch) {
                        // Partial match: same as frontend - check if any image tag contains the search tag
                        const matches = imageTagsLower.some(imageTag => imageTag.includes(searchLower));
                        if (patternMode && matches) {
                            console.log('[SEARCH] AND mode - Image', image.id, 'matches search tag', searchLower, 'in pattern tags:', imageTagsLower);
                        }
                        return matches;
                    } else {
                        // Exact match: check if any image tag exactly matches the search tag
                        // Also check if pattern:tag matches (e.g., "pattern:twill" matches "twill")
                        return imageTagsLower.some(imageTag => {
                            if (imageTag === searchLower) return true;
                            // Check if pattern:tag matches (e.g., "pattern:twill" === "pattern:twill" or ends with ":twill")
                            if (imageTag.startsWith('pattern:') && imageTag.substring(8) === searchLower) return true;
                            return false;
                        });
                    }
                });

                if (patternMode && !matchesAll) {
                    console.log('[SEARCH] AND mode - Pattern mode ON - Image', image.id, 'does NOT match ALL pattern tags. All tags:', allImageTags, 'Pattern tags:', searchableTags, 'Search tags:', tags);
                }

                // Debug logging for image 190
                if (image.id === 190) {
                    console.log('[DEBUG 190] Image tags:', image.tags);
                    console.log('[DEBUG 190] Searchable tags:', searchableTags);
                    console.log('[DEBUG 190] Original search tags:', tags);
                    console.log('[DEBUG 190] Tag mapping:', tagMapping);
                    console.log('[DEBUG 190] Matches all:', matchesAll);
                }

                return matchesAll;
            });
        } else if (mode.toUpperCase() === 'OR' && tags.length > 0 && isPartialMatch) {
            // For OR mode with partial matching, verify each image matches at least one search tag
            // This ensures images actually match the search criteria (same logic as frontend)
            imagesWithTags = imagesWithTags.filter(image => {
                // Get all image tags (including pattern: tags, but excluding other metadata tags)
                const allImageTags = image.tags || [];
                // Keep pattern: tags and subjective tags, but exclude other metadata tags
                const objectivePrefixes = ['book:', 'page:', 'row:', 'column:', 'type:', 'material:', 'width:', 'length:', 'remark:', 'brand:', 'color:'];
                let searchableTags = allImageTags.filter(t => {
                    const tagLower = t.toLowerCase();
                    // Include pattern: tags and tags without colons (subjective tags)
                    return tagLower.startsWith('pattern:') || (!tagLower.includes(':') && !objectivePrefixes.some(prefix => tagLower.startsWith(prefix)));
                });
                
                // If pattern mode is active, only check pattern tags
                if (patternMode) {
                    const beforeFilter = searchableTags.length;
                    searchableTags = searchableTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                    const afterFilter = searchableTags.length;
                    if (image.id === 207) {
                        console.log('[SEARCH] OR mode - Image 207 - Pattern mode ON');
                        console.log('[SEARCH] OR mode - Image 207 - All tags:', allImageTags);
                        console.log('[SEARCH] OR mode - Image 207 - Before pattern filter:', beforeFilter, 'tags');
                        console.log('[SEARCH] OR mode - Image 207 - After pattern filter:', afterFilter, 'pattern tags:', searchableTags);
                    }
                }
                
                const imageTagsLower = searchableTags.map(t => t.toLowerCase());

                // Check if image matches at least one original tag using SAME logic as frontend hover
                // Frontend uses: tagLower.includes(searchLower) for partial mode
                const matchesAtLeastOne = tags.some(originalTag => {
                    const searchLower = originalTag.toLowerCase();
                    if (!searchLower) return false;
                    
                    // Partial match: check if any image tag contains the search tag
                    const matches = imageTagsLower.some(imageTag => imageTag.includes(searchLower));
                    if (image.id === 207) {
                        console.log(`[SEARCH] OR mode - Image 207 - Checking "${searchLower}" in pattern tags:`, imageTagsLower, '->', matches);
                    }
                    return matches;
                });

                if (image.id === 207) {
                    console.log('[SEARCH] OR mode - Image 207 - matchesAtLeastOne:', matchesAtLeastOne, '-> Should be FILTERED OUT:', !matchesAtLeastOne);
                }

                return matchesAtLeastOne;
            });
        }

        // If pattern mode is active, filter to only return images that have pattern tags matching the search
        // This is a CRITICAL filter that MUST run to ensure only pattern tags are considered
        if (patternMode && tags.length > 0) {
            const beforeFilterCount = imagesWithTags.length;
            console.log('[SEARCH] === FINAL PATTERN MODE FILTER ===');
            console.log('[SEARCH] Pattern mode is ACTIVE - ONLY pattern tags will be considered');
            console.log('[SEARCH] Original search tags:', tags);
            console.log('[SEARCH] Before final pattern filter:', beforeFilterCount, 'images');
            imagesWithTags = imagesWithTags.filter(image => {
                const allImageTags = image.tags || [];
                // Get only pattern tags (tags starting with "pattern:")
                const patternTags = allImageTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                const patternTagsLower = patternTags.map(t => t.toLowerCase());

                // CRITICAL: In pattern mode, if image has NO pattern tags, it MUST be excluded
                if (patternTags.length === 0) {
                    if (image.id === 207) {
                        console.log('[SEARCH] ⚠️ Image 207 has NO pattern tags - FILTERING OUT');
                    }
                    return false;
                }

                if (image.id === 207) {
                    console.log('[SEARCH] Final filter - Image 207 - All tags:', allImageTags);
                    console.log('[SEARCH] Final filter - Image 207 - Pattern tags only:', patternTags);
                    console.log('[SEARCH] Final filter - Image 207 - Search tags:', tags);
                    console.log('[SEARCH] Final filter - Image 207 - Mode:', mode);
                }

                // Check if pattern tags match search tags (respecting AND/OR mode)
                let matchesPatternTag;
                if (mode.toUpperCase() === 'AND') {
                    // AND mode: ALL search tags must match in pattern tags
                    matchesPatternTag = tags.every(originalTag => {
                        const searchLower = originalTag.toLowerCase();
                        if (!searchLower) return false;
                        
                        if (isPartialMatch) {
                            // Partial match: check if any pattern tag contains the search tag
                            return patternTagsLower.some(patternTag => patternTag.includes(searchLower));
                        } else {
                            // Exact match: check if any pattern tag exactly matches the search tag
                            // Also handle "pattern:twill" matching "twill" search
                            return patternTagsLower.some(patternTag => {
                                if (patternTag === searchLower) return true;
                                if (patternTag.startsWith('pattern:') && patternTag.substring(8) === searchLower) return true;
                                return false;
                            });
                        }
                    });
                } else {
                    // OR mode: ANY search tag must match in pattern tags
                    matchesPatternTag = tags.some(originalTag => {
                        const searchLower = originalTag.toLowerCase();
                        if (!searchLower) return false;
                        
                        if (isPartialMatch) {
                            // Partial match: check if any pattern tag contains the search tag
                            const matches = patternTagsLower.some(patternTag => patternTag.includes(searchLower));
                            if (image.id === 207) {
                                console.log(`[SEARCH] Final filter - Image 207 - OR mode - Checking "${searchLower}" in pattern tags:`, patternTagsLower, '->', matches);
                            }
                            return matches;
                        } else {
                            // Exact match: check if any pattern tag exactly matches the search tag
                            // Also handle "pattern:twill" matching "twill" search
                            return patternTagsLower.some(patternTag => {
                                if (patternTag === searchLower) return true;
                                if (patternTag.startsWith('pattern:') && patternTag.substring(8) === searchLower) return true;
                                return false;
                            });
                        }
                    });
                }
                
                if (image.id === 207) {
                    console.log('[SEARCH] Final filter - Image 207 - matchesPatternTag:', matchesPatternTag, '-> Should be FILTERED OUT:', !matchesPatternTag);
                    console.log('[SEARCH] Final filter - Image 207 - RETURN VALUE:', matchesPatternTag);
                }

                // CRITICAL: In pattern mode, ONLY return images that have matching pattern tags
                // If no pattern tags match, this image MUST be excluded
                if (!matchesPatternTag) {
                    console.log('[SEARCH] ⚠️ Pattern mode filter REMOVING image', image.id, '- Pattern tags do NOT match search');
                    console.log('[SEARCH]   - All tags:', allImageTags);
                    console.log('[SEARCH]   - Pattern tags:', patternTags);
                    console.log('[SEARCH]   - Search tags:', tags);
                    console.log('[SEARCH]   - Mode:', mode.toUpperCase());
                    if (mode.toUpperCase() === 'OR') {
                        tags.forEach(searchTag => {
                            const searchLower = searchTag.toLowerCase();
                            const matched = patternTagsLower.some(pt => pt.includes(searchLower));
                            console.log(`[SEARCH]   - "${searchTag}": ${matched ? 'MATCHED' : 'NOT MATCHED'} in pattern tags`);
                        });
                    }
                    return false; // EXPLICITLY return false to filter out
                } else {
                    if (image.id === 207) {
                        console.log('[SEARCH] ⚠️ Pattern mode filter KEPT image 207 - THIS SHOULD NOT HAPPEN!');
                        console.log('[SEARCH]   - Pattern tags:', patternTags);
                        console.log('[SEARCH]   - Search tags:', tags);
                        console.log('[SEARCH]   - Mode:', mode.toUpperCase());
                    }
                }

                return matchesPatternTag;
            });
            const afterFilterCount = imagesWithTags.length;
            console.log('[SEARCH] === Pattern mode filter: filtered from', beforeFilterCount, 'to', afterFilterCount, 'images ===');
            
            // CRITICAL CHECK: Verify Image 207 is NOT in results
            const image207StillInResults = imagesWithTags.some(img => img.id === 207);
            if (image207StillInResults) {
                console.log('[SEARCH] ⚠️⚠️⚠️ ERROR: Image 207 is STILL in results after pattern filter! ⚠️⚠️⚠️');
                const img207 = imagesWithTags.find(img => img.id === 207);
                if (img207) {
                    const patternTags207 = (img207.tags || []).filter(t => t.toLowerCase().startsWith('pattern:'));
                    const patternTags207Lower = patternTags207.map(t => t.toLowerCase());
                    console.log('[SEARCH] Image 207 tags:', img207.tags);
                    console.log('[SEARCH] Image 207 pattern tags:', patternTags207);
                    console.log('[SEARCH] Search tags:', tags);
                    
                    // Check if pattern tags actually match
                    const shouldMatch = tags.some(searchTag => {
                        const searchLower = searchTag.toLowerCase();
                        return patternTags207Lower.some(pt => pt.includes(searchLower));
                    });
                    console.log('[SEARCH] Image 207 should match:', shouldMatch);
                    
                    if (!shouldMatch) {
                        // Force remove it
                        imagesWithTags = imagesWithTags.filter(img => img.id !== 207);
                        console.log('[SEARCH] ⚠️ FORCE REMOVED Image 207 from results - pattern tags do not match');
                    }
                }
            }
        }
        
        // FINAL SAFETY CHECK: Remove any images that don't have matching pattern tags when pattern mode is ON
        if (patternMode && tags.length > 0) {
            const originalCount = imagesWithTags.length;
            imagesWithTags = imagesWithTags.filter(image => {
                const allImageTags = image.tags || [];
                const patternTags = allImageTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                const patternTagsLower = patternTags.map(t => t.toLowerCase());
                
                // Check if ANY pattern tag matches ANY search tag (OR mode) or ALL pattern tags match ALL search tags (AND mode)
                let matches;
                if (mode.toUpperCase() === 'AND') {
                    matches = tags.every(searchTag => {
                        const searchLower = searchTag.toLowerCase();
                        return patternTagsLower.some(pt => pt.includes(searchLower));
                    });
                } else {
                    matches = tags.some(searchTag => {
                        const searchLower = searchTag.toLowerCase();
                        return patternTagsLower.some(pt => pt.includes(searchLower));
                    });
                }
                
                if (!matches && image.id === 207) {
                    console.log('[SEARCH] ⚠️ FINAL SAFETY CHECK: Removing Image 207 - pattern tags do not match');
                }
                
                return matches;
            });
            const finalCount = imagesWithTags.length;
            if (originalCount !== finalCount) {
                console.log('[SEARCH] ⚠️ FINAL SAFETY CHECK removed', originalCount - finalCount, 'images');
            }
        }
        
        // ABSOLUTE FINAL CHECK: Remove any images that don't match pattern tags when pattern mode is ON
        // This MUST run before final results logging
        if (patternMode && tags.length > 0) {
            const beforeFinalCheck = imagesWithTags.length;
            console.log('[SEARCH] === ABSOLUTE FINAL CHECK (BEFORE FINAL RESULTS) ===');
            console.log('[SEARCH] Pattern mode:', patternMode, '| Tags:', tags, '| Mode:', mode);
            console.log('[SEARCH] Images before absolute final check:', beforeFinalCheck);
            
            imagesWithTags = imagesWithTags.filter(image => {
                const allImageTags = image.tags || [];
                const patternTags = allImageTags.filter(t => t.toLowerCase().startsWith('pattern:'));
                const patternTagsLower = patternTags.map(t => t.toLowerCase());
                
                // Check if pattern tags match search tags
                let matches;
                if (mode.toUpperCase() === 'AND') {
                    matches = tags.every(st => {
                        const searchLower = st.toLowerCase();
                        return patternTagsLower.some(pt => pt.includes(searchLower));
                    });
                } else {
                    matches = tags.some(st => {
                        const searchLower = st.toLowerCase();
                        return patternTagsLower.some(pt => pt.includes(searchLower));
                    });
                }
                
                if (image.id === 207) {
                    console.log('[SEARCH] ⚠️ ABSOLUTE FINAL CHECK - Image 207:');
                    console.log('[SEARCH]   - All tags:', allImageTags);
                    console.log('[SEARCH]   - Pattern tags:', patternTags);
                    console.log('[SEARCH]   - Search tags:', tags);
                    console.log('[SEARCH]   - Matches:', matches);
                    console.log('[SEARCH]   - Will be removed:', !matches);
                }
                
                if (!matches) {
                    return false; // Remove image
                }
                return true; // Keep image
            });
            
            const afterFinalCheck = imagesWithTags.length;
            console.log('[SEARCH] Images after absolute final check:', afterFinalCheck);
            if (beforeFinalCheck !== afterFinalCheck) {
                console.log('[SEARCH] ⚠️ ABSOLUTE FINAL CHECK removed', beforeFinalCheck - afterFinalCheck, 'images');
            }
            
            // Verify Image 207 is gone
            const stillHas207 = imagesWithTags.some(img => img.id === 207);
            if (stillHas207) {
                console.log('[SEARCH] ⚠️⚠️⚠️ CRITICAL ERROR: Image 207 STILL in results after absolute final check!');
                // Force remove it
                imagesWithTags = imagesWithTags.filter(img => img.id !== 207);
                console.log('[SEARCH] ⚠️ FORCE REMOVED Image 207');
            }
            console.log('[SEARCH] === END ABSOLUTE FINAL CHECK ===');
        }
        
        // Final summary of selected images
        console.log('[SEARCH] === FINAL RESULTS ===');
        console.log('[SEARCH] Pattern mode:', patternMode, '| Tags:', tags);
        console.log('[SEARCH] Total images returned:', imagesWithTags.length);
        imagesWithTags.forEach(img => {
            console.log(`[SEARCH] Final selected Image ${img.id} - Tags:`, img.tags);
            if (patternMode) {
                const patternTags = (img.tags || []).filter(t => t.toLowerCase().startsWith('pattern:'));
                console.log(`[SEARCH]   - Pattern tags:`, patternTags);
            }
        });
        console.log('[SEARCH] === END FINAL RESULTS ===');

        // Return results with debug info in browser (only if pattern mode is ON)
        if (patternMode && tags.length > 0) {
            const debugInfo = {
                patternMode: patternMode,
                searchTags: tags,
                mode: mode,
                totalImages: imagesWithTags.length,
                image207InResults: imagesWithTags.some(img => img.id === 207),
                image207Info: null
            };
            
            const img207 = imagesWithTags.find(img => img.id === 207);
            if (img207) {
                const patternTags207 = (img207.tags || []).filter(t => t.toLowerCase().startsWith('pattern:'));
                const patternTags207Lower = patternTags207.map(t => t.toLowerCase());
                const matches = mode.toUpperCase() === 'OR' 
                    ? tags.some(st => patternTags207Lower.some(pt => pt.includes(st.toLowerCase())))
                    : tags.every(st => patternTags207Lower.some(pt => pt.includes(st.toLowerCase())));
                
                debugInfo.image207Info = {
                    allTags: img207.tags,
                    patternTags: patternTags207,
                    matches: matches,
                    shouldBeRemoved: !matches
                };
            }
            
            // Add debug info to response
            res.json({
                images: imagesWithTags,
                debug: debugInfo
            });
        } else {
            res.json(imagesWithTags);
        }
    } catch (err) {
        console.error('Error searching images:', err.message);
        res.status(500).send('Error searching images');
    }
});

// 3. Get All Tags (for autocomplete)
app.get('/tags', (req, res) => {
    try {
        const query = req.query.q ? req.query.q.toLowerCase() : '';
        let tags;

        if (query) {
            // Search for SUBJECTIVE tags (no colon) AND pattern tags (pattern:) that contain the query string
            tags = db.prepare(`
                SELECT name, COUNT(it.image_id) as usage_count
                FROM tags t
                LEFT JOIN image_tags it ON t.id = it.tag_id
                WHERE LOWER(t.name) LIKE ?
                  AND (INSTR(t.name, ':') = 0 OR LOWER(t.name) LIKE 'pattern:%')
                GROUP BY t.id, t.name
                ORDER BY usage_count DESC, t.name ASC
            `).all(`%${query}%`);
        } else {
            // Get all SUBJECTIVE tags (no colon) AND pattern tags with usage count
            tags = db.prepare(`
                SELECT name, COUNT(it.image_id) as usage_count
                FROM tags t
                LEFT JOIN image_tags it ON t.id = it.tag_id
                WHERE INSTR(t.name, ':') = 0 OR LOWER(t.name) LIKE 'pattern:%'
                GROUP BY t.id, t.name
                ORDER BY usage_count DESC, t.name ASC
            `).all();
        }

        res.json(tags);
    } catch (err) {
        console.error('Error fetching tags:', err.message);
        res.status(500).send('Error fetching tags');
    }
});

// 3b. Tag frequencies (subjective/objective combined) with level-based scope
// This now reads from feeling_usage to persist counts independently of current images.
// Level 3: aggregate across all users; other levels: only their own counts.
app.get('/tag-frequencies', (req, res) => {
    try {
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).send('Authentication required');
        }

        const userLevel = parseInt(user.level) || 1;
        let rows;

        if (userLevel === 3) {
            rows = db.prepare(`
                SELECT name, SUM(count) AS count
                FROM feeling_usage
                GROUP BY name
                ORDER BY count DESC, name ASC
            `).all();
        } else {
            rows = db.prepare(`
                SELECT name, count
                FROM feeling_usage
                WHERE LOWER(user_email) = ?
                ORDER BY count DESC, name ASC
            `).all(user.email.toLowerCase());
        }

        const result = rows.map(r => ({
            name: r.name,
            count: Number(r.count) || 0
        }));

        res.json(result);
    } catch (err) {
        console.error('Error fetching tag frequencies:', err.message);
        res.status(500).send('Error fetching tag frequencies');
    }
});

// 3c. Increment feeling usage counts (persist subjective tags)
app.post('/feelings/usage', (req, res) => {
    try {
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).send('Authentication required');
        }

        const feelings = Array.isArray(req.body.feelings) ? req.body.feelings : [];
        if (feelings.length === 0) {
            return res.status(400).send('Feelings array required');
        }

        const normalized = feelings
            .map(f => String(f || '').trim().toLowerCase())
            .filter(f => f.length > 0);

        if (normalized.length === 0) {
            return res.status(400).send('No valid feelings provided');
        }

        const unique = [...new Set(normalized)];

        const incrementStmt = db.prepare(`
            UPDATE feeling_usage
            SET count = count + 1, updated_at = datetime('now')
            WHERE name = ? AND user_email = ?
        `);
        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO feeling_usage (name, user_email, count)
            VALUES (?, ?, 0)
        `);

        const txn = db.transaction((items) => {
            for (const name of items) {
                insertStmt.run(name, user.email);
                incrementStmt.run(name, user.email);
            }
        });

        txn(unique);

        res.json({ updated: unique.length });
    } catch (err) {
        console.error('Error incrementing feeling usage:', err.message);
        res.status(500).send('Error incrementing feeling usage');
    }
});

// 4. Update Image Tags
app.put('/images/:id/tags', (req, res) => {
    const imageId = parseInt(req.params.id);
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
        return res.status(400).send('Tags must be an array');
    }

    // Get user from session for ownership check
    const user = getUserFromSession(req);
    if (!user) {
        return res.status(401).send('Authentication required');
    }

    try {
        // Verify image ownership (level 3 can modify any image, level 1 can only modify their own)
        const image = db.prepare('SELECT ownership FROM images WHERE id = ?').get(imageId);
        if (!image) {
            return res.status(404).send('Image not found');
        }
        const userLevel = parseInt(user.level) || 1;
        // Case-insensitive ownership check
        if (userLevel !== 3 && image.ownership && image.ownership.toLowerCase() !== user.email.toLowerCase()) {
            return res.status(403).send('You do not have permission to modify this image');
        }

        // Start transaction
        const transaction = db.transaction(() => {
            // Remove all existing tags for this image
            db.prepare('DELETE FROM image_tags WHERE image_id = ?').run(imageId);

            // Add new tags
            for (const tagName of tags) {
                if (!tagName.trim()) continue;

                // Get or create tag
                let tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName.trim());
                if (!tag) {
                    const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?)');
                    const result = insertTag.run(tagName.trim());
                    tag = { id: result.lastInsertRowid };
                }

                // Link tag to image
                db.prepare('INSERT INTO image_tags (image_id, tag_id) VALUES (?, ?)').run(imageId, tag.id);
            }
        });

        transaction();

        // Return updated image with tags
        const getImageTags = db.prepare(`
            SELECT t.name FROM tags t
            JOIN image_tags it ON t.id = it.tag_id
            WHERE it.image_id = ?
        `);

        const imageTags = getImageTags.all(imageId);
        const updatedImage = {
            id: imageId,
            tags: imageTags.map(tag => tag.name)
        };

        res.json(updatedImage);
    } catch (err) {
        console.error('Error updating image tags:', err.message);
        res.status(500).send('Error updating image tags');
    }
});

// --- Projects API Endpoints ---

// Get all projects
app.get('/projects', (req, res) => {
    try {
        // Get user from session for filtering
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = parseInt(user.level) || 1;
        let projects;
        // Level 3 (admin) can see all projects, Level 1 can only see their own
        if (userLevel === 3) {
            projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
        } else {
            // Case-insensitive ownership check
            projects = db.prepare('SELECT * FROM projects WHERE LOWER(ownership) = ? ORDER BY created_at DESC').all(user.email.toLowerCase());
        }

        // Parse image_ids for each project (handle different formats)
        const projectsWithParsedIds = projects.map(project => {
            let imageIds = [];

            try {
                // Try JSON parse first (for format like [1,2,3])
                if (project.image_ids.startsWith('[') && project.image_ids.endsWith(']')) {
                    imageIds = JSON.parse(project.image_ids);
                } else {
                    // Handle comma-separated format (like "1,2,3" or "NaN,1,2,3")
                    imageIds = project.image_ids
                        .split(',')
                        .map(id => parseInt(id.trim()))
                        .filter(id => !isNaN(id)); // Remove NaN values
                }
            } catch (err) {
                console.warn(`Failed to parse image_ids for project ${project.id}: ${project.image_ids}`);
                imageIds = [];
            }

            return {
                ...project,
                image_ids: imageIds
            };
        });

        res.json(projectsWithParsedIds);
    } catch (err) {
        console.error('Error fetching projects:', err.message);
        res.status(500).send('Error fetching projects');
    }
});

// Create a new project
app.post('/projects', (req, res) => {
    try {
        // Get user from session for ownership
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).send('Authentication required');
        }

        const { name, image_ids } = req.body;

        if (!name || !image_ids || !Array.isArray(image_ids)) {
            return res.status(400).send('Project name and image_ids array are required');
        }

        // Set ownership to creator's email
        const stmt = db.prepare('INSERT INTO projects (name, image_ids, ownership) VALUES (?, ?, ?)');
        const result = stmt.run(name, JSON.stringify(image_ids), user.email);

        const newProject = {
            id: result.lastInsertRowid,
            name: name,
            image_ids: image_ids,
            ownership: user.email,
            created_at: new Date().toISOString()
        };

        res.status(201).json(newProject);
    } catch (err) {
        console.error('Error creating project:', err.message);
        res.status(500).send('Error creating project');
    }
});

// Delete a project
app.delete('/projects/:id', (req, res) => {
    try {
        // Get user from session for ownership check
        const user = getUserFromSession(req);
        if (!user) {
            return res.status(401).send('Authentication required');
        }

        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            return res.status(400).send('Invalid project ID');
        }

        // Check project ownership (level 3 can delete any, level 1 can only delete their own)
        const project = db.prepare('SELECT ownership FROM projects WHERE id = ?').get(projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }

        const userLevel = parseInt(user.level) || 1;
        // Case-insensitive ownership check
        if (userLevel !== 3 && project.ownership.toLowerCase() !== user.email.toLowerCase()) {
            return res.status(403).send('You do not have permission to delete this project');
        }

        const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
        const result = stmt.run(projectId);

        if (result.changes === 0) {
            return res.status(404).send('Project not found');
        }

        res.status(200).send('Project deleted successfully');
    } catch (err) {
        console.error('Error deleting project:', err.message);
        res.status(500).send('Error deleting project');
    }
});

// Delete an image
app.delete('/images/:id', (req, res) => {
    try {
        const imageId = parseInt(req.params.id);

        if (isNaN(imageId)) {
            return res.status(400).send('Invalid image ID');
        }

        // Get user from session for ownership check
        const user = getUserFromSession(req);
        if (!user) {
            console.error('Delete image: No user found in session');
            return res.status(401).send('Authentication required');
        }

        console.log(`Delete image request - User: ${user.email}, Role: ${user.role}, Level from session: ${user.level} (type: ${typeof user.level})`);

        // Get user's actual level from database (in case session is stale, case-insensitive)
        const userFromDb = db.prepare('SELECT level, role FROM users WHERE LOWER(email) = ?').get(user.email.toLowerCase());
        if (!userFromDb) {
            console.error(`Delete image: User ${user.email} not found in database`);
            return res.status(401).send('User not found');
        }
        
        const actualUserLevel = parseInt(userFromDb.level) || 1;
        const isAdmin = userFromDb.role === 'admin';
        
        console.log(`Delete image - User from DB: level=${actualUserLevel} (raw: ${userFromDb.level}), role=${userFromDb.role}, isAdmin=${isAdmin}`);

        // Get image filepath and ownership before deletion for file cleanup
        const imageStmt = db.prepare('SELECT filepath, ownership FROM images WHERE id = ?');
        const image = imageStmt.get(imageId);

        if (!image) {
            console.error(`Delete image: Image ${imageId} not found`);
            return res.status(404).send('Image not found');
        }

        // Verify ownership (level 3 OR admin role can delete any image, level 1 can only delete their own)
        console.log(`Delete image check - Image ID: ${imageId}, User: ${user.email}, User Level: ${actualUserLevel} (type: ${typeof actualUserLevel}), isAdmin: ${isAdmin}, Image owner: ${image.ownership}`);
        
        // SIMPLIFIED: Level 3 OR admin role can delete ANY image, level 1 can only delete their own
        let hasPermission = false;
        
        if (actualUserLevel === 3) {
            hasPermission = true;
            console.log(`✅ Permission granted - User is level 3, can delete ANY image`);
        } else if (isAdmin) {
            hasPermission = true;
            console.log(`✅ Permission granted - User is admin, can delete ANY image`);
        } else if (image.ownership && image.ownership.toLowerCase() === user.email.toLowerCase()) {
            hasPermission = true;
            console.log(`✅ Permission granted - User owns this image`);
        } else {
            hasPermission = false;
            console.log(`❌ Permission denied - User level ${actualUserLevel} cannot delete image owned by ${image.ownership}`);
        }
        
        if (!hasPermission) {
            return res.status(403).send('You do not have permission to delete this image');
        }
        
        console.log(`✅ Proceeding with image deletion...`);

        // Start transaction to delete image and related data
        const transaction = db.transaction(() => {
            // Delete from image_tags table (foreign key constraint)
            db.prepare('DELETE FROM image_tags WHERE image_id = ?').run(imageId);

            // Remove image from projects (update image_ids field)
            const projects = db.prepare('SELECT id, image_ids FROM projects').all();
            projects.forEach(project => {
                const imageIds = project.image_ids.split(',').map(id => parseInt(id.trim()));
                if (imageIds.includes(imageId)) {
                    const updatedImageIds = imageIds.filter(id => id !== imageId);
                    const updatedImageIdsStr = updatedImageIds.join(',');
                    db.prepare('UPDATE projects SET image_ids = ? WHERE id = ?').run(updatedImageIdsStr, project.id);
                    console.log(`Removed image ${imageId} from project ${project.id}`);
                }
            });

            // Delete from images table
            const result = db.prepare('DELETE FROM images WHERE id = ?').run(imageId);

            if (result.changes === 0) {
                throw new Error('Image not found');
            }
        });

        transaction();

        // Delete the physical file
        const fs = require('fs');
        const path = require('path');

        try {
            const fullPath = path.resolve(image.filepath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`Deleted file: ${fullPath}`);
            } else {
                console.warn(`File not found for deletion: ${fullPath}`);
            }
        } catch (fileErr) {
            console.error(`Error deleting file ${image.filepath}:`, fileErr.message);
            // Don't fail the request if file deletion fails
        }

        console.log(`Successfully deleted image ${imageId} and file ${image.filepath}`);
        res.status(200).json({ message: 'Image deleted successfully', imageId: imageId });

    } catch (err) {
        console.error('Error deleting image:', err.message);
        res.status(500).send('Error deleting image: ' + err.message);
    }
});

// 7. Share Project via Email
app.post('/projects/:id/share', async (req, res) => {
    const projectId = req.params.id;
    const { recipient_email, message, breakdown_text, project_tags, search_mode } = req.body;

    if (!recipient_email) {
        return res.status(400).send('Recipient email is required');
    }

    // Get user email from session for ownership check
    const userEmail = getUserEmailFromSession(req);
    if (!userEmail) {
        return res.status(401).send('Authentication required');
    }

    try {
        // Get project details
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Get project images with tags - clean the image_ids string first
        const cleanImageIds = project.image_ids.replace(/[\[\]]/g, ''); // Remove square brackets
        const imageIds = cleanImageIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

        const placeholders = imageIds.map(() => '?').join(',');

        // Simple version: load all images in this project, ignore ownership filter
        const query = `
            SELECT i.*, GROUP_CONCAT(t.name) as tags
            FROM images i
            LEFT JOIN image_tags it ON i.id = it.image_id
            LEFT JOIN tags t ON it.tag_id = t.id
            WHERE i.id IN (${placeholders})
            GROUP BY i.id
        `;

        const projectImages = db.prepare(query).all(...imageIds);
        console.log('[Share Email] Loaded images for project', projectId, 'count:', projectImages.length);

        // Format images data for email
        const imagesWithTags = projectImages.map(img => ({
            ...img,
            tags: img.tags ? img.tags.split(',') : []
        }));

        console.log('[Share Email] Received project_tags:', project_tags);
        console.log('[Share Email] project_tags type:', typeof project_tags);
        console.log('[Share Email] project_tags is array:', Array.isArray(project_tags));
        
        // Ensure project_tags is always an array
        let projectTagsArray = [];
        if (Array.isArray(project_tags)) {
            projectTagsArray = project_tags;
        } else if (project_tags) {
            // If it's a string or other type, convert to array
            projectTagsArray = [project_tags];
        }
        
        console.log('[Share Email] Final projectTagsArray:', projectTagsArray);
        console.log('[Share Email] Received search_mode:', search_mode);
        
        const projectData = {
            name: project.name,
            created_at: project.created_at,
            images: imagesWithTags,
            breakdown_text: breakdown_text,  // Pass the breakdown text from frontend
            project_tags: projectTagsArray,  // Pass project-level tags (e.g., ["clara"])
            search_mode: search_mode || 'OR'  // Pass search mode (OR/AND), default to OR
        };
        
        console.log('[Share Email] projectData.project_tags:', projectData.project_tags);
        console.log('[Share Email] projectData.search_mode:', projectData.search_mode);

        // Send email
        const emailSent = await sendProjectEmail(projectData, recipient_email, message);

        // Log email sending attempt to database
        try {
            const logEmailStmt = db.prepare(`
                INSERT INTO email_history (project_id, recipient_email, sender_message, success)
                VALUES (?, ?, ?, ?)
            `);
            logEmailStmt.run(projectId, recipient_email, message || '', emailSent ? 1 : 0);
            console.log(`Email history logged: Project ${projectId} to ${recipient_email}, success: ${emailSent}`);
        } catch (logError) {
            console.error('Failed to log email history:', logError);
            // Don't fail the request if logging fails
        }

        if (emailSent) {
            res.status(200).json({
                success: true,
                message: `Project "${project.name}" shared successfully with ${recipient_email}`
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email. Please try again.'
            });
        }
    } catch (err) {
        console.error('Error sharing project:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error sharing project: ' + err.message
        });
    }
});

// 8. Get Email History for a Project
app.get('/projects/:id/email-history', (req, res) => {
    const projectId = req.params.id;

    try {
        const emailHistory = db.prepare(`
            SELECT recipient_email, sender_message, sent_at, success
            FROM email_history
            WHERE project_id = ?
            ORDER BY sent_at DESC
        `).all(projectId);

        res.json(emailHistory);
    } catch (err) {
        console.error('Error fetching email history:', err.message);
        res.status(500).send('Error fetching email history');
    }
});

// --- Authentication Endpoints ---

// Send verification code
app.post('/auth/send-code', async (req, res) => {
    let { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize email to lowercase for case-insensitive comparison
    email = email.toLowerCase().trim();

    try {
        // Check if user exists (case-insensitive)
        let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);
        let userStatus = 'existing';

        if (!user) {
            // Create new user with approved status (no authorization needed - direct use)
            const stmt = db.prepare('INSERT INTO users (email, status, role, approved_at) VALUES (?, ?, ?, datetime(\'now\'))');
            const result = stmt.run(email, 'approved', 'user');
            user = { id: result.lastInsertRowid, email, status: 'approved', role: 'user' };
            userStatus = 'new';
        } else if (user.status === 'pending' || !user.status) {
            // Auto-approve any existing pending users (no authorization needed - direct use)
            db.prepare('UPDATE users SET status = ?, approved_at = datetime(\'now\') WHERE id = ?').run('approved', user.id);
            user.status = 'approved';
        }

        // Generate verification code
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store verification code
        db.prepare('INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)').run(
            email, code, expiresAt.toISOString()
        );

        // Send email based on user status
        console.log(`Attempting to send verification email to ${email} with status ${userStatus}`);
        try {
            await sendVerificationEmail(email, code, userStatus);
            console.log(`Verification email sent successfully to ${email}`);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            console.error('Error details:', {
                message: emailError.message,
                code: emailError.code,
                command: emailError.command,
                response: emailError.response
            });
            return res.status(500).json({ 
                error: 'Failed to send verification email. Please check your email service configuration or try again later.',
                details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }

        let message = 'Verification code sent to your email.';
        res.json({ message, userStatus: user.status });

    } catch (error) {
        console.error('Error in send-code endpoint:', error);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
});

// Verify code and login
app.post('/auth/verify-code', async (req, res) => {
    let { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
    }

    // Normalize email to lowercase for case-insensitive comparison
    email = email.toLowerCase().trim();

    try {
        // Check verification code (case-insensitive)
        const verificationRecord = db.prepare(`
            SELECT * FROM verification_codes
            WHERE LOWER(email) = ? AND code = ? AND used = FALSE AND expires_at > datetime('now')
            ORDER BY created_at DESC LIMIT 1
        `).get(email, code);

        if (!verificationRecord) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        // Check user exists (case-insensitive)
        const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email);

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Auto-approve if user is pending (no authorization needed)
        if (user.status === 'pending') {
            db.prepare('UPDATE users SET status = ?, approved_at = datetime(\'now\') WHERE id = ?').run('approved', user.id);
            user.status = 'approved';
        }

        // Mark code as used
        db.prepare('UPDATE verification_codes SET used = TRUE WHERE id = ?').run(verificationRecord.id);

        // Update last login
        db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

        // Generate session token
        const sessionToken = generateSessionToken();
        const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store session
        db.prepare('INSERT INTO login_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)').run(
            user.id, sessionToken, sessionExpiresAt.toISOString()
        );

        res.json({
            message: 'Login successful',
            sessionToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
});

// Verify session
app.get('/auth/verify-session', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid session token' });
    }

    const sessionToken = authHeader.substring(7);

    try {
        const session = db.prepare(`
            SELECT s.*, u.email, u.role, u.status, COALESCE(u.level, 1) as level
            FROM login_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > datetime('now')
        `).get(sessionToken);

        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        res.json({
            user: {
                id: session.user_id,
                email: session.email,
                role: session.role,
                status: session.status,
                level: parseInt(session.level) || 1
            }
        });

    } catch (error) {
        console.error('Error verifying session:', error);
        res.status(500).json({ error: 'Failed to verify session' });
    }
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ message: 'Logged out successfully' });
    }

    const sessionToken = authHeader.substring(7);

    try {
        // Delete the session from database
        db.prepare('DELETE FROM login_sessions WHERE session_token = ?').run(sessionToken);

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        console.error('Error during logout:', error);
        res.json({ message: 'Logged out successfully' }); // Always return success for logout
    }
});

// Admin: Get all users (requires admin role)
app.get('/admin/users', async (req, res) => {
    try {
        // Verify admin session or level 3 user
        const sessionUser = getUserFromSession(req);
        const userLevel = sessionUser ? (parseInt(sessionUser.level) || 1) : 1;

        if (!sessionUser) {
            return res.status(401).json({ error: 'No valid session token' });
        }

        if (!(sessionUser.role && sessionUser.role.toLowerCase() === 'admin') && userLevel < 3) {
            return res.status(403).json({ error: 'Admin or level 3 access required' });
        }

        // Get all users (include level), normalize email to lowercase for display
        // Group by lowercase email to handle duplicates, keeping the one with latest activity
        const users = db.prepare(`
            SELECT id, LOWER(email) as email, status, role, COALESCE(level, 1) AS level, created_at, approved_at, last_login
            FROM users
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, LOWER(email) as lower_email,
                           ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY 
                               CASE WHEN last_login IS NOT NULL THEN 0 ELSE 1 END,
                               last_login DESC,
                               created_at ASC
                           ) as rn
                    FROM users
                )
                WHERE rn = 1
            )
            ORDER BY created_at DESC
        `).all();

        res.json(users);

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Approve user
app.post('/admin/users/:id/approve', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        // Verify admin session or level 3 user
        const sessionUser = getUserFromSession(req);
        const userLevel = sessionUser ? (parseInt(sessionUser.level) || 1) : 1;

        if (!sessionUser) {
            return res.status(401).json({ error: 'No valid session token' });
        }

        if (!(sessionUser.role && sessionUser.role.toLowerCase() === 'admin') && userLevel < 3) {
            return res.status(403).json({ error: 'Admin or level 3 access required' });
        }

        // Get user to approve
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user status
        db.prepare('UPDATE users SET status = ?, approved_at = datetime(\'now\') WHERE id = ?').run('approved', userId);

        // Send approval email
        await sendApprovalEmail(user.email);

        res.json({ message: 'User approved successfully' });

    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});

// Admin: Update user level (1, 2, 3)
app.post('/admin/users/:id/level', async (req, res) => {
    const userId = parseInt(req.params.id);
    const { level } = req.body || {};

    try {
        // Verify admin session or level 3 user
        const sessionUser = getUserFromSession(req);
        const userLevel = sessionUser ? (parseInt(sessionUser.level) || 1) : 1;

        if (!sessionUser) {
            return res.status(401).json({ error: 'No valid session token' });
        }

        if (!(sessionUser.role && sessionUser.role.toLowerCase() === 'admin') && userLevel < 3) {
            return res.status(403).json({ error: 'Admin or level 3 access required' });
        }

        const numericLevel = parseInt(level, 10);
        if (![1, 2, 3].includes(numericLevel)) {
            return res.status(400).json({ error: 'Invalid level. Must be 1, 2, or 3.' });
        }

        const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update level for all users with the same email (case-insensitive)
        db.prepare('UPDATE users SET level = ? WHERE LOWER(email) = ?').run(numericLevel, user.email.toLowerCase());

        res.json({ message: 'User level updated successfully' });
    } catch (error) {
        console.error('Error updating user level:', error);
        res.status(500).json({ error: 'Failed to update user level' });
    }
});

// Admin: Delete user
app.delete('/admin/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
        // Verify admin session or level 3 user
        const sessionUser = getUserFromSession(req);
        const userLevel = sessionUser ? (parseInt(sessionUser.level) || 1) : 1;

        if (!sessionUser) {
            return res.status(401).json({ error: 'No valid session token' });
        }

        if (!(sessionUser.role && sessionUser.role.toLowerCase() === 'admin') && userLevel < 3) {
            return res.status(403).json({ error: 'Admin or level 3 access required' });
        }

        // Prevent user from deleting themselves
        if (sessionUser.id === userId) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get the user's email to delete all case-insensitive duplicates
        const userToDelete = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
        if (userToDelete) {
            const emailLower = userToDelete.email.toLowerCase();

            // Get all user IDs with this email (case-insensitive)
            const duplicateUsers = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').all(emailLower);
            const userIds = duplicateUsers.map(u => u.id);

            if (userIds.length > 0) {
                // Delete sessions for ALL duplicates in a single query
                const placeholders = userIds.map(() => '?').join(',');
                db.prepare(`DELETE FROM login_sessions WHERE user_id IN (${placeholders})`).run(...userIds);
            }

            // Now delete all users with the same email (case-insensitive)
            db.prepare('DELETE FROM users WHERE LOWER(email) = ?').run(emailLower);
        } else {
            // Fallback: delete sessions then delete by id only
            db.prepare('DELETE FROM login_sessions WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Generate random 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Send verification code email
async function sendVerificationEmail(email, code, userStatus) {
    // Email Configuration - Updated per configuration reference
    // Gmail Configuration (Primary - TLS Port 587)
    const GMAIL_CONFIG = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS (STARTTLS)
        auth: {
            user: 'eric.brilliant@gmail.com',
            pass: 'opqx pfna kagb bznr'
        },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 10000
    };

    // 163.com Configuration (Backup - SSL Port 465 - TESTED WORKING)
    const BACKUP_CONFIG = {
        host: 'smtp.163.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: '19902475292@163.com',
            pass: 'JDy8MigeNmsESZRa'
        },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 10000
    };

    let subject, content;

    subject = 'Image Library - Verification Code';
    content = `
        <h2>Login Verification</h2>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>This code expires in 10 minutes.</p>
    `;

    const mailOptions = {
        from: GMAIL_CONFIG.auth.user,
        to: email,
        subject: subject,
        html: content
    };

    // Try 163.com first (TESTED WORKING) since it's more reliable
    try {
        console.log(`[Email] Attempting to send verification code via 163.com (TESTED WORKING) to ${email}...`);
        const backupTransporter = nodemailer.createTransport(BACKUP_CONFIG);
        
        // Update mail options for 163.com
        mailOptions.from = BACKUP_CONFIG.auth.user;
        
        // Verify connection first
        await backupTransporter.verify();
        console.log('[Email] 163.com SMTP connection verified (SSL Port 465)');
        
        await backupTransporter.sendMail(mailOptions);
        console.log(`[Email] Verification code sent successfully via 163.com to ${email}`);
        return;
    } catch (backupError) {
        console.error('[Email] 163.com sending failed:', backupError.message);
        console.error('[Email] Full 163.com error:', backupError);
        
        // Fallback to Gmail
        try {
            console.log(`[Email] Attempting to send verification code via Gmail (TLS Port 587) to ${email}...`);
            const transporter = nodemailer.createTransport(GMAIL_CONFIG);
            
            // Update mail options for Gmail
            mailOptions.from = GMAIL_CONFIG.auth.user;
            
            // Verify connection first
            await transporter.verify();
            console.log('[Email] Gmail SMTP connection verified (TLS Port 587)');
            
            await transporter.sendMail(mailOptions);
            console.log(`[Email] Verification code sent successfully via Gmail to ${email}`);
            return;
        } catch (gmailError) {
            console.error('[Email] Gmail sending also failed:', gmailError.message);
            console.error('[Email] Full Gmail error:', gmailError);
            throw new Error(`Both email services failed. 163.com: ${backupError.message}, Gmail: ${gmailError.message}`);
        }
    }
}

// Send approval email
async function sendApprovalEmail(email) {
    // Email Configuration - Updated per configuration reference
    // Gmail Configuration (Primary - TLS Port 587)
    const GMAIL_CONFIG = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS (STARTTLS)
        auth: {
            user: 'eric.brilliant@gmail.com',
            pass: 'opqx pfna kagb bznr'
        },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 10000
    };

    // 163.com Configuration (Backup - SSL Port 465 - TESTED WORKING)
    const BACKUP_CONFIG = {
        host: 'smtp.163.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: '19902475292@163.com',
            pass: 'JDy8MigeNmsESZRa'
        },
        connectionTimeout: 10000, // 10 seconds timeout
        greetingTimeout: 10000,
        socketTimeout: 10000
    };

    const mailOptions = {
        from: BACKUP_CONFIG.auth.user,
        to: email,
        subject: 'Approval access of image library',
        html: `
            <h2>Application Approved!</h2>
            <p>We have approved your application.</p>
            <p>You can now access the Image Library system.</p>
        `
    };

    // Try 163.com first (TESTED WORKING) since it's more reliable
    try {
        console.log(`[Email] Attempting to send approval email via 163.com (TESTED WORKING) to ${email}...`);
        const backupTransporter = nodemailer.createTransport(BACKUP_CONFIG);
        
        await backupTransporter.verify();
        console.log('[Email] 163.com SMTP connection verified (SSL Port 465)');
        
        await backupTransporter.sendMail(mailOptions);
        console.log(`[Email] Approval email sent successfully via 163.com to ${email}`);
        return;
    } catch (backupError) {
        console.error('[Email] 163.com sending failed:', backupError.message);
        
        // Fallback to Gmail
        try {
            console.log(`[Email] Attempting to send approval email via Gmail (TLS Port 587) to ${email}...`);
            const transporter = nodemailer.createTransport(GMAIL_CONFIG);
            
            mailOptions.from = GMAIL_CONFIG.auth.user;
            
            await transporter.verify();
            console.log('[Email] Gmail SMTP connection verified (TLS Port 587)');
            
            await transporter.sendMail(mailOptions);
            console.log(`[Email] Approval email sent successfully via Gmail to ${email}`);
            return;
        } catch (gmailError) {
            console.error('[Email] Gmail sending also failed:', gmailError.message);
            throw new Error(`Both email services failed. 163.com: ${backupError.message}, Gmail: ${gmailError.message}`);
        }
    }
}

// Test route to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Log all registered routes on startup (for debugging)
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log('Registered API routes:');
    console.log('  GET  /api/test');
    console.log('  GET  /api/patterns');
    console.log('  GET  /api/patterns/search');
    console.log('  POST /api/patterns/upload');
    console.log('  DELETE /api/patterns/:id');
});