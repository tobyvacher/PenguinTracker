import { 
  users, type User, type InsertUser,
  penguins, type Penguin, type InsertPenguin,
  seenPenguins, type SeenPenguin, type InsertSeenPenguin,
  sightingJournal, type SightingJournal, type InsertSightingJournal
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByReplitUserId(replitUserId: string): Promise<User | undefined>;
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

export { DrizzleStorage } from "./drizzle-storage";
import { DrizzleStorage } from "./drizzle-storage";
export const storage: IStorage = new DrizzleStorage();
