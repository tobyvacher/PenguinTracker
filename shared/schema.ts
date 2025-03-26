import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const penguins = pgTable("penguins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scientificName: text("scientific_name").notNull(),
  location: text("location").notNull(),
  size: text("size").notNull(),
  weight: text("weight").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  bwImageUrl: text("bw_image_url"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  displayName: text("display_name"),
  email: text("email"),
  photoURL: text("photo_url"),
});

export const seenPenguins = pgTable("seen_penguins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  penguinId: integer("penguin_id").notNull(),
});

// New table for journal entries to record sightings
export const sightingJournal = pgTable("sighting_journal", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  penguinId: integer("penguin_id").notNull(),
  sightingDate: timestamp("sighting_date").notNull().defaultNow(),
  location: text("location").notNull(),
  notes: text("notes"),
  coordinates: text("coordinates"), // Format: "latitude,longitude"
});

export const insertPenguinSchema = createInsertSchema(penguins).pick({
  name: true,
  scientificName: true,
  location: true,
  size: true,
  weight: true,
  status: true,
  description: true,
  imageUrl: true,
  bwImageUrl: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  firebaseUid: true,
  displayName: true,
  email: true,
  photoURL: true,
});

export const insertSeenPenguinSchema = createInsertSchema(seenPenguins).pick({
  userId: true,
  penguinId: true,
});

// Schema for inserting journal entries
export const insertSightingJournalSchema = createInsertSchema(sightingJournal).pick({
  userId: true,
  penguinId: true,
  sightingDate: true,
  location: true,
  notes: true,
  coordinates: true,
});

export type InsertPenguin = z.infer<typeof insertPenguinSchema>;
export type Penguin = typeof penguins.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSeenPenguin = z.infer<typeof insertSeenPenguinSchema>;
export type SeenPenguin = typeof seenPenguins.$inferSelect;
export type InsertSightingJournal = z.infer<typeof insertSightingJournalSchema>;
export type SightingJournal = typeof sightingJournal.$inferSelect;
