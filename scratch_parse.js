const fs = require('fs');
const content = fs.readFileSync('e-commerce_updated 4.md', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('TARGET') || line.startsWith('##')) {
    console.log(`${index + 1}: ${line}`);
  }
});
