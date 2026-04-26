import { eq, and } from "drizzle-orm";
import { db } from "./db";
import {
  users, type User, type InsertUser,
  penguins, type Penguin, type InsertPenguin,
  seenPenguins, type SeenPenguin, type InsertSeenPenguin,
  sightingJournal, type SightingJournal, type InsertSightingJournal,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DrizzleStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByReplitUserId(replitUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitUserId, replitUserId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Penguin methods
  async getAllPenguins(): Promise<Penguin[]> {
    return db.select().from(penguins).orderBy(penguins.id);
  }

  async getPenguin(id: number): Promise<Penguin | undefined> {
    const [penguin] = await db.select().from(penguins).where(eq(penguins.id, id));
    return penguin;
  }

  async createPenguin(insertPenguin: InsertPenguin & { id?: number }): Promise<Penguin> {
    if (insertPenguin.id !== undefined) {
      const [existing] = await db.select().from(penguins).where(eq(penguins.id, insertPenguin.id));
      if (existing) {
        const [updated] = await db
          .update(penguins)
          .set({
            name: insertPenguin.name,
            scientificName: insertPenguin.scientificName,
            location: insertPenguin.location,
            size: insertPenguin.size,
            weight: insertPenguin.weight,
            status: insertPenguin.status,
            description: insertPenguin.description,
            imageUrl: insertPenguin.imageUrl,
            bwImageUrl: insertPenguin.bwImageUrl ?? null,
          })
          .where(eq(penguins.id, insertPenguin.id))
          .returning();
        return updated;
      }
    }
    const [created] = await db
      .insert(penguins)
      .values({
        name: insertPenguin.name,
        scientificName: insertPenguin.scientificName,
        location: insertPenguin.location,
        size: insertPenguin.size,
        weight: insertPenguin.weight,
        status: insertPenguin.status,
        description: insertPenguin.description,
        imageUrl: insertPenguin.imageUrl,
        bwImageUrl: insertPenguin.bwImageUrl ?? null,
      })
      .returning();
    return created;
  }

  // Seen penguin methods
  async getSeenPenguins(userId: number): Promise<number[]> {
    const rows = await db
      .select({ penguinId: seenPenguins.penguinId })
      .from(seenPenguins)
      .where(eq(seenPenguins.userId, userId));
    return rows.map((r) => r.penguinId);
  }

  async addSeenPenguin(insertSeenPenguin: InsertSeenPenguin): Promise<SeenPenguin> {
    const [existing] = await db
      .select()
      .from(seenPenguins)
      .where(
        and(
          eq(seenPenguins.userId, insertSeenPenguin.userId),
          eq(seenPenguins.penguinId, insertSeenPenguin.penguinId)
        )
      );
    if (existing) return existing;

    const [created] = await db.insert(seenPenguins).values(insertSeenPenguin).returning();
    return created;
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    await db
      .delete(seenPenguins)
      .where(and(eq(seenPenguins.userId, userId), eq(seenPenguins.penguinId, penguinId)));
  }

  // Sighting journal methods
  async getUserJournalEntries(userId: number): Promise<SightingJournal[]> {
    return db.select().from(sightingJournal).where(eq(sightingJournal.userId, userId));
  }

  async getPenguinJournalEntries(userId: number, penguinId: number): Promise<SightingJournal[]> {
    return db
      .select()
      .from(sightingJournal)
      .where(and(eq(sightingJournal.userId, userId), eq(sightingJournal.penguinId, penguinId)));
  }

  async addJournalEntry(entry: InsertSightingJournal): Promise<SightingJournal> {
    const [created] = await db.insert(sightingJournal).values(entry).returning();
    return created;
  }

  async updateJournalEntry(
    id: number,
    updates: Partial<InsertSightingJournal>
  ): Promise<SightingJournal | undefined> {
    const [updated] = await db
      .update(sightingJournal)
      .set(updates)
      .where(eq(sightingJournal.id, id))
      .returning();
    return updated;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(sightingJournal).where(eq(sightingJournal.id, id));
  }
}
