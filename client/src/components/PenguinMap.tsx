import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Penguin } from '@shared/schema';

// Type for penguin habitat data
interface PenguinHabitat {
  species: string;
  location: [number, number];
  radius: number;
  color: string;
  description: string;
}

// Define penguin habitat locations
const penguinHabitats: PenguinHabitat[] = [
  { 
    species: 'Emperor Penguin', 
    location: [-75.0000, 0.0000], 
    radius: 1000000, 
    color: '#3498db',
    description: 'Found in Antarctica, Emperor Penguins are the tallest and heaviest of all living penguin species.'
  },
  { 
    species: 'King Penguin', 
    location: [-54.5000, -36.5000], 
    radius: 500000, 
    color: '#f1c40f',
    description: 'Found in sub-Antarctic islands such as South Georgia and Falkland Islands.'
  },
  { 
    species: 'Adélie Penguin', 
    location: [-66.0000, 120.0000], 
    radius: 800000, 
    color: '#e74c3c',
    description: 'Distributed around the entire Antarctic continent.'
  },
  { 
    species: 'Chinstrap Penguin', 
    location: [-62.0000, -58.0000], 
    radius: 600000, 
    color: '#9b59b6',
    description: 'Found in Antarctica, South Sandwich Islands, and other islands in the Southern Ocean.'
  },
  { 
    species: 'Gentoo Penguin', 
    location: [-51.7500, -59.0000], 
    radius: 500000, 
    color: '#2ecc71',
    description: 'Found in sub-Antarctic islands and the Antarctic Peninsula.'
  },
  { 
    species: 'Macaroni Penguin', 
    location: [-54.0000, -37.0000], 
    radius: 700000, 
    color: '#e67e22',
    description: 'Found on sub-Antarctic islands from the Indian to Atlantic Oceans.'
  },
  { 
    species: 'Rockhopper Penguins', 
    location: [-52.0000, -59.5000], 
    radius: 800000, 
    color: '#1abc9c',
    description: 'Found in sub-Antarctic islands across the Southern Ocean.'
  },
  { 
    species: 'African Penguin', 
    location: [-33.9249, 18.4241], 
    radius: 300000, 
    color: '#34495e',
    description: 'Found in South Africa and Namibia.'
  },
  { 
    species: 'Humboldt Penguin', 
    location: [-11.7724, -77.0063], 
    radius: 400000, 
    color: '#7f8c8d',
    description: 'Found along the coast of Chile and Peru.'
  },
  { 
    species: 'Magellanic Penguin', 
    location: [-42.7621, -65.0385], 
    radius: 600000, 
    color: '#16a085',
    description: 'Found along the coasts of Argentina, Chile, and the Falkland Islands.'
  },
  { 
    species: 'Galapagos Penguin', 
    location: [-0.4304, -90.2853], 
    radius: 100000, 
    color: '#d35400',
    description: 'Found exclusively in the Galapagos Islands, the only penguin species living at the equator.'
  },
  { 
    species: 'Little Blue Penguin', 
    location: [-43.5321, 172.6362], 
    radius: 600000, 
    color: '#3498db',
    description: 'Found in Australia and New Zealand.'
  },
  { 
    species: 'Yellow-eyed Penguin', 
    location: [-45.8301, 170.7073], 
    radius: 300000, 
    color: '#f39c12',
    description: 'Endemic to New Zealand.'
  }
];

interface PenguinMapProps {
  penguins: Penguin[];
  seenPenguins: number[];
}

export default function PenguinMap({ penguins, seenPenguins }: PenguinMapProps) {
  const [activeHabitat, setActiveHabitat] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState<boolean>(false);
  
  // Match a penguin from our data with a habitat by name
  const getMatchingPenguin = (speciesName: string) => {
    return penguins.find(p => 
      p.name.includes(speciesName) || 
      speciesName.includes(p.name) ||
      p.scientificName.includes(speciesName) ||
      speciesName.includes(p.scientificName)
    );
  };

  // Check if a penguin is in our "seen" list
  const isPenguinSeen = (speciesName: string) => {
    const penguin = getMatchingPenguin(speciesName);
    return penguin ? seenPenguins.includes(penguin.id) : false;
  };

  // Initialize the map with Leaflet after component mounts
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    // Only initialize once
    if (mapInitialized) return;
    
    // Dynamically import Leaflet modules
    const initMap = async () => {
      try {
        // Import Leaflet
        const L = await import('leaflet');
        
        // Fix default icon issue
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
        
        // Create map
        const map = L.map('penguin-map').setView([-40, 0], 2);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);
        
        // Add habitat markers and circles
        penguinHabitats.forEach(habitat => {
          // Create circle
          const isSeen = isPenguinSeen(habitat.species);
          
          const circle = L.circle(habitat.location, {
            radius: habitat.radius,
            color: isSeen ? habitat.color : "#888",
            fillColor: habitat.color,
            fillOpacity: isSeen ? 0.6 : 0.2,
            weight: isSeen ? 2 : 1
          }).addTo(map);
          
          // Create popup
          const matchingPenguin = getMatchingPenguin(habitat.species);
          let popupContent = `
            <div class="p-2">
              <h3 class="font-bold text-lg">${habitat.species}</h3>
              <p class="text-sm mb-2">${habitat.description}</p>
          `;
          
          if (matchingPenguin) {
            popupContent += `
              <div class="text-sm">
                <p><strong>Scientific Name:</strong> ${matchingPenguin.scientificName}</p>
                <p><strong>Height:</strong> ${matchingPenguin.height} cm</p>
                <p><strong>Status:</strong> ${isSeen ? 'Spotted! ✓' : 'Not yet spotted'}</p>
              </div>
            `;
          }
          
          popupContent += `</div>`;
          
          // Add marker with popup
          L.marker(habitat.location)
            .addTo(map)
            .bindPopup(popupContent);
        });
        
        setMapInitialized(true);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    
    initMap();
    
    // Cleanup function
    return () => {
      const mapElement = document.getElementById('penguin-map');
      if (mapElement) {
        mapElement.innerHTML = '';
      }
    };
  }, [penguins, seenPenguins, mapInitialized]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-8">
      <h2 className="text-2xl font-bold text-[#1E3A8A] mb-4">Global Penguin Habitats</h2>
      
      {/* Map container */}
      <div id="penguin-map" className="border rounded-lg overflow-hidden" style={{ height: "500px" }}></div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {penguinHabitats.map((habitat, index) => {
          const isSeen = isPenguinSeen(habitat.species);
          return (
            <div 
              key={index}
              className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                activeHabitat === habitat.species ? 'bg-slate-100' : ''
              }`}
              onClick={() => setActiveHabitat(habitat.species === activeHabitat ? null : habitat.species)}
            >
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ 
                  backgroundColor: habitat.color,
                  opacity: isSeen ? 1 : 0.4 
                }} 
              />
              <span className={`text-sm ${isSeen ? 'font-medium' : 'text-gray-500'}`}>
                {habitat.species}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}