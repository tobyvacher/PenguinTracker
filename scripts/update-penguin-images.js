import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to penguin-data.ts
const penguinDataPath = path.join(__dirname, '../client/src/lib/penguin-data.ts');

// Map of penguin names to their actual image files
const penguinImageMap = {
  'Little Blue Penguin': 'Little-Penguin-Headshot-Stephen-Dann-Wikimedia-1-600x403.jpg.jpeg',
  'Fairy Penguin': 'Little-Penguin-Headshot-Stephen-Dann-Wikimedia-1-600x403.jpg.jpeg',
  'Rockhopper Penguin': 'Northern-Rockhopper-Headshot-Antoine-Lamielle-Wikimedia-600x403.jpg.jpeg',
  'Adélie Penguin': 'Adelie-Penguins-Headshots-owamux-Wikimedia-600x360.png',
  'Galápagos Penguin': 'Galapagos-Penguin-Headshot-Pedro-Szekely-Wikimedia-600x403.jpg.jpeg',
  'Snares Penguin': 'Snares.jpg.jpeg',
  'Erect-crested Penguin': 'Erect-crested-Penguin-Headshot-C00ch-Wikimedia-600x403.jpg.jpeg',
  'Gentoo Penguin': 'Gentoo-Penguin-Headshot-NasserHalaweh-Wikimedia-1-600x403.jpg.jpeg',
  'Fiordland Penguin': 'Fiordland_Crested_Penguin_-_Stewart_Island_-_New_Zealand_39070132111-600x403.jpg.jpeg',
  'African Penguin': 'African-penguin-resting-Bettys-Bay-by-Dyan-deNapoli-600x403.jpg.jpeg',
  'Magellanic Penguin': 'Magellanic-Penguins-Headshots-PI-Photo-Library-1-600x403.jpg.jpeg',
  'Humboldt Penguin': 'Humboldt-Penguin-Headshot-H.-Zell-Wikimedia-1-600x403.jpg.jpeg',
  'Royal Penguin': 'Royal-Penguin-Horizontal-Ellen-Rykers-Wikimedia-600x403.jpg.jpeg',
  'Chinstrap Penguin': 'Chinstrap-Penguin-Headshot-Jerzy-Strzelecki-Wikimedia-1-e1740430314605-600x403.jpg.jpeg',
  'Macaroni Penguin': 'Macaroni-Penguin-Headshot-PI-Photo-Library-600x403.jpg.jpeg',
  'Yellow-eyed Penguin': 'Yellow-Eyed-Penguin-Headshot-Bernard-Spragg-Wikimedia-600x403.jpg.jpeg',
  'King Penguin': 'King-Penguin-Headshot-PI-Photo-Library-1-600x403.jpg.jpeg',
  'Emperor Penguin': 'Emperor-Penguin-600x403.jpg.jpeg'
};

// Read the file
let content = fs.readFileSync(penguinDataPath, 'utf8');

// For each penguin, update the image paths
Object.entries(penguinImageMap).forEach(([penguinName, imageName]) => {
  // Create regex pattern to find the image paths for this penguin
  const pattern = new RegExp(`name: "${penguinName}",[\\s\\S]*?imageUrl: "([^"]+)",[\\s\\S]*?bwImageUrl: "([^"]+)"`, 'g');
  
  // Replace with the new image paths
  content = content.replace(pattern, (match, oldImage, oldBwImage) => {
    return match.replace(
      `imageUrl: "${oldImage}",`,
      `imageUrl: "/images/penguins/${imageName}",`
    ).replace(
      `bwImageUrl: "${oldBwImage}"`,
      `bwImageUrl: "/images/penguins/${imageName}"`
    );
  });
});

// Write the updated content back to the file
fs.writeFileSync(penguinDataPath, content, 'utf8');

console.log('Updated all image paths in penguin-data.ts');