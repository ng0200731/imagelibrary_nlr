const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const appTag = '<script defer src="./assets/js/app.js"></script>';
const utilsTag = '<script defer src="./assets/js/modules/utils.js"></script>';
const apiTag = '<script defer src="./assets/js/modules/api.js"></script>';

if (!html.includes(appTag)) {
  console.error('Could not find app.js script tag.');
  process.exit(1);
}

if (!html.includes(utilsTag)) {
  console.error('Could not find utils.js script tag.');
  process.exit(1);
}

if (html.includes(apiTag)) {
  console.log('api already referenced');
  process.exit(0);
}

// Insert api.js after utils.js (before app.js)
html = html.replace(utilsTag, `${utilsTag}\n    ${apiTag}`);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Injected api.js after utils.js');

