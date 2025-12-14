const nodemailer = require('nodemailer');

// Test the exact configuration used in sendVerificationEmail
const BACKUP_CONFIG = {
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
        user: '19902475292@163.com',
        pass: 'JDy8MigeNmsESZRa'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
};

const GMAIL_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'eric.brilliant@gmail.com',
        pass: 'opqx pfna kagb bznr'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
};

async function testActualEmailSending() {
    const testEmail = process.argv[2] || 'test@example.com';
    const testCode = '123456';
    
    console.log(`Testing verification email sending to: ${testEmail}\n`);
    
    // Test 163.com first
    console.log('=== Testing 163.com (Primary) ===');
    try {
        const transporter = nodemailer.createTransport(BACKUP_CONFIG);
        
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified');
        
        const mailOptions = {
            from: BACKUP_CONFIG.auth.user,
            to: testEmail,
            subject: 'Image Library - Verification Code',
            html: `
                <h2>Login Verification</h2>
                <p>Your verification code is: <strong>${testCode}</strong></p>
                <p>This code expires in 10 minutes.</p>
            `
        };
        
        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via 163.com!');
        console.log('Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ 163.com failed:');
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Command:', error.command);
        console.error('   Response:', error.response);
        console.error('   Full error:', error);
        
        // Try Gmail
        console.log('\n=== Testing Gmail (Backup) ===');
        try {
            const transporter = nodemailer.createTransport(GMAIL_CONFIG);
            
            console.log('Verifying connection...');
            await transporter.verify();
            console.log('✅ Connection verified');
            
            const mailOptions = {
                from: GMAIL_CONFIG.auth.user,
                to: testEmail,
                subject: 'Image Library - Verification Code',
                html: `
                    <h2>Login Verification</h2>
                    <p>Your verification code is: <strong>${testCode}</strong></p>
                    <p>This code expires in 10 minutes.</p>
                `
            };
            
            console.log('Sending email...');
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully via Gmail!');
            console.log('Message ID:', info.messageId);
            return true;
        } catch (gmailError) {
            console.error('❌ Gmail also failed:');
            console.error('   Code:', gmailError.code);
            console.error('   Message:', gmailError.message);
            console.error('   Command:', gmailError.command);
            console.error('   Response:', gmailError.response);
            console.error('   Full error:', gmailError);
            return false;
        }
    }
}

testActualEmailSending()
    .then(success => {
        if (success) {
            console.log('\n✅ Email sending test PASSED');
            process.exit(0);
        } else {
            console.log('\n❌ Email sending test FAILED');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n❌ Test error:', error);
        process.exit(1);
    });

