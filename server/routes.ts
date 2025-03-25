import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { insertSeenPenguinSchema } from "@shared/schema";
import { z } from "zod";

// Initialize penguin data
import { penguinData } from "../client/src/lib/penguin-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize with penguin data
  const initPenguins = async () => {
    const existingPenguins = await storage.getAllPenguins();
    if (existingPenguins.length === 0) {
      for (const penguin of penguinData) {
        await storage.createPenguin(penguin);
      }
    }
  };

  await initPenguins();

  // API routes
  const apiRouter = express.Router();

  // Get all penguins
  apiRouter.get("/penguins", async (req, res) => {
    try {
      const penguins = await storage.getAllPenguins();
      res.json(penguins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch penguins" });
    }
  });

  // Get a specific penguin
  apiRouter.get("/penguins/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const penguin = await storage.getPenguin(id);
      
      if (!penguin) {
        return res.status(404).json({ message: "Penguin not found" });
      }
      
      res.json(penguin);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch penguin" });
    }
  });

  // Get seen penguins (without requiring authentication for simplicity)
  apiRouter.get("/seen-penguins", async (req, res) => {
    try {
      // For simplicity, use a fixed userId=1
      const userId = 1;
      const seenPenguinIds = await storage.getSeenPenguins(userId);
      res.json(seenPenguinIds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch seen penguins" });
    }
  });

  // Mark a penguin as seen
  apiRouter.post("/seen-penguins", async (req, res) => {
    try {
      // For simplicity, use a fixed userId=1
      const userId = 1;
      
      const { penguinId } = insertSeenPenguinSchema
        .pick({ penguinId: true })
        .parse(req.body);
      
      const seenPenguin = await storage.addSeenPenguin({ userId, penguinId });
      res.status(201).json(seenPenguin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to mark penguin as seen" });
    }
  });

  // Remove a penguin from seen
  apiRouter.delete("/seen-penguins/:penguinId", async (req, res) => {
    try {
      // For simplicity, use a fixed userId=1
      const userId = 1;
      const penguinId = parseInt(req.params.penguinId);
      
      await storage.removeSeenPenguin(userId, penguinId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove penguin from seen" });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
