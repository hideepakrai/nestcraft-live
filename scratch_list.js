const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

console.log("=== app/ ===");
try {
  walk('app').forEach(f => console.log(f));
} catch (e) {
  console.error(e);
}

console.log("\n=== components/pages/ ===");
try {
  walk('components/pages').forEach(f => console.log(f));
} catch (e) {
  console.error(e);
}
