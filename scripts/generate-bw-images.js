const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { penguinData } = require('../client/src/lib/penguin-data');

// Create directories if they don't exist
const penguinsDir = path.join(__dirname, '../public/images/penguins');
const bwDir = path.join(penguinsDir, 'bw');

if (!fs.existsSync(penguinsDir)) {
  fs.mkdirSync(penguinsDir, { recursive: true });
}

if (!fs.existsSync(bwDir)) {
  fs.mkdirSync(bwDir, { recursive: true });
}

// Generate black and white versions of all penguin images
function generateBWImages() {
  try {
    // Install ImageMagick if needed
    execSync('which convert || echo "ImageMagick not installed"');
    
    penguinData.forEach(penguin => {
      const originalFileName = penguin.name.toLowerCase().replace(/[\s-]+/g, '-') + '.jpg';
      const originalFilePath = path.join(penguinsDir, originalFileName);
      const bwFileName = originalFileName.replace('.jpg', '-bw.jpg');
      const bwFilePath = path.join(bwDir, bwFileName);
      
      if (fs.existsSync(originalFilePath)) {
        // Use ImageMagick to convert the image to black and white
        try {
          execSync(`convert "${originalFilePath}" -colorspace Gray "${bwFilePath}"`);
          console.log(`Generated B&W image: ${bwFilePath}`);
        } catch (error) {
          console.error(`Error generating B&W image for ${penguin.name}:`, error.message);
        }
      } else {
        console.warn(`Original image not found for ${penguin.name} at ${originalFilePath}`);
      }
    });
    
    console.log('B&W image generation completed!');
  } catch (error) {
    console.error('Error generating B&W images:', error.message);
    if (error.message.includes('ImageMagick not installed')) {
      console.log('Please install ImageMagick to generate black and white images.');
    }
  }
}

generateBWImages();