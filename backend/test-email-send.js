const nodemailer = require('nodemailer');

// Test Gmail configuration
const GMAIL_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'eric.brilliant@gmail.com',
        pass: 'opqx pfna kagb bznr'
    }
};

// Test Backup configuration
const BACKUP_CONFIG = {
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
        user: '19902475292@163.com',
        pass: 'JDy8MigeNmsESZRa'
    }
};

async function testEmail(config, configName) {
    console.log(`\n=== Testing ${configName} ===`);
    try {
        const transporter = nodemailer.createTransport(config);
        
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log(`✅ ${configName} connection verified successfully!`);
        
        console.log('Sending test email...');
        const testEmail = 'test@example.com'; // Change this to a real email for actual testing
        const mailOptions = {
            from: config.auth.user,
            to: testEmail,
            subject: 'Test Email from Image Library',
            html: '<p>This is a test email.</p>'
        };
        
        // Uncomment to actually send (be careful!)
        // await transporter.sendMail(mailOptions);
        // console.log(`✅ Test email sent successfully via ${configName}!`);
        console.log(`⚠️  Email sending skipped (uncomment in code to test actual sending)`);
        
        return true;
    } catch (error) {
        console.error(`❌ ${configName} failed:`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error message: ${error.message}`);
        console.error(`   Command: ${error.command}`);
        if (error.response) {
            console.error(`   Response: ${error.response}`);
        }
        if (error.responseCode) {
            console.error(`   Response code: ${error.responseCode}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('Starting email configuration tests...\n');
    
    const gmailResult = await testEmail(GMAIL_CONFIG, 'Gmail');
    const backupResult = await testEmail(BACKUP_CONFIG, '163.com Backup');
    
    console.log('\n=== Test Summary ===');
    console.log(`Gmail: ${gmailResult ? '✅ Working' : '❌ Failed'}`);
    console.log(`163.com: ${backupResult ? '✅ Working' : '❌ Failed'}`);
    
    if (!gmailResult && !backupResult) {
        console.log('\n⚠️  Both email services failed. Please check:');
        console.log('1. Gmail app password is valid and not expired');
        console.log('2. 163.com credentials are correct');
        console.log('3. Network/firewall allows SMTP connections');
        console.log('4. Email accounts are not locked or restricted');
    }
}

runTests().catch(console.error);

