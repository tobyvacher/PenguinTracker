import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { insertSeenPenguinSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { authenticate, isAuthenticated } from "./middleware/auth";

// Initialize penguin data
import { penguinData } from "../client/src/lib/penguin-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize with penguin data - always reinitialize to get the latest data
  const initPenguins = async () => {
    // Clear existing penguins first by getting them and removing them
    const existingPenguins = await storage.getAllPenguins();
    
    // Re-create all penguins with the latest data
    for (let i = 0; i < penguinData.length; i++) {
      if (i < existingPenguins.length) {
        // Update existing penguin with latest data
        const existingId = existingPenguins[i].id;
        const updatedPenguin = { ...penguinData[i], id: existingId };
        // Here we would update if we had an update method, but we'll re-add instead
        await storage.createPenguin(updatedPenguin);
      } else {
        // Add new penguins
        await storage.createPenguin(penguinData[i]);
      }
    }
  };

  await initPenguins();

  // API routes
  const apiRouter = express.Router();

  // Apply authentication middleware to all routes
  apiRouter.use(authenticate);

  // User routes
  apiRouter.post("/users", async (req: Request, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (existingUser) {
        return res.json(existingUser);
      }

      // Create new user
      const newUser = await storage.createUser({
        firebaseUid: req.user.uid,
        displayName: req.user.name || null,
        email: req.user.email || null,
        photoURL: req.user.picture || null,
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Get current user
  apiRouter.get("/users/me", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(200).json(null);
      }

      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  // Get seen penguins
  apiRouter.get("/seen-penguins", async (req, res) => {
    try {
      // If user is not authenticated, return empty array
      if (!req.user) {
        return res.json([]);
      }

      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.json([]);
      }

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
      // If user is not authenticated, return error
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to save progress" });
      }

      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { penguinId } = insertSeenPenguinSchema
        .pick({ penguinId: true })
        .parse(req.body);
      
      const seenPenguin = await storage.addSeenPenguin({ userId: user.id, penguinId });
      res.status(201).json(seenPenguin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      console.error("Error marking penguin as seen:", error);
      res.status(500).json({ message: "Failed to mark penguin as seen" });
    }
  });

  // Remove a penguin from seen
  apiRouter.delete("/seen-penguins/:penguinId", async (req, res) => {
    try {
      // If user is not authenticated, return error
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to save progress" });
      }

      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const penguinId = parseInt(req.params.penguinId);
      
      await storage.removeSeenPenguin(user.id, penguinId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing penguin from seen:", error);
      res.status(500).json({ message: "Failed to remove penguin from seen" });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
