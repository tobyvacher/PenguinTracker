const fs = require('fs');
const path = require('path');
const https = require('https');
const { penguinData } = require('../client/src/lib/penguin-data');

// Map of penguin names to Flickr image IDs (public domain or Creative Commons images)
// These are just placeholder URLs - replace with actual public domain images
const penguinImageUrls = {
  'Little Blue Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Little_blue_penguin_at_the_Melbourne_Zoo.jpg/800px-Little_blue_penguin_at_the_Melbourne_Zoo.jpg',
  'Fairy Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Little_Penguin_Feb09.jpg/800px-Little_Penguin_Feb09.jpg',
  'Rockhopper Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Gorfou_sauteur_-_Southern_Rockhopper_Penguin.jpg/800px-Gorfou_sauteur_-_Southern_Rockhopper_Penguin.jpg',
  'Adélie Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Hope_Bay-2016-Trinity_Peninsula%E2%80%93Ad%C3%A9lie_penguin_%28Pygoscelis_adeliae%29_04.jpg/800px-Hope_Bay-2016-Trinity_Peninsula%E2%80%93Ad%C3%A9lie_penguin_%28Pygoscelis_adeliae%29_04.jpg',
  'Galápagos Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Spheniscus_mendiculus_-Galapagos_Islands-8.jpg/800px-Spheniscus_mendiculus_-Galapagos_Islands-8.jpg',
  'Snares Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Eudyptes_robustus_-Snares_Island_-head-8.jpg/800px-Eudyptes_robustus_-Snares_Island_-head-8.jpg',
  'Erect-crested Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Erect-crested_penguin_on_rock.jpg/800px-Erect-crested_penguin_on_rock.jpg',
  'Gentoo Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Gentoo_Penguin_at_Cooper_Bay%2C_South_Georgia.jpg/800px-Gentoo_Penguin_at_Cooper_Bay%2C_South_Georgia.jpg',
  'Fiordland Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Fiordland_Penguin_walking_into_water.jpg/800px-Fiordland_Penguin_walking_into_water.jpg',
  'African Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Boulders_Beach_Penguins_04.jpg/800px-Boulders_Beach_Penguins_04.jpg',
  'Magellanic Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Magellanic_penguin%2C_Valdes_Peninsula%2C_Argentina.jpg/800px-Magellanic_penguin%2C_Valdes_Peninsula%2C_Argentina.jpg',
  'Humboldt Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Humboldt_Penguin_RWD2.jpg/800px-Humboldt_Penguin_RWD2.jpg',
  'Royal Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Royal_penguin_on_rock.jpg/800px-Royal_penguin_on_rock.jpg',
  'Chinstrap Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/South_Shetland-2016-Deception_Island%E2%80%93Chinstrap_penguin_%28Pygoscelis_antarctica%29_04.jpg/800px-South_Shetland-2016-Deception_Island%E2%80%93Chinstrap_penguin_%28Pygoscelis_antarctica%29_04.jpg',
  'Macaroni Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Macaroni_Penguin_at_Cooper_Bay%2C_South_Georgia.jpg/800px-Macaroni_Penguin_at_Cooper_Bay%2C_South_Georgia.jpg',
  'Yellow-eyed Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Yellow-eyed_Penguin_MC.jpg/800px-Yellow-eyed_Penguin_MC.jpg', 
  'King Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Manchot_royal_-_King_Penguin.jpg/800px-Manchot_royal_-_King_Penguin.jpg',
  'Emperor Penguin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Manchot_empereur_-_Emperor_Penguin_-_Aptenodytes_forsteri.jpg/800px-Manchot_empereur_-_Emperor_Penguin_-_Aptenodytes_forsteri.jpg'
};

// Create directories if they don't exist
const penguinsDir = path.join(__dirname, '../public/images/penguins');
const bwDir = path.join(penguinsDir, 'bw');

if (!fs.existsSync(penguinsDir)) {
  fs.mkdirSync(penguinsDir, { recursive: true });
}

if (!fs.existsSync(bwDir)) {
  fs.mkdirSync(bwDir, { recursive: true });
}

// Function to download a file
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
        console.log(`Downloaded: ${destPath}`);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Download all penguin images
async function downloadPenguinImages() {
  const promises = [];
  
  penguinData.forEach(penguin => {
    const url = penguinImageUrls[penguin.name];
    if (url) {
      // Extract the file name from the URL for the path in penguin-data.ts
      const fileName = penguin.name.toLowerCase().replace(/[\s-]+/g, '-') + '.jpg';
      const colorFilePath = path.join(penguinsDir, fileName);
      const bwFilePath = path.join(bwDir, fileName.replace('.jpg', '-bw.jpg'));
      
      // Download color image
      promises.push(downloadFile(url, colorFilePath));
    }
  });

  try {
    await Promise.all(promises);
    console.log('All penguin images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading penguin images:', error);
  }
}

downloadPenguinImages();