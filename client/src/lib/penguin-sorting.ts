import { Penguin } from "@shared/schema";

interface GenusMapping {
  [key: string]: string;
}

export const penguinGenera: GenusMapping = {
  "Aptenodytes": "Great Penguins",
  "Pygoscelis": "Brush-tailed Penguins",
  "Eudyptula": "Little Penguins",
  "Spheniscus": "Banded Penguins",
  "Megadyptes": "Yellow-eyed Penguins",
  "Eudyptes": "Crested Penguins"
};

/**
 * Extracts the genus name from the scientific name
 */
export function extractGenus(scientificName: string): string {
  const parts = scientificName.split(' ');
  return parts[0] || "";
}

/**
 * Extracts the minimum height in cm from a size string like "60-65 cm tall"
 * For size ranges, returns the smallest value
 */
export function extractHeight(size: string): number {
  // Extract numbers from the size string, handling both standard dash and en-dash formats
  // This correctly handles formats like "60-65 cm tall" or "60–65 cm tall"
  const matches = size.match(/(\d+)[\-–](\d+)\s*cm|\s*(\d+)\s*cm/);
  
  if (matches) {
    // Case 1: Range detected with two numbers (e.g., "60-65 cm")
    if (matches[1] && matches[2]) {
      return parseInt(matches[1]); // Return the first number (minimum) in the range
    }
    // Case 2: Single number detected (e.g., "60 cm")
    else if (matches[3]) {
      return parseInt(matches[3]);
    }
  }
  
  // Fallback regex for simpler cases if the above doesn't match
  const simplifiedMatches = size.match(/(\d+)/);
  if (simplifiedMatches && simplifiedMatches[1]) {
    return parseInt(simplifiedMatches[1]);
  }
  
  return 0; // Default if no height found
}

export type PenguinSortType = 
  | "default" 
  | "alphabetical" 
  | "size-asc" 
  | "size-desc" 
  | "genus";

/**
 * Sorts penguins based on the specified sort type
 */
export function sortPenguins(penguins: Penguin[], sortType: PenguinSortType): Penguin[] {
  // Create a copy to avoid mutating the original array
  const penguinsCopy = [...penguins];
  
  switch(sortType) {
    case "alphabetical":
      return penguinsCopy.sort((a, b) => a.name.localeCompare(b.name));
      
    case "size-asc":
      return penguinsCopy.sort((a, b) => extractHeight(a.size) - extractHeight(b.size));
      
    case "size-desc":
      return penguinsCopy.sort((a, b) => extractHeight(b.size) - extractHeight(a.size));
      
    case "genus":
      // No need to sort for genus view as groupPenguinsByGenus handles the grouping
      return penguinsCopy.sort((a, b) => {
        const genusA = extractGenus(a.scientificName);
        const genusB = extractGenus(b.scientificName);
        return genusA.localeCompare(genusB) || a.name.localeCompare(b.name);
      });
      
    case "default":
    default:
      // Default sorting is by ID
      return penguinsCopy.sort((a, b) => a.id - b.id);
  }
}

/**
 * Groups penguins by their genus
 */
export function groupPenguinsByGenus(penguins: Penguin[]): Record<string, Penguin[]> {
  const groups: Record<string, Penguin[]> = {};
  
  penguins.forEach(penguin => {
    const genus = extractGenus(penguin.scientificName);
    if (!groups[genus]) {
      groups[genus] = [];
    }
    groups[genus].push(penguin);
  });
  
  // Sort penguins within each genus alphabetically by name
  Object.keys(groups).forEach(genus => {
    groups[genus].sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return groups;
}

/**
 * Gets a user-friendly genus name from the scientific genus name
 */
export function getFriendlyGenusName(genus: string): string {
  return penguinGenera[genus] || genus;
}