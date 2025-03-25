import { 
  users, type User, type InsertUser,
  penguins, type Penguin, type InsertPenguin,
  seenPenguins, type SeenPenguin, type InsertSeenPenguin
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Penguin methods
  getAllPenguins(): Promise<Penguin[]>;
  getPenguin(id: number): Promise<Penguin | undefined>;
  createPenguin(penguin: InsertPenguin & { id?: number }): Promise<Penguin>;
  
  // Seen penguin methods
  getSeenPenguins(userId: number): Promise<number[]>;
  addSeenPenguin(seenPenguin: InsertSeenPenguin): Promise<SeenPenguin>;
  removeSeenPenguin(userId: number, penguinId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private penguins: Map<number, Penguin>;
  private seenPenguins: Map<number, SeenPenguin>;
  currentUserId: number;
  currentPenguinId: number;
  currentSeenPenguinId: number;

  constructor() {
    this.users = new Map();
    this.penguins = new Map();
    this.seenPenguins = new Map();
    this.currentUserId = 1;
    this.currentPenguinId = 1;
    this.currentSeenPenguinId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
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
    
    const penguin: Penguin = { ...insertPenguin, id };
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
    // Check if this penguin is already seen by the user
    const exists = Array.from(this.seenPenguins.values()).some(
      sp => sp.userId === insertSeenPenguin.userId && sp.penguinId === insertSeenPenguin.penguinId
    );

    if (exists) {
      // Return the existing entry (this is a simplification)
      const existing = Array.from(this.seenPenguins.values()).find(
        sp => sp.userId === insertSeenPenguin.userId && sp.penguinId === insertSeenPenguin.penguinId
      )!;
      return existing;
    }

    const id = this.currentSeenPenguinId++;
    const seenPenguin: SeenPenguin = { ...insertSeenPenguin, id };
    this.seenPenguins.set(id, seenPenguin);
    return seenPenguin;
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    const entry = Array.from(this.seenPenguins.values()).find(
      sp => sp.userId === userId && sp.penguinId === penguinId
    );

    if (entry) {
      this.seenPenguins.delete(entry.id);
    }
  }
}

export const storage = new MemStorage();
