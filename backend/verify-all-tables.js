const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

console.log('=== Verifying All Database Tables ===\n');

const requiredTables = [
    'images',
    'tags',
    'image_tags',
    'projects',
    'users',
    'verification_codes',
    'login_sessions',
    'email_history'
];

const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);

console.log('Required tables:');
requiredTables.forEach(table => {
    if (existingTables.includes(table)) {
        console.log(`  ✅ ${table}`);
    } else {
        console.log(`  ❌ ${table} - MISSING`);
    }
});

console.log('\nAll existing tables:');
existingTables.forEach(table => {
    console.log(`  - ${table}`);
});

db.close();
console.log('\n✅ Verification complete');

