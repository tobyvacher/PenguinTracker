import React, { useState, useEffect } from 'react';
import { Penguin } from '@shared/schema';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '@/contexts/ThemeContext';

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
    species: 'Southern Rockhopper Penguin', 
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
    species: 'Galápagos Penguin', 
    location: [-0.4304, -90.2853], 
    radius: 100000, 
    color: '#d35400',
    description: 'Found exclusively in the Galápagos Islands, the only penguin species living at the equator.'
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
  },
  { 
    species: 'Fiordland Penguin', 
    location: [-45.4167, 167.2500], 
    radius: 300000, 
    color: '#a55eea', 
    description: 'Found in the Fiordland region on the southwest corner of New Zealand\'s South Island.'
  },
  { 
    species: 'Snares Penguin', 
    location: [-48.0167, 166.6000], 
    radius: 200000, 
    color: '#eb4d4b', 
    description: 'Endemic to The Snares, a group of small islands off the south coast of New Zealand.' 
  },
  { 
    species: 'Erect-crested Penguin', 
    location: [-49.6833, 178.8167], 
    radius: 250000, 
    color: '#686de0', 
    description: 'Breeds on the Bounty and Antipodes Islands of New Zealand.' 
  },
  { 
    species: 'Northern Rockhopper Penguin', 
    location: [-37.0500, -12.3000], 
    radius: 400000, 
    color: '#badc58', 
    description: 'Found on Tristan da Cunha and Gough Island in the south Atlantic Ocean.' 
  },
  { 
    species: 'Royal Penguin', 
    location: [-54.6167, 158.8500], 
    radius: 350000, 
    color: '#ff9f43', 
    description: 'Endemic to Macquarie Island, halfway between Australia and Antarctica.' 
  }
];

interface PenguinMapProps {
  penguins: Penguin[];
  seenPenguins: number[];
}

// Component for Circle+Marker combination
const HabitatMarker = ({ 
  habitat, 
  isSeen, 
  matchingPenguin 
}: { 
  habitat: PenguinHabitat; 
  isSeen: boolean; 
  matchingPenguin: Penguin | undefined; 
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  return (
    <>
      <Circle
        center={habitat.location}
        radius={habitat.radius}
        pathOptions={{
          fillColor: habitat.color,
          fillOpacity: isSeen ? 0.6 : 0.2,
          color: isSeen ? habitat.color : "#888",
          weight: isSeen ? 2 : 1
        }}
      />
      
      <Marker position={habitat.location}>
        <Popup>
          <div className={`p-2 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="font-bold text-lg">{habitat.species}</h3>
            <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{habitat.description}</p>
            
            {matchingPenguin && (
              <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                <p><strong>Scientific Name:</strong> {matchingPenguin.scientificName}</p>
                <p><strong>Size:</strong> {matchingPenguin.size}</p>
                <p><strong>Weight:</strong> {matchingPenguin.weight}</p>
                <p><strong>Status:</strong> {isSeen ? 
                  <span className="text-green-500 font-bold">Spotted! ✓</span> : 
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Not yet spotted</span>
                }</p>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default function PenguinMap({ penguins, seenPenguins }: PenguinMapProps) {
  const [activeHabitat, setActiveHabitat] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Fix the Leaflet icon issue
  useEffect(() => {
    // Set default icon
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);
  
  // Match a penguin from our data with a habitat by name
  const getMatchingPenguin = (speciesName: string) => {
    // First try exact match
    const exactMatch = penguins.find(p => 
      p.name === speciesName
    );
    
    if (exactMatch) return exactMatch;
    
    // Then try normalized match (remove diacritics, lowercase, etc.)
    const normalizeString = (str: string) => 
      str.toLowerCase()
         .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
         .replace(/[^\w\s]/g, ""); // remove punctuation
    
    const normalizedSpeciesName = normalizeString(speciesName);
    
    const partialMatch = penguins.find(p => {
      const normalizedPenguinName = normalizeString(p.name);
      const normalizedScientificName = normalizeString(p.scientificName);
      
      return normalizedPenguinName.includes(normalizedSpeciesName) || 
             normalizedSpeciesName.includes(normalizedPenguinName) ||
             normalizedScientificName.includes(normalizedSpeciesName) ||
             normalizedSpeciesName.includes(normalizedScientificName);
    });
    
    return partialMatch;
  };

  // Check if a penguin is in our "seen" list
  const isPenguinSeen = (speciesName: string) => {
    const penguin = getMatchingPenguin(speciesName);
    const isSeen = penguin ? seenPenguins.includes(penguin.id) : false;
    
    // Add debugging to console for easier troubleshooting
    if (!penguin) {
      console.warn(`No matching penguin found for habitat: ${speciesName}`);
    } else if (isSeen) {
      console.log(`Penguin ${penguin.name} (ID: ${penguin.id}) matched with habitat ${speciesName} and is marked as seen.`);
    }
    
    return isSeen;
  };

  return (
    <div className={`${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} rounded-lg shadow-md p-4 mb-8 relative z-10`}>
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'} mb-4`}>Global Penguin Habitats</h2>
      
      {/* Map container */}
      <div className={`${isDark ? 'border-gray-600' : 'border'} rounded-lg overflow-hidden`} style={{ height: "500px" }}>
        <MapContainer 
          center={[-40, 0]} 
          zoom={2} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {penguinHabitats.map((habitat, index) => {
            const isSeen = isPenguinSeen(habitat.species);
            const matchingPenguin = getMatchingPenguin(habitat.species);
            
            return (
              <HabitatMarker
                key={index}
                habitat={habitat}
                isSeen={isSeen}
                matchingPenguin={matchingPenguin}
              />
            );
          })}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {penguinHabitats.map((habitat, index) => {
          const isSeen = isPenguinSeen(habitat.species);
          return (
            <div 
              key={index}
              className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                activeHabitat === habitat.species 
                  ? isDark ? 'bg-gray-700' : 'bg-slate-100' 
                  : ''
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
              <span className={`text-sm ${
                isSeen 
                  ? isDark ? 'font-medium text-white' : 'font-medium' 
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {habitat.species}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}