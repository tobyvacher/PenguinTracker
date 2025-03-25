import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to penguin-data.ts
const penguinDataPath = path.join(__dirname, '../client/src/lib/penguin-data.ts');

// Read the file
let content = fs.readFileSync(penguinDataPath, 'utf8');

// Replace all occurrences of -bw.jpg in bwImageUrl with .jpg
content = content.replace(/bwImageUrl: "\/images\/penguins\/bw\/(.+)-bw\.jpg"/g, 'bwImageUrl: "/images/penguins/bw/$1.jpg"');

// Write the updated content back to the file
fs.writeFileSync(penguinDataPath, content, 'utf8');

console.log('Updated all bwImageUrl paths in penguin-data.ts');