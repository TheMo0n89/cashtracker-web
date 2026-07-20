const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src', 'app', '(dashboard)');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = walkSync(dirPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Backgrounds & Borders
  content = content.replace(/bg-white\/5/g, 'bg-[var(--color-element-bg)]');
  content = content.replace(/bg-white\/10/g, 'bg-[var(--color-element-bg-hover)]');
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-[var(--color-element-bg-hover)]');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-[var(--color-element-bg-hover)]');
  content = content.replace(/border-white\/5/g, 'border-[var(--color-element-border)]');
  content = content.replace(/border-white\/10/g, 'border-[var(--color-element-border)]');
  content = content.replace(/bg-black\/60/g, 'bg-[var(--color-overlay)]');
  content = content.replace(/bg-black\/10/g, 'bg-[var(--color-element-bg)]');
  content = content.replace(/bg-black\/20/g, 'bg-[var(--color-element-bg)]');
  
  // Text
  content = content.replace(/text-white\/90/g, 'text-[var(--color-text-primary)]');
  
  // Carefully replace text-white EXCEPT where it is inside a gradient or button or certain patterns.
  // In Next.js className strings, it's safer to just replace 'text-white' if it's NOT preceded by something that needs it.
  // Actually, btn-primary has it hardcoded in CSS, so TSX doesn't have it except maybe in text-gradient? No.
  // Let's replace 'text-white' that is preceded by space or quote.
  // And avoid matching 'text-white' in settings avatar which has 'text-white shadow-lg'
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    if (line.includes('bg-[var(--color-primary)]') || line.includes('bg-gradient')) {
      return line; // Skip lines with primary background or gradients to keep text-white
    }
    let newLine = line.replace(/([ '"`])text-white([^a-zA-Z0-9\/-])/g, '$1text-[var(--color-text-primary)]$2');
    newLine = newLine.replace(/([ '"`])hover:text-white([^a-zA-Z0-9\/-])/g, '$1hover:text-[var(--color-text-primary)]$2');
    return newLine;
  });

  fs.writeFileSync(file, newLines.join('\n'));
});

console.log('Replacement complete.');
