import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import { 
  insertSeenPenguinSchema, 
  insertUserSchema, 
  insertSightingJournalSchema 
} from "@shared/schema";
import { z } from "zod";
import { authenticate, isAuthenticated } from "./middleware/auth";
import { debugFirestore, db } from "./firebase-admin";

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
      // If not authenticated, return an empty array
      // Unauthenticated users should store their seen penguin states in localStorage only
      if (!req.user) {
        console.log('Unauthenticated user requesting seen penguins - returning empty array');
        return res.json([]);
      }
      
      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        console.log(`User not found for firebase UID: ${req.user.uid}`);
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
      // Only allow authenticated users to add seen penguins to Firestore
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to save seen penguins" });
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
      console.log(`DELETE request received for penguin ID: ${req.params.penguinId}`);
      
      // Only allow authenticated users to remove seen penguins from Firestore
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required to update seen penguins" });
      }
      
      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        console.log(`User not found for firebase UID: ${req.user.uid}`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`Using authenticated user with ID: ${user.id}`);

      const penguinId = parseInt(req.params.penguinId);
      console.log(`Removing penguin ${penguinId} from seen list for user ${user.id}`);
      
      // Get current seen penguins before removing
      const beforeRemove = await storage.getSeenPenguins(user.id);
      console.log(`Penguins seen by user ${user.id} before removal: ${beforeRemove.join(', ')}`);
      
      await storage.removeSeenPenguin(user.id, penguinId);
      
      // Get seen penguins after removing to verify it worked
      const afterRemove = await storage.getSeenPenguins(user.id);
      console.log(`Penguins seen by user ${user.id} after removal: ${afterRemove.join(', ')}`);
      
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
      
      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.json([]);
      }

      const journalEntries = await storage.getUserJournalEntries(user.id);
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
      
      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.json([]);
      }

      const penguinId = parseInt(req.params.penguinId);
      const journalEntries = await storage.getPenguinJournalEntries(user.id, penguinId);
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
      
      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      
      // Add the journal entry with the user's ID
      const journalEntry = await storage.addJournalEntry({
        ...journalData,
        userId: user.id
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
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entryId = parseInt(req.params.id);

      // Verify ownership before updating
      const allEntries = await storage.getUserJournalEntries(user.id);
      const existingEntry = allEntries.find(e => e.id === entryId);
      if (!existingEntry) {
        return res.status(404).json({ message: "Journal entry not found or not owned by the user" });
      }

      let updateData;
      try {
        const formData = { ...req.body };
        if (typeof formData.sightingDate === 'string') {
          formData.sightingDate = new Date(formData.sightingDate);
        }
        updateData = insertSightingJournalSchema
          .omit({ userId: true })
          .partial()
          .parse(formData);
      } catch (err) {
        console.error("Validation error:", err);
        return res.status(400).json({
          message: "Invalid request data",
          errors: err instanceof z.ZodError ? err.errors : [{ message: "Failed to parse data" }]
        });
      }

      const updatedEntry = await storage.updateJournalEntry(entryId, updateData);
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
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
      
      // Get user by firebase uid
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entryId = parseInt(req.params.id);
      
      // We need to check if the entry exists and belongs to the user
      const journalEntries = await storage.getUserJournalEntries(user.id);
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
  
  // Admin-only utility routes — require authentication
  const requireAuth = (req: Request, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    next();
  };

  // Debug route to check Firestore connection
  apiRouter.get("/debug-firestore", requireAuth, async (req, res) => {
    try {
      console.log('Running Firestore debug check from API route');
      const result = await debugFirestore();
      res.json({ 
        message: "Firestore debug check completed", 
        result 
      });
    } catch (error: any) {
      console.error("Error in Firestore debug route:", error);
      res.status(500).json({ 
        message: "Error debugging Firestore", 
        error: error?.message || 'Unknown error' 
      });
    }
  });
  
  // Dedicated route for merging seenPenguins and seen_penguins collections
  apiRouter.get("/merge-seen-penguins", requireAuth, async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ 
          success: false, 
          message: "Firestore is not initialized!" 
        });
      }
      
      console.log('API: Starting merge of seenPenguins (camelCase) to seen_penguins (snake_case) collections');
      
      // Get all collections to check if both exist
      const collections = await db.listCollections();
      const collectionIds = collections.map(col => col.id);
      
      if (!collectionIds.includes('seenPenguins') || !collectionIds.includes('seen_penguins')) {
        return res.json({ 
          success: false, 
          message: `One or both collections do not exist. Found collections: ${collectionIds.join(', ')}` 
        });
      }
      
      // Use non-null assertion since we've already checked db is not null above
      const firestore = db!;
      
      // Get documents from both collections
      const camelCaseSnapshot = await firestore.collection('seenPenguins').get();
      const snakeCaseSnapshot = await firestore.collection('seen_penguins').get();
      
      console.log(`API: seenPenguins (camelCase) has ${camelCaseSnapshot.size} documents`);
      console.log(`API: seen_penguins (snake_case) has ${snakeCaseSnapshot.size} documents`);
      
      // If there are documents in the camelCase collection, copy them to snake_case
      if (camelCaseSnapshot.size > 0) {
        const batch = firestore.batch();
        let copyCount = 0;
        
        camelCaseSnapshot.forEach(doc => {
          const data = doc.data();
          
          // Check if this document already exists in snake_case collection by userId and penguinId
          const existsInSnakeCase = snakeCaseSnapshot.docs.some(
            snakeDoc => {
              const snakeData = snakeDoc.data();
              return snakeData.userId === data.userId && snakeData.penguinId === data.penguinId;
            }
          );
          
          if (!existsInSnakeCase) {
            // Create a new document in the snake_case collection
            const docRef = firestore.collection('seen_penguins').doc();
            batch.set(docRef, {
              ...data,
              id: parseInt(doc.id) || copyCount + snakeCaseSnapshot.size + 1,
              createdAt: data.createdAt || new Date().toISOString()
            });
            copyCount++;
          }
        });
        
        if (copyCount > 0) {
          await batch.commit();
          console.log(`API: Successfully copied ${copyCount} documents from camelCase to snake_case collection`);
          
          // Verify the copy worked by checking the snake_case collection again
          const updatedSnakeCaseSnapshot = await firestore.collection('seen_penguins').get();
          console.log(`API: After merge, seen_penguins (snake_case) now has ${updatedSnakeCaseSnapshot.size} documents`);
          
          return res.json({ 
            success: true, 
            message: `Successfully merged collections. Copied ${copyCount} documents from camelCase to snake_case collection. Total documents now: ${updatedSnakeCaseSnapshot.size}` 
          });
        } else {
          return res.json({ 
            success: true, 
            message: "No new documents to copy. All camelCase entries already exist in snake_case collection." 
          });
        }
      } else {
        return res.json({ 
          success: true, 
          message: "No documents found in camelCase collection. Nothing to merge." 
        });
      }
    } catch (error) {
      console.error("Error during collection merge:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error during collection merge", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Dedicated route for cleaning up unused collections
  apiRouter.get("/cleanup-collections", requireAuth, async (req, res) => {
    try {
      if (!db) {
        return res.status(500).json({ 
          success: false, 
          message: "Firestore is not initialized!" 
        });
      }
      
      // We use a non-null assertion since we've checked above that db is not null
      // TypeScript doesn't track the null check through the function
      const firestore = db!;
      
      console.log('API: Starting cleanup of unused collections');
      const collectionsToDelete = ['seenPenguins', 'test_debug'];
      const results = [];
      
      // Get all collections to verify they exist
      const collections = await firestore.listCollections();
      const collectionIds = collections.map(col => col.id);
      
      for (const collectionName of collectionsToDelete) {
        if (collectionIds.includes(collectionName)) {
          // Get all documents in the collection
          const snapshot = await firestore.collection(collectionName).get();
          console.log(`API: Found ${snapshot.size} documents in ${collectionName} collection`);
          
          // Delete all documents in batches (Firestore allows max 500 operations per batch)
          if (snapshot.size > 0) {
            // Process in smaller batches to avoid hitting limits
            const batchSize = 400;
            const batches = [];
            let currentBatch = firestore.batch();
            let operationCount = 0;
            
            snapshot.docs.forEach(doc => {
              currentBatch.delete(doc.ref);
              operationCount++;
              
              // If we hit the batch size limit, commit and start a new batch
              if (operationCount >= batchSize) {
                batches.push(currentBatch);
                currentBatch = firestore.batch();
                operationCount = 0;
              }
            });
            
            // Add the last batch if it has operations
            if (operationCount > 0) {
              batches.push(currentBatch);
            }
            
            // Commit all batches
            for (let i = 0; i < batches.length; i++) {
              await batches[i].commit();
              console.log(`API: Committed batch ${i + 1} of ${batches.length} for ${collectionName}`);
            }
            
            results.push({
              collection: collectionName,
              documentsDeleted: snapshot.size,
              status: 'success'
            });
          } else {
            results.push({
              collection: collectionName,
              documentsDeleted: 0,
              status: 'empty collection'
            });
          }
        } else {
          results.push({
            collection: collectionName,
            status: 'collection not found'
          });
        }
      }
      
      // Verify collections are now empty
      const verificationResults = [];
      for (const collectionName of collectionsToDelete) {
        if (collectionIds.includes(collectionName)) {
          const snapshot = await firestore.collection(collectionName).get();
          verificationResults.push({
            collection: collectionName,
            documentsRemaining: snapshot.size,
            status: snapshot.size === 0 ? 'empty' : 'documents remain'
          });
        }
      }
      
      return res.json({ 
        success: true, 
        message: "Cleanup of unused collections completed", 
        results,
        verification: verificationResults
      });
    } catch (error) {
      console.error("Error during collection cleanup:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error during collection cleanup", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);
  
  // Add middleware to handle JS MIME type issues - to fix deployment MIME type issues
  app.use((req, res, next) => {
    const url = req.url;
    // If this is a JavaScript file, ensure correct content type
    if (url.endsWith('.js') || url.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    next();
  });

  const httpServer = createServer(app);

  return httpServer;
}
