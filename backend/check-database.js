const Database = require('better-sqlite3');

try {
    const db = new Database('database.sqlite');
    
    console.log('Checking database tables...\n');
    
    // Check verification_codes table
    const verificationTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'").get();
    if (verificationTable) {
        console.log('✅ verification_codes table exists');
        
        // Check table structure
        const columns = db.prepare("PRAGMA table_info(verification_codes)").all();
        console.log('   Columns:', columns.map(c => c.name).join(', '));
    } else {
        console.log('❌ verification_codes table does NOT exist');
        console.log('   Run: node setup-user-system.js to create it');
    }
    
    // Check users table
    const usersTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (usersTable) {
        console.log('✅ users table exists');
    } else {
        console.log('❌ users table does NOT exist');
    }
    
    // Check login_sessions table
    const sessionsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='login_sessions'").get();
    if (sessionsTable) {
        console.log('✅ login_sessions table exists');
    } else {
        console.log('❌ login_sessions table does NOT exist');
    }
    
    db.close();
    console.log('\n✅ Database check complete');
} catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
}

