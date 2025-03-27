import { 
  users, type User, type InsertUser,
  penguins, type Penguin, type InsertPenguin,
  seenPenguins, type SeenPenguin, type InsertSeenPenguin,
  sightingJournal, type SightingJournal, type InsertSightingJournal
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByDisplayName(displayName: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Penguin methods
  getAllPenguins(): Promise<Penguin[]>;
  getPenguin(id: number): Promise<Penguin | undefined>;
  createPenguin(penguin: InsertPenguin & { id?: number }): Promise<Penguin>;
  
  // Seen penguin methods
  getSeenPenguins(userId: number): Promise<number[]>;
  addSeenPenguin(seenPenguin: InsertSeenPenguin): Promise<SeenPenguin>;
  removeSeenPenguin(userId: number, penguinId: number): Promise<void>;

  // Sighting journal methods
  getUserJournalEntries(userId: number): Promise<SightingJournal[]>;
  getPenguinJournalEntries(userId: number, penguinId: number): Promise<SightingJournal[]>;
  addJournalEntry(entry: InsertSightingJournal): Promise<SightingJournal>;
  updateJournalEntry(id: number, entry: Partial<InsertSightingJournal>): Promise<SightingJournal | undefined>;
  deleteJournalEntry(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private penguins: Map<number, Penguin>;
  private seenPenguins: Map<number, SeenPenguin>;
  private sightingJournals: Map<number, SightingJournal>;
  currentUserId: number;
  currentPenguinId: number;
  currentSeenPenguinId: number;
  currentJournalId: number;

  constructor() {
    this.users = new Map();
    this.penguins = new Map();
    this.seenPenguins = new Map();
    this.sightingJournals = new Map();
    this.currentUserId = 1;
    this.currentPenguinId = 1;
    this.currentSeenPenguinId = 1;
    this.currentJournalId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDisplayName(displayName: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.displayName === displayName,
    );
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    
    // Ensure all required fields are properly set with null values if undefined
    const user: User = {
      id,
      firebaseUid: insertUser.firebaseUid,
      displayName: insertUser.displayName === undefined ? null : insertUser.displayName,
      email: insertUser.email === undefined ? null : insertUser.email,
      photoURL: insertUser.photoURL === undefined ? null : insertUser.photoURL,
      seenPenguins: insertUser.seenPenguins || []
    };
    
    this.users.set(id, user);
    return user;
  }

  // Penguin methods
  async getAllPenguins(): Promise<Penguin[]> {
    return Array.from(this.penguins.values());
  }

  async getPenguin(id: number): Promise<Penguin | undefined> {
    return this.penguins.get(id);
  }

  async createPenguin(insertPenguin: InsertPenguin & { id?: number }): Promise<Penguin> {
    let id: number;
    // If an id is provided, use it (for updating existing penguins)
    if (insertPenguin.id !== undefined) {
      id = insertPenguin.id;
    } else {
      id = this.currentPenguinId++;
    }
    
    // Ensure all required fields are properly set
    const penguin: Penguin = {
      id,
      name: insertPenguin.name,
      scientificName: insertPenguin.scientificName,
      location: insertPenguin.location,
      size: insertPenguin.size,
      weight: insertPenguin.weight,
      status: insertPenguin.status,
      description: insertPenguin.description,
      imageUrl: insertPenguin.imageUrl,
      bwImageUrl: insertPenguin.bwImageUrl === undefined ? null : insertPenguin.bwImageUrl
    };
    
    this.penguins.set(id, penguin);
    return penguin;
  }

  // Seen penguin methods
  async getSeenPenguins(userId: number): Promise<number[]> {
    console.log(`Storage: Getting seen penguins for userId=${userId}`);
    
    const user = this.users.get(userId);
    if (!user) {
      console.log(`Storage: User ${userId} not found`);
      return [];
    }
    
    // Get seen penguins from user document and convert to numbers
    const seenPenguinIds = user.seenPenguins || [];
    const result = seenPenguinIds.map(id => parseInt(id, 10));
    
    console.log(`Storage: Found ${result.length} seen penguins for user ${userId}: ${result.join(', ')}`);
    return result;
  }

  async addSeenPenguin(insertSeenPenguin: InsertSeenPenguin): Promise<SeenPenguin> {
    console.log(`Storage: Adding seen penguin for userId=${insertSeenPenguin.userId}, penguinId=${insertSeenPenguin.penguinId}`);
    
    // Get user
    const user = this.users.get(insertSeenPenguin.userId);
    if (!user) {
      throw new Error(`User ${insertSeenPenguin.userId} not found`);
    }
    
    // Get current seen penguins
    const seenPenguinIds = user.seenPenguins || [];
    const penguinIdStr = insertSeenPenguin.penguinId.toString();
    
    // Check if already in the list
    if (seenPenguinIds.includes(penguinIdStr)) {
      console.log(`Storage: Penguin ${insertSeenPenguin.penguinId} already seen by user ${insertSeenPenguin.userId}`);
      
      // Create a representation of the SeenPenguin for backward compatibility
      const id = this.currentSeenPenguinId++;
      return {
        id,
        userId: insertSeenPenguin.userId,
        penguinId: insertSeenPenguin.penguinId,
        createdAt: new Date().toISOString()
      };
    }
    
    // Add the penguin to the list
    seenPenguinIds.push(penguinIdStr);
    
    // Update the user
    user.seenPenguins = seenPenguinIds;
    this.users.set(user.id, user);
    
    console.log(`Storage: Added penguin ${insertSeenPenguin.penguinId} to user ${insertSeenPenguin.userId}'s seen penguins. Total now: ${seenPenguinIds.length}`);
    
    // Create a representation of the SeenPenguin for backward compatibility
    const id = this.currentSeenPenguinId++;
    const seenPenguin: SeenPenguin = { 
      ...insertSeenPenguin, 
      id,
      createdAt: new Date().toISOString()
    };
    
    return seenPenguin;
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    console.log(`Storage: Removing penguin ${penguinId} from user ${userId}'s seen penguins`);
    
    // Get user
    const user = this.users.get(userId);
    if (!user) {
      console.log(`Storage: User ${userId} not found`);
      return;
    }
    
    // Get current seen penguins
    const seenPenguinIds = user.seenPenguins || [];
    const penguinIdStr = penguinId.toString();
    
    // Check if in the list
    if (!seenPenguinIds.includes(penguinIdStr)) {
      console.log(`Storage: Penguin ${penguinId} not found in user ${userId}'s seen penguins`);
      return;
    }
    
    // Remove the penguin from the list
    const updatedSeenPenguins = seenPenguinIds.filter(id => id !== penguinIdStr);
    
    // Update the user
    user.seenPenguins = updatedSeenPenguins;
    this.users.set(user.id, user);
    
    console.log(`Storage: Removed penguin ${penguinId} from user ${userId}'s seen penguins. Remaining: ${updatedSeenPenguins.length}`);
  }
  
  // Sighting journal methods
  async getUserJournalEntries(userId: number): Promise<SightingJournal[]> {
    return Array.from(this.sightingJournals.values()).filter(
      entry => entry.userId === userId
    );
  }
  
  async getPenguinJournalEntries(userId: number, penguinId: number): Promise<SightingJournal[]> {
    return Array.from(this.sightingJournals.values()).filter(
      entry => entry.userId === userId && entry.penguinId === penguinId
    );
  }
  
  async addJournalEntry(insertEntry: InsertSightingJournal): Promise<SightingJournal> {
    const id = this.currentJournalId++;
    
    // Handle defaults for nullable fields
    const entry: SightingJournal = {
      id,
      userId: insertEntry.userId,
      penguinId: insertEntry.penguinId,
      sightingDate: insertEntry.sightingDate || new Date(),
      location: insertEntry.location,
      notes: insertEntry.notes === undefined ? null : insertEntry.notes,
      coordinates: insertEntry.coordinates === undefined ? null : insertEntry.coordinates
    };
    
    this.sightingJournals.set(id, entry);
    return entry;
  }
  
  async updateJournalEntry(id: number, updates: Partial<InsertSightingJournal>): Promise<SightingJournal | undefined> {
    const existingEntry = this.sightingJournals.get(id);
    
    if (!existingEntry) {
      return undefined;
    }
    
    // Create updated entry
    const updatedEntry: SightingJournal = {
      ...existingEntry,
      ...updates,
      id // Ensure id doesn't change
    };
    
    this.sightingJournals.set(id, updatedEntry);
    return updatedEntry;
  }
  
  async deleteJournalEntry(id: number): Promise<void> {
    this.sightingJournals.delete(id);
  }
}

// Use Firestore for persistent storage across server restarts
// Import FirestoreServerStorage for persistent database access
import { firestoreServerStorage } from "./firestore-storage";
export const storage = firestoreServerStorage;
