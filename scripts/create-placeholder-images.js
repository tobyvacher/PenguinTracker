import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { penguinData } from './penguin-data.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const penguinsDir = path.join(__dirname, '../public/images/penguins');
const bwDir = path.join(penguinsDir, 'bw');

if (!fs.existsSync(penguinsDir)) {
  fs.mkdirSync(penguinsDir, { recursive: true });
}

if (!fs.existsSync(bwDir)) {
  fs.mkdirSync(bwDir, { recursive: true });
}

// Copy the test.jpg to create placeholder images for each penguin
async function createPlaceholderImages() {
  try {
    // Read the test.jpg file
    const testImagePath = path.join(__dirname, '../test.jpg');
    const imageData = fs.readFileSync(testImagePath);
    
    // Create color and black & white versions for each penguin
    penguinData.forEach(penguin => {
      const fileName = penguin.name.toLowerCase().replace(/[\s-]+/g, '-') + '.jpg';
      const colorFilePath = path.join(penguinsDir, fileName);
      const bwFilePath = path.join(bwDir, fileName);
      
      // Copy the test image to both color and bw directories
      fs.writeFileSync(colorFilePath, imageData);
      fs.writeFileSync(bwFilePath, imageData);
      
      console.log(`Created placeholder images for ${penguin.name}`);
    });
    
    console.log('All placeholder images created successfully!');
  } catch (error) {
    console.error('Error creating placeholder images:', error);
  }
}

createPlaceholderImages();