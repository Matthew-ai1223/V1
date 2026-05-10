const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules') {
        walkDir(dirPath, callback);
      }
    } else {
      if (dirPath.endsWith('.js') || dirPath.endsWith('.html') || dirPath.endsWith('.css')) {
        callback(dirPath);
      }
    }
  });
}

walkDir(__dirname, (filePath) => {
  if (filePath.includes('scaffold')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.endsWith('\\n')) {
    fs.writeFileSync(filePath, content.slice(0, -2));
  }
});
console.log("Fixed files");
