import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import {
  insertSeenPenguinSchema,
  insertSightingJournalSchema,
  type User,
} from "@shared/schema";
import { z } from "zod";
import type { ReplitAuthUser } from "./replit_integrations/auth/replitAuth";

// Initialize penguin data
import { penguinData } from "../client/src/lib/penguin-data";

// Helper to get or create the app user from the authenticated Replit session
async function getOrCreateAppUser(req: Request): Promise<User | null> {
  if (typeof req.isAuthenticated !== "function" || !req.isAuthenticated()) {
    return null;
  }
  const sessionUser = req.user as ReplitAuthUser | undefined;
  const claims = sessionUser?.claims;
  if (!claims?.sub) return null;

  const existing = await storage.getUserByReplitUserId(claims.sub);
  if (existing) return existing;

  const created = await storage.createUser({
    replitUserId: claims.sub,
    displayName:
      [claims.first_name, claims.last_name].filter(Boolean).join(" ") || null,
    email: claims.email ?? null,
    photoURL: claims.profile_image_url ?? null,
  });
  return created;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize penguin data idempotently — match by stable natural key (name)
  // so re-seeding never remaps species data to the wrong row even if DB row
  // order changes.
  const initPenguins = async () => {
    const existingPenguins = await storage.getAllPenguins();
    const existingByName = new Map(existingPenguins.map((p) => [p.name, p]));
    for (const p of penguinData) {
      const existing = existingByName.get(p.name);
      if (existing) {
        await storage.createPenguin({ ...p, id: existing.id });
      } else {
        await storage.createPenguin(p);
      }
    }
  };

  await initPenguins();

  const apiRouter = express.Router();

  // User routes
  apiRouter.post("/users", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(401).json({ message: "Authentication required" });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  apiRouter.get("/users/me", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(200).json(null);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all penguins
  apiRouter.get("/penguins", async (req, res) => {
    try {
      const allPenguins = await storage.getAllPenguins();
      res.json(allPenguins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch penguins" });
    }
  });

  // Get a specific penguin
  apiRouter.get("/penguins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const penguin = await storage.getPenguin(id);
      if (!penguin) return res.status(404).json({ message: "Penguin not found" });
      res.json(penguin);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch penguin" });
    }
  });

  // Get seen penguins
  apiRouter.get("/seen-penguins", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.json([]);
      const seenPenguinIds = await storage.getSeenPenguins(user.id);
      res.json(seenPenguinIds);
    } catch (error) {
      console.error("Error fetching seen penguins:", error);
      res.status(500).json({ message: "Failed to fetch seen penguins" });
    }
  });

  // Mark a penguin as seen
  apiRouter.post("/seen-penguins", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(401).json({ message: "Authentication required" });

      const { penguinId } = insertSeenPenguinSchema.pick({ penguinId: true }).parse(req.body);
      const seenPenguin = await storage.addSeenPenguin({ userId: user.id, penguinId });
      res.status(201).json(seenPenguin);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid request data" });
      console.error("Error marking penguin as seen:", error);
      res.status(500).json({ message: "Failed to mark penguin as seen" });
    }
  });

  // Remove a penguin from seen
  apiRouter.delete("/seen-penguins/:penguinId", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(401).json({ message: "Authentication required" });

      const penguinId = parseInt(req.params.penguinId);
      await storage.removeSeenPenguin(user.id, penguinId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing penguin from seen:", error);
      res.status(500).json({ message: "Failed to remove penguin from seen" });
    }
  });

  // Journal routes

  apiRouter.get("/journal", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.json([]);
      const journalEntries = await storage.getUserJournalEntries(user.id);
      res.json(journalEntries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  apiRouter.get("/journal/penguin/:penguinId", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.json([]);
      const penguinId = parseInt(req.params.penguinId);
      const journalEntries = await storage.getPenguinJournalEntries(user.id, penguinId);
      res.json(journalEntries);
    } catch (error) {
      console.error("Error fetching penguin journal entries:", error);
      res.status(500).json({ message: "Failed to fetch penguin journal entries" });
    }
  });

  apiRouter.post("/journal", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(401).json({ message: "Authentication required" });

      let journalData;
      try {
        const formData = { ...req.body };
        if (typeof formData.sightingDate === 'string') {
          formData.sightingDate = new Date(formData.sightingDate);
        }
        journalData = insertSightingJournalSchema.omit({ userId: true }).parse(formData);
      } catch (err) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: err instanceof z.ZodError ? err.errors : [{ message: "Failed to parse data" }]
        });
      }

      const journalEntry = await storage.addJournalEntry({ ...journalData, userId: user.id });
      res.status(201).json(journalEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error adding journal entry:", error);
      res.status(500).json({ message: "Failed to add journal entry" });
    }
  });

  apiRouter.patch("/journal/:id", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(401).json({ message: "Authentication required" });

      const entryId = parseInt(req.params.id);
      const allEntries = await storage.getUserJournalEntries(user.id);
      const existingEntry = allEntries.find(e => e.id === entryId);
      if (!existingEntry) return res.status(404).json({ message: "Journal entry not found" });

      let updateData;
      try {
        const formData = { ...req.body };
        if (typeof formData.sightingDate === 'string') {
          formData.sightingDate = new Date(formData.sightingDate);
        }
        updateData = insertSightingJournalSchema.omit({ userId: true }).partial().parse(formData);
      } catch (err) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: err instanceof z.ZodError ? err.errors : [{ message: "Failed to parse data" }]
        });
      }

      const updatedEntry = await storage.updateJournalEntry(entryId, updateData);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  apiRouter.delete("/journal/:id", async (req, res) => {
    try {
      const user = await getOrCreateAppUser(req);
      if (!user) return res.status(401).json({ message: "Authentication required" });

      const entryId = parseInt(req.params.id);
      const journalEntries = await storage.getUserJournalEntries(user.id);
      const entryToDelete = journalEntries.find(entry => entry.id === entryId);
      if (!entryToDelete) return res.status(404).json({ message: "Journal entry not found" });

      await storage.deleteJournalEntry(entryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  app.use("/api", apiRouter);

  // JS MIME type fix for deployment
  app.use((req, res, next) => {
    const url = req.url;
    if (url.endsWith('.js') || url.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
