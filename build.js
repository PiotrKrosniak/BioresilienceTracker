const fs = require('fs');
const path = require('path');

// Read the index.html file
const indexPath = path.join(__dirname, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace the environment variables
indexContent = indexContent.replace(
  "window.GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';",
  `window.GOOGLE_MAPS_API_KEY = '${process.env.GOOGLE_MAPS_API_KEY}';`
);
indexContent = indexContent.replace(
  "window.SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';",
  `window.SPREADSHEET_ID = '${process.env.SPREADSHEET_ID}';`
);

// Write the modified content back to index.html
fs.writeFileSync(indexPath, indexContent); 