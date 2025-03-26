// This file manages the dynamic loading of Leaflet.js

// Define a type for the initialized Leaflet instance
type LeafletInstance = any;

// Store the loaded leaflet instance
let leafletInstance: LeafletInstance | null = null;

// Cache for map instances
const mapInstances = new Map<string, any>();

/**
 * Loads Leaflet asynchronously and returns the Leaflet object
 */
export const loadLeaflet = async (): Promise<LeafletInstance> => {
  // Return cached instance if already loaded
  if (leafletInstance) {
    return leafletInstance;
  }
  
  try {
    // Only load in browser environment
    if (typeof window === 'undefined') {
      throw new Error('Cannot load Leaflet in a non-browser environment');
    }
    
    // Import CSS
    await import('leaflet/dist/leaflet.css');
    
    // Import Leaflet
    const L = await import('leaflet');
    
    // Configure default icons
    const DefaultIcon = L.icon({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Set the default icon for all markers
    L.Marker.prototype.options.icon = DefaultIcon;
    
    // Cache the instance
    leafletInstance = L;
    
    return L;
  } catch (error) {
    console.error('Failed to load Leaflet:', error);
    throw error;
  }
};

/**
 * Creates a map in the specified container
 * @param containerId The ID of the HTML element to contain the map
 * @param center The initial center coordinates [lat, lng]
 * @param zoom The initial zoom level
 * @returns The map instance
 */
export const createMap = async (
  containerId: string,
  center: [number, number] = [-40, 0],
  zoom: number = 2
): Promise<any> => {
  try {
    // Check if we have a cached instance
    if (mapInstances.has(containerId)) {
      return mapInstances.get(containerId);
    }
    
    // Load Leaflet
    const L = await loadLeaflet();
    
    // Create the map
    const mapContainer = document.getElementById(containerId);
    if (!mapContainer) {
      throw new Error(`Map container with ID "${containerId}" not found`);
    }
    
    const map = L.map(containerId).setView(center, zoom);
    
    // Add the tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    
    // Cache the map instance
    mapInstances.set(containerId, map);
    
    return map;
  } catch (error) {
    console.error('Failed to create map:', error);
    throw error;
  }
};

/**
 * Adds a circle to the map
 */
export const addCircle = async (
  map: any,
  center: [number, number],
  options: {
    radius: number;
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
  }
): Promise<any> => {
  const L = await loadLeaflet();
  return L.circle(center, options).addTo(map);
};

/**
 * Adds a marker with a popup to the map
 */
export const addMarker = async (
  map: any,
  position: [number, number],
  popupContent: string
): Promise<any> => {
  const L = await loadLeaflet();
  return L.marker(position)
    .addTo(map)
    .bindPopup(popupContent);
};

/**
 * Removes a map instance and cleans up
 */
export const removeMap = (containerId: string): void => {
  if (mapInstances.has(containerId)) {
    const map = mapInstances.get(containerId);
    if (map && map.remove) {
      map.remove();
    }
    mapInstances.delete(containerId);
  }
};