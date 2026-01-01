const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const indexPath = path.join(projectRoot, 'index.html');
const extractedJsPath = path.join(projectRoot, 'assets', 'js', 'app.inline-extracted.js');
const finalJsPath = path.join(projectRoot, 'assets', 'js', 'app.js');

console.log('Starting refactor...');

try {
    // 1. Create assets/js/app.js from the extracted content
    if (!fs.existsSync(extractedJsPath)) {
        throw new Error(`Source file not found: ${extractedJsPath}`);
    }
    const extractedCode = fs.readFileSync(extractedJsPath, 'utf8');
    fs.writeFileSync(finalJsPath, extractedCode, 'utf8');
    console.log(`✅ Created ${finalJsPath}`);

    // 2. Read index.html and replace the inline script
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    const scriptTag = '<script defer src="./assets/js/app.js"></script>';
    
    // This regex finds the first <script> block that is not self-closing and has content
    const updatedHtmlContent = htmlContent.replace(
        /<script[^>]*>([\s\S]*?)<\/script>/,
        scriptTag
    );

    if (htmlContent === updatedHtmlContent) {
        console.warn('⚠️  Warning: No inline script was found or replaced in index.html. The file might have been modified already.');
    } else {
        // 3. Write the modified content back to index.html
        fs.writeFileSync(indexPath, updatedHtmlContent, 'utf8');
        console.log('✅ Updated index.html to use external script.');
    }

    console.log('✨ Refactor complete!');

} catch (error) {
    console.error('❌ An error occurred during refactoring:', error);
    process.exit(1);
}

