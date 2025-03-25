import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
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
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const seenPenguins = pgTable("seen_penguins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  penguinId: integer("penguin_id").notNull(),
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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSeenPenguinSchema = createInsertSchema(seenPenguins).pick({
  userId: true,
  penguinId: true,
});

export type InsertPenguin = z.infer<typeof insertPenguinSchema>;
export type Penguin = typeof penguins.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSeenPenguin = z.infer<typeof insertSeenPenguinSchema>;
export type SeenPenguin = typeof seenPenguins.$inferSelect;
