const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');
if (html.includes('assets/js/modules/utils.js')) {
  console.log('utils already referenced');
  process.exit(0);
}

const appTag = '<script defer src="./assets/js/app.js"></script>';
const utilsTag = '<script defer src="./assets/js/modules/utils.js"></script>';

if (!html.includes(appTag)) {
  console.error('Could not find app.js script tag to inject before.');
  process.exit(1);
}

html = html.replace(appTag, `${utilsTag}\n    ${appTag}`);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Injected utils.js before app.js');

