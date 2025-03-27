import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage, sessionSeenPenguins } from "./storage";
import { firestoreServerStorage } from "./firestore-storage";
import express from "express";
import { 
  insertSeenPenguinSchema, 
  insertUserSchema, 
  insertSightingJournalSchema 
} from "@shared/schema";
import { z } from "zod";
import { authenticate, isAuthenticated } from "./middleware/auth";

// Extend the express Request type to include sessionID
declare global {
  namespace Express {
    interface Request {
      sessionID?: string;
    }
  }
}

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
      // For unauthenticated users, use session-based MemStorage
      if (!req.user) {
        // Generate a unique identifier for this client (or use IP address as fallback)
        const sessionId = (req as any).sessionID || req.ip || 'anonymous';
        
        // Get seen penguins from session storage or return empty array
        const seenPenguins = sessionSeenPenguins.get(sessionId) || [];
        return res.json(seenPenguins);
      } 
      
      // For authenticated users, try to use Firestore
      try {
        // Get user from Firestore
        const firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        if (firestoreUser) {
          // Use Firestore storage for authenticated users with valid Firestore data
          const seenPenguinIds = await firestoreServerStorage.getSeenPenguins(firestoreUser.id);
          return res.json(seenPenguinIds);
        }
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails or user not found
      const memUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!memUser) {
        return res.json([]);
      }
      
      const seenPenguinIds = await storage.getSeenPenguins(memUser.id);
      return res.json(seenPenguinIds);
    } catch (error) {
      console.error("Error fetching seen penguins:", error);
      res.status(500).json({ message: "Failed to fetch seen penguins" });
    }
  });

  // Mark a penguin as seen
  apiRouter.post("/seen-penguins", async (req, res) => {
    try {
      // Parse the penguin ID from the request
      const { penguinId } = insertSeenPenguinSchema
        .pick({ penguinId: true })
        .parse(req.body);
      
      // For unauthenticated users, store in session
      if (!req.user) {
        const sessionId = (req as any).sessionID || req.ip || 'anonymous';
        
        // Get existing seen penguins or create new array
        const existingPenguins = sessionSeenPenguins.get(sessionId) || [];
        
        // Only add if not already seen
        if (!existingPenguins.includes(penguinId)) {
          existingPenguins.push(penguinId);
          sessionSeenPenguins.set(sessionId, existingPenguins);
        }
        
        // Return a fake response that mimics the structure
        return res.status(201).json({ userId: 0, penguinId, id: 0 });
      }
      
      // For authenticated users, try Firestore first
      try {
        let firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        // Create user in Firestore if not exists
        if (!firestoreUser) {
          firestoreUser = await firestoreServerStorage.createUser({
            firebaseUid: req.user.uid,
            displayName: req.user.name || null,
            email: req.user.email || null,
            photoURL: req.user.picture || null
          });
        }
        
        // Add to Firestore
        const seenPenguin = await firestoreServerStorage.addSeenPenguin({ 
          userId: firestoreUser.id, 
          penguinId 
        });
        return res.status(201).json(seenPenguin);
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      let memUser = await storage.getUserByFirebaseUid(req.user.uid);
      
      // Create user in memory if not exists
      if (!memUser) {
        memUser = await storage.createUser({
          firebaseUid: req.user.uid,
          displayName: req.user.name || null,
          email: req.user.email || null,
          photoURL: req.user.picture || null
        });
      }
      
      // Add to MemStorage
      const seenPenguin = await storage.addSeenPenguin({ userId: memUser.id, penguinId });
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
      const penguinId = parseInt(req.params.penguinId);
      console.log(`DELETE request received for penguin ID: ${penguinId}`);
      
      // For unauthenticated users, remove from session-based storage
      if (!req.user) {
        const sessionId = (req as any).sessionID || req.ip || 'anonymous';
        const existingPenguins = sessionSeenPenguins.get(sessionId) || [];
        
        // Filter out the penguin to remove
        const updatedPenguins = existingPenguins.filter(id => id !== penguinId);
        sessionSeenPenguins.set(sessionId, updatedPenguins);
        
        return res.status(204).send();
      }
      
      // For authenticated users, try Firestore first
      try {
        const firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        if (firestoreUser) {
          // Get current seen penguins before removing
          const beforeRemove = await firestoreServerStorage.getSeenPenguins(firestoreUser.id);
          console.log(`Penguins seen by user ${firestoreUser.id} before removal: ${beforeRemove.join(', ')}`);
          
          // Remove from Firestore
          await firestoreServerStorage.removeSeenPenguin(firestoreUser.id, penguinId);
          
          // Verify it worked
          const afterRemove = await firestoreServerStorage.getSeenPenguins(firestoreUser.id);
          console.log(`Penguins seen by user ${firestoreUser.id} after removal: ${afterRemove.join(', ')}`);
          
          return res.status(204).send();
        }
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      const memUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!memUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove from MemStorage
      await storage.removeSeenPenguin(memUser.id, penguinId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing penguin from seen:", error);
      res.status(500).json({ message: "Failed to remove penguin from seen" });
    }
  });

  // Journal Entries routes
  
  // Get all journal entries for the current user
  apiRouter.get("/journal", async (req, res) => {
    try {
      // Only allow authenticated users to access journal entries
      if (!req.user) {
        return res.json([]);
      }
      
      // For authenticated users, try Firestore first
      try {
        const firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        if (firestoreUser) {
          // Get journal entries from Firestore
          const journalEntries = await firestoreServerStorage.getUserJournalEntries(firestoreUser.id);
          return res.json(journalEntries);
        }
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      const memUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!memUser) {
        return res.json([]);
      }

      const journalEntries = await storage.getUserJournalEntries(memUser.id);
      res.json(journalEntries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  // Get journal entries for a specific penguin
  apiRouter.get("/journal/penguin/:penguinId", async (req, res) => {
    try {
      // Only allow authenticated users to access journal entries
      if (!req.user) {
        return res.json([]);
      }
      
      const penguinId = parseInt(req.params.penguinId);
      
      // For authenticated users, try Firestore first
      try {
        const firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        if (firestoreUser) {
          // Get journal entries from Firestore
          const journalEntries = await firestoreServerStorage.getPenguinJournalEntries(firestoreUser.id, penguinId);
          return res.json(journalEntries);
        }
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      const memUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!memUser) {
        return res.json([]);
      }

      const journalEntries = await storage.getPenguinJournalEntries(memUser.id, penguinId);
      res.json(journalEntries);
    } catch (error) {
      console.error("Error fetching penguin journal entries:", error);
      res.status(500).json({ message: "Failed to fetch penguin journal entries" });
    }
  });

  // Add a new journal entry
  apiRouter.post("/journal", async (req, res) => {
    try {
      // Only allow authenticated users to add journal entries
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Parse and validate the request body
      let journalData;
      try {
        // Convert sightingDate string to Date if it's a string
        const formData = { ...req.body };
        if (typeof formData.sightingDate === 'string') {
          formData.sightingDate = new Date(formData.sightingDate);
        }
        
        journalData = insertSightingJournalSchema
          .omit({ userId: true }) // userId will be set from the authenticated user
          .parse(formData);
      } catch (err) {
        console.error("Validation error:", err);
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: err instanceof z.ZodError ? err.errors : [{ message: "Failed to parse data" }]
        });
      }
      
      // For authenticated users, try Firestore first
      try {
        let firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        // Create user in Firestore if needed
        if (!firestoreUser) {
          firestoreUser = await firestoreServerStorage.createUser({
            firebaseUid: req.user.uid,
            displayName: req.user.name || null,
            email: req.user.email || null,
            photoURL: req.user.picture || null
          });
        }
        
        // Add journal entry to Firestore
        const journalEntry = await firestoreServerStorage.addJournalEntry({
          ...journalData,
          userId: firestoreUser.id
        });
        
        return res.status(201).json(journalEntry);
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      let memUser = await storage.getUserByFirebaseUid(req.user.uid);
      
      // Create user in MemStorage if needed
      if (!memUser) {
        memUser = await storage.createUser({
          firebaseUid: req.user.uid,
          displayName: req.user.name || null,
          email: req.user.email || null,
          photoURL: req.user.picture || null
        });
      }
      
      // Add the journal entry with the user's ID to MemStorage
      const journalEntry = await storage.addJournalEntry({
        ...journalData,
        userId: memUser.id
      });
      
      res.status(201).json(journalEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: error.errors 
        });
      }
      console.error("Error adding journal entry:", error);
      res.status(500).json({ message: "Failed to add journal entry" });
    }
  });

  // Update an existing journal entry
  apiRouter.patch("/journal/:id", async (req, res) => {
    try {
      // Only allow authenticated users to update journal entries
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const entryId = parseInt(req.params.id);
      
      // Parse and validate the request body (allow partial updates)
      let updateData;
      try {
        // Convert sightingDate string to Date if it's a string
        const formData = { ...req.body };
        if (typeof formData.sightingDate === 'string') {
          formData.sightingDate = new Date(formData.sightingDate);
        }
        
        updateData = insertSightingJournalSchema
          .omit({ userId: true }) // userId should not be updated
          .partial() // Make all fields optional for PATCH
          .parse(formData);
      } catch (err) {
        console.error("Validation error:", err);
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: err instanceof z.ZodError ? err.errors : [{ message: "Failed to parse data" }]
        });
      }
      
      // For authenticated users, try Firestore first
      try {
        const firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        if (firestoreUser) {
          // Get journal entries from Firestore to verify ownership
          const journalEntries = await firestoreServerStorage.getUserJournalEntries(firestoreUser.id);
          const entryToUpdate = journalEntries.find(entry => entry.id === entryId);
          
          if (entryToUpdate) {
            // Update journal entry in Firestore
            const updatedEntry = await firestoreServerStorage.updateJournalEntry(entryId, updateData);
            
            if (updatedEntry) {
              return res.json(updatedEntry);
            }
          }
        }
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      const memUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!memUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the journal entry in MemStorage
      const updatedEntry = await storage.updateJournalEntry(entryId, updateData);
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      
      // Check if the entry belongs to the current user
      if (updatedEntry.userId !== memUser.id) {
        return res.status(403).json({ message: "Not authorized to update this journal entry" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: error.errors 
        });
      }
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  // Delete a journal entry
  apiRouter.delete("/journal/:id", async (req, res) => {
    try {
      // Only allow authenticated users to delete journal entries
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const entryId = parseInt(req.params.id);
      
      // For authenticated users, try Firestore first
      try {
        const firestoreUser = await firestoreServerStorage.getUserByFirebaseUid(req.user.uid);
        
        if (firestoreUser) {
          // Get journal entries from Firestore to verify ownership
          const journalEntries = await firestoreServerStorage.getUserJournalEntries(firestoreUser.id);
          const entryToDelete = journalEntries.find(entry => entry.id === entryId);
          
          if (entryToDelete) {
            // Delete journal entry from Firestore
            await firestoreServerStorage.deleteJournalEntry(entryId);
            return res.status(204).send();
          }
        }
      } catch (firestoreError) {
        console.log("Firestore error, falling back to MemStorage:", firestoreError);
      }
      
      // Fallback to MemStorage if Firestore fails
      const memUser = await storage.getUserByFirebaseUid(req.user.uid);
      if (!memUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // We need to check if the entry exists and belongs to the user
      const journalEntries = await storage.getUserJournalEntries(memUser.id);
      const entryToDelete = journalEntries.find(entry => entry.id === entryId);
      
      if (!entryToDelete) {
        return res.status(404).json({ message: "Journal entry not found or not owned by the user" });
      }
      
      await storage.deleteJournalEntry(entryId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });
  
  // Mount API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
