const Database = require('better-sqlite3');
const db = new Database('pattern_database.sqlite', { verbose: console.log });

function setupPatternDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS patterns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filepath TEXT NOT NULL UNIQUE,
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
    console.log('Pattern database setup complete.');
}

setupPatternDatabase();
db.close();

