import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to penguin-data.ts
const penguinDataPath = path.join(__dirname, 'client', 'src', 'lib', 'penguin-data.ts');

// New height data
const penguinHeights = {
  "Emperor Penguin": "100–122 cm (39–48 in)",
  "King Penguin": "85–95 cm (33–37 in)",
  "Gentoo Penguin": "70–90 cm (28–35 in)",
  "Macaroni Penguin": "70–75 cm (28–30 in)",
  "Adélie Penguin": "70–73 cm (28–29 in)",
  "Chinstrap Penguin": "68–76 cm (27–30 in)",
  "Royal Penguin": "65–75 cm (26–30 in)",
  "Yellow-eyed Penguin": "62–79 cm (24–31 in)",
  "Magellanic Penguin": "61–76 cm (24–30 in)",
  "African Penguin": "60–70 cm (24–28 in)",
  "Humboldt Penguin": "56–70 cm (22–28 in)",
  "Fiordland Penguin": "55–60 cm (22–24 in)",
  "Snares Penguin": "50–63 cm (20–25 in)",
  "Erect-crested Penguin": "50–70 cm (20–28 in)",
  "Northern Rockhopper Penguin": "50–55 cm (20–22 in)",
  "Southern Rockhopper Penguin": "45–58 cm (18–23 in)",
  "Galápagos Penguin": "48–53 cm (19–21 in)",
  "Little Blue Penguin": "30–35 cm (12–14 in)"
};

// Read the file content
let content = fs.readFileSync(penguinDataPath, 'utf8');

// Update the heights for each penguin
Object.entries(penguinHeights).forEach(([penguinName, height]) => {
  // Create a regex pattern to find the size field for this penguin
  const pattern = new RegExp(`name: "${penguinName}",[\\s\\S]*?size: "([^"]+)"`, 'g');
  
  // Replace with the new height
  content = content.replace(pattern, (match, oldSize) => {
    return match.replace(`size: "${oldSize}"`, `size: "${height} tall"`);
  });
});

// Write the updated content back to the file
fs.writeFileSync(penguinDataPath, content, 'utf8');

console.log('Updated all penguin heights in penguin-data.ts');
