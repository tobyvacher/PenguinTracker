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
      photoURL: insertUser.photoURL === undefined ? null : insertUser.photoURL
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
    const seenPenguinEntries = Array.from(this.seenPenguins.values()).filter(
      sp => sp.userId === userId
    );
    return seenPenguinEntries.map(sp => sp.penguinId);
  }

  async addSeenPenguin(insertSeenPenguin: InsertSeenPenguin): Promise<SeenPenguin> {
    console.log(`Storage: Adding seen penguin for userId=${insertSeenPenguin.userId}, penguinId=${insertSeenPenguin.penguinId}`);
    
    // Check if this penguin is already seen by the user
    const existing = Array.from(this.seenPenguins.values()).find(
      sp => sp.userId === insertSeenPenguin.userId && sp.penguinId === insertSeenPenguin.penguinId
    );

    if (existing) {
      console.log(`Storage: Penguin ${insertSeenPenguin.penguinId} already seen by user ${insertSeenPenguin.userId}, returning existing entry with ID=${existing.id}`);
      return existing;
    }

    const id = this.currentSeenPenguinId++;
    const seenPenguin: SeenPenguin = { ...insertSeenPenguin, id };
    console.log(`Storage: Created new seen penguin entry with ID=${id}`);
    
    this.seenPenguins.set(id, seenPenguin);
    
    // Log all entries in the seenPenguins map after adding
    console.log(`Storage: All seen penguin entries after adding (${this.seenPenguins.size} total):`);
    Array.from(this.seenPenguins.entries()).forEach(([mapId, sp]) => {
      console.log(`Storage: - ID=${mapId}, userId=${sp.userId}, penguinId=${sp.penguinId}`);
    });
    
    return seenPenguin;
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    console.log(`Storage: Finding seen penguin entry for userId=${userId}, penguinId=${penguinId}`);
    
    // Log all entries in the seenPenguins map for debugging
    console.log(`Storage: All seen penguin entries (${this.seenPenguins.size} total):`);
    Array.from(this.seenPenguins.entries()).forEach(([id, sp]) => {
      console.log(`Storage: - ID=${id}, userId=${sp.userId}, penguinId=${sp.penguinId}`);
    });
    
    const entry = Array.from(this.seenPenguins.values()).find(
      sp => sp.userId === userId && sp.penguinId === penguinId
    );

    if (entry) {
      console.log(`Storage: Found entry with ID=${entry.id}, removing it`);
      this.seenPenguins.delete(entry.id);
    } else {
      console.log(`Storage: No matching entry found to remove`);
    }
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

export const storage = new MemStorage();
