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

// Serve static files
app.use(express.static('../'));

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

// --- Database Connection ---
const db = new Database('database.sqlite');
console.log('Connected to the better-sqlite3 database.');

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
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

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
            const placeholders = tags.map(() => '?').join(',');
            let query;
            let params;

            if (mode.toUpperCase() === 'AND') {
                if (userLevel === 3) {
                    query = `
                        SELECT i.* FROM images i
                        JOIN image_tags it ON i.id = it.image_id
                        JOIN tags t ON it.tag_id = t.id
                        WHERE t.name IN (${placeholders})
                        GROUP BY i.id
                        HAVING COUNT(DISTINCT t.name) = ?
                    `;
                    params = [...tags, tags.length];
                } else {
                    query = `
                        SELECT i.* FROM images i
                        JOIN image_tags it ON i.id = it.image_id
                        JOIN tags t ON it.tag_id = t.id
                        WHERE i.ownership = ? AND t.name IN (${placeholders})
                        GROUP BY i.id
                        HAVING COUNT(DISTINCT t.name) = ?
                    `;
                    params = [userEmail, ...tags, tags.length];
                }
            } else { // OR
                if (userLevel === 3) {
                    query = `
                        SELECT DISTINCT i.* FROM images i
                        JOIN image_tags it ON i.id = it.image_id
                        JOIN tags t ON it.tag_id = t.id
                        WHERE t.name IN (${placeholders})
                    `;
                    params = tags;
                } else {
                    query = `
                        SELECT DISTINCT i.* FROM images i
                        JOIN image_tags it ON i.id = it.image_id
                        JOIN tags t ON it.tag_id = t.id
                        WHERE i.ownership = ? AND t.name IN (${placeholders})
                    `;
                    params = [userEmail, ...tags];
                }
            }
            images = db.prepare(query).all(params);
        }

        // Get tags for each image
        const getImageTags = db.prepare(`
            SELECT t.name FROM tags t
            JOIN image_tags it ON t.id = it.tag_id
            WHERE it.image_id = ?
        `);

        const imagesWithTags = images.map(image => {
            const imageTags = getImageTags.all(image.id);
            return {
                ...image,
                tags: imageTags.map(tag => tag.name)
            };
        });

        res.json(imagesWithTags);
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
            // Search for tags that contain the query string
            tags = db.prepare(`
                SELECT name, COUNT(it.image_id) as usage_count
                FROM tags t
                LEFT JOIN image_tags it ON t.id = it.tag_id
                WHERE LOWER(t.name) LIKE ?
                GROUP BY t.id, t.name
                ORDER BY usage_count DESC, t.name ASC
            `).all(`%${query}%`);
        } else {
            // Get all tags with usage count
            tags = db.prepare(`
                SELECT name, COUNT(it.image_id) as usage_count
                FROM tags t
                LEFT JOIN image_tags it ON t.id = it.tag_id
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
                WHERE user_email = ?
                ORDER BY count DESC, name ASC
            `).all(user.email);
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
        if (userLevel !== 3 && image.ownership !== user.email) {
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
            projects = db.prepare('SELECT * FROM projects WHERE ownership = ? ORDER BY created_at DESC').all(user.email);
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
        if (userLevel !== 3 && project.ownership !== user.email) {
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

        // Get user's actual level from database (in case session is stale)
        const userFromDb = db.prepare('SELECT level, role FROM users WHERE email = ?').get(user.email);
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
        } else if (image.ownership === user.email) {
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
    const { recipient_email, message, breakdown_text } = req.body;

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
        const query = `
            SELECT i.*, GROUP_CONCAT(t.name) as tags
            FROM images i
            LEFT JOIN image_tags it ON i.id = it.image_id
            LEFT JOIN tags t ON it.tag_id = t.id
            WHERE i.id IN (${placeholders}) AND i.ownership = ?
            GROUP BY i.id
        `;

        const projectImages = db.prepare(query).all(...imageIds, userEmail);

        // Format images data for email
        const imagesWithTags = projectImages.map(img => ({
            ...img,
            tags: img.tags ? img.tags.split(',') : []
        }));

        const projectData = {
            name: project.name,
            created_at: project.created_at,
            images: imagesWithTags,
            breakdown_text: breakdown_text  // Pass the breakdown text from frontend
        };

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
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and code are required' });
    }

    try {
        // Check verification code
        const verificationRecord = db.prepare(`
            SELECT * FROM verification_codes
            WHERE email = ? AND code = ? AND used = FALSE AND expires_at > datetime('now')
            ORDER BY created_at DESC LIMIT 1
        `).get(email, code);

        if (!verificationRecord) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        // Check user exists
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

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
            SELECT s.*, u.email, u.role, u.status
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
                status: session.status
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid session token' });
    }

    const sessionToken = authHeader.substring(7);

    try {
        // Verify admin session
        const session = db.prepare(`
            SELECT s.*, u.email, u.role
            FROM login_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.role = 'admin'
        `).get(sessionToken);

        if (!session) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Get all users
        const users = db.prepare(`
            SELECT id, email, status, role, created_at, approved_at, last_login
            FROM users
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
    const authHeader = req.headers.authorization;
    const userId = parseInt(req.params.id);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid session token' });
    }

    const sessionToken = authHeader.substring(7);

    try {
        // Verify admin session
        const session = db.prepare(`
            SELECT s.*, u.email, u.role
            FROM login_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.role = 'admin'
        `).get(sessionToken);

        if (!session) {
            return res.status(403).json({ error: 'Admin access required' });
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

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});