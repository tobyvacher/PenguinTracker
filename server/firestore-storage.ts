import { 
  users, type User, type InsertUser,
  penguins, type Penguin, type InsertPenguin,
  seenPenguins, type SeenPenguin, type InsertSeenPenguin,
  sightingJournal, type SightingJournal, type InsertSightingJournal
} from "@shared/schema";
import { db } from "./firebase-admin";
import { IStorage } from "./storage";

// Collection names in Firestore - these must match exactly what appears in Firebase console
// IMPORTANT: We found that both 'seenPenguins' and 'seen_penguins' collections exist, causing confusion
// Standardizing on snake_case for all collection names
const COLLECTIONS = {
  USERS: 'users',
  PENGUINS: 'penguins',
  SEEN_PENGUINS: 'seen_penguins', // Snake_case is the standard we're using
  JOURNAL_ENTRIES: 'journal_entries' 
};

// Simple caching mechanism to reduce Firestore reads
const userCache = new Map<number, User>();
const penguinCache = new Map<number, Penguin>();
const journalCache = new Map<string, SightingJournal[]>(); // userId_penguinId as key

// Error handling helper
const handleFirestoreError = (operation: string, error: any): never => {
  console.error(`Firestore error during ${operation}:`, error);
  
  // Add special handling for permission-denied errors
  if (error.code === 'permission-denied') {
    console.error('Firestore security rules are preventing this operation. Please check your Firebase console rules.');
    throw new Error(`Failed to ${operation}: Permission denied. Firebase security rules are preventing this operation.`);
  }
  
  // Add special handling for index-required errors
  if (error.code === 'failed-precondition' && error.message.includes('index')) {
    console.error('This query requires a Firestore index. Please create the required index in the Firebase console.');
    
    // Extract index creation URL if present
    const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
    const indexUrl = urlMatch ? urlMatch[0] : null;
    
    if (indexUrl) {
      console.error(`You can create the index by visiting: ${indexUrl}`);
      throw new Error(`Failed to ${operation}: This query requires a Firestore index. Please create the index in the Firebase console.`);
    }
  }
  
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

export class FirestoreServerStorage implements IStorage {
  // ID counters to avoid fetching all documents
  private userIdCounter = 0;
  private penguinIdCounter = 0;
  private seenPenguinIdCounter = 0;
  private journalIdCounter = 0;
  
  // Initialize with penguins data
  constructor(initialPenguins?: InsertPenguin[]) {
    // If we have initial penguin data, initialize it
    if (initialPenguins && initialPenguins.length > 0) {
      this.initializePenguins(initialPenguins);
    }
  }

  // Initialize the penguins collection with our data
  private async initializePenguins(penguins: InsertPenguin[]): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // First check if we already have penguins
      const penguinsCollection = db.collection(COLLECTIONS.PENGUINS);
      const snapshot = await penguinsCollection.get();
      
      // If we already have penguins, don't re-add them
      if (!snapshot.empty) return;
      
      // Add all penguins to the collection
      const batch = db.batch();
      for (const penguin of penguins) {
        // Ensure we have an ID for each penguin
        const penguinId = (penguin as any).id ? (penguin as any).id : penguins.indexOf(penguin) + 1;
        const docRef = penguinsCollection.doc(penguinId.toString());
        
        // Ensure required fields for Penguin type
        const penguinWithRequiredFields = {
          ...penguin,
          id: penguinId,
          bwImageUrl: penguin.bwImageUrl || null,
          // Add timestamps
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        batch.set(docRef, penguinWithRequiredFields);
        
        // Update the counter
        if (penguinId > this.penguinIdCounter) {
          this.penguinIdCounter = penguinId;
        }
      }
      
      await batch.commit();
      console.log(`Initialized ${penguins.length} penguins in Firestore`);
    } catch (error) {
      handleFirestoreError('initialize penguins', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    // Check cache first
    if (userCache.has(id)) {
      return userCache.get(id);
    }
    
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(id.toString()).get();
      if (!userDoc.exists) return undefined;
      
      const userData = userDoc.data() as User;
      userCache.set(id, userData); // Cache the result
      return userData;
    } catch (error) {
      handleFirestoreError('get user', error);
    }
    
    return undefined;
  }

  async getUserByDisplayName(displayName: string): Promise<User | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const usersQuery = db.collection(COLLECTIONS.USERS)
        .where("displayName", "==", displayName)
        .limit(1); // Only need first match
      
      const snapshot = await usersQuery.get();
      if (snapshot.empty) return undefined;
      
      const userData = snapshot.docs[0].data() as User;
      userCache.set(userData.id, userData); // Cache the result
      return userData;
    } catch (error) {
      handleFirestoreError('get user by display name', error);
    }
    
    return undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const usersQuery = db.collection(COLLECTIONS.USERS)
        .where("firebaseUid", "==", firebaseUid)
        .limit(1); // Only need first match
      
      const snapshot = await usersQuery.get();
      if (snapshot.empty) return undefined;
      
      const userData = snapshot.docs[0].data() as User;
      userCache.set(userData.id, userData); // Cache the result
      return userData;
    } catch (error) {
      handleFirestoreError('get user by firebase UID', error);
    }
    
    return undefined;
  }

  // Get the next user ID
  private async getNextUserId(): Promise<number> {
    if (this.userIdCounter > 0) {
      return this.userIdCounter + 1;
    }
    
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const usersQuery = db.collection(COLLECTIONS.USERS)
        .orderBy("id", "desc")
        .limit(1);
      
      const snapshot = await usersQuery.get();
      if (snapshot.empty) {
        this.userIdCounter = 0;
        return 1;
      }
      
      const maxId = snapshot.docs[0].data().id;
      this.userIdCounter = maxId;
      return maxId + 1;
    } catch (error) {
      console.error("Error getting next user ID:", error);
      return 1;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Check if user already exists
      const existingUser = await this.getUserByFirebaseUid(user.firebaseUid);
      if (existingUser) return existingUser;
      
      // Generate a new ID for the user
      const id = await this.getNextUserId();
      this.userIdCounter = id;
      
      // Create the user document with required fields
      const newUser: User = {
        ...user,
        id,
        displayName: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.collection(COLLECTIONS.USERS).doc(id.toString()).set(newUser);
      userCache.set(id, newUser); // Cache the new user
      return newUser;
    } catch (error) {
      handleFirestoreError('create user', error);
    }
    
    // TypeScript won't reach here due to handleFirestoreError, but needs this for type safety
    throw new Error("Failed to create user");
  }

  // Penguin methods
  async getAllPenguins(): Promise<Penguin[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const snapshot = await db.collection(COLLECTIONS.PENGUINS).get();
      
      const penguins = snapshot.docs.map(doc => {
        const data = doc.data() as Penguin;
        penguinCache.set(data.id, data); // Cache each penguin
        return data;
      });
      
      return penguins;
    } catch (error) {
      handleFirestoreError('get all penguins', error);
    }
    
    return [];
  }

  async getPenguin(id: number): Promise<Penguin | undefined> {
    // Check cache first
    if (penguinCache.has(id)) {
      return penguinCache.get(id);
    }
    
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const penguinDoc = await db.collection(COLLECTIONS.PENGUINS).doc(id.toString()).get();
      if (!penguinDoc.exists) return undefined;
      
      const penguinData = penguinDoc.data() as Penguin;
      penguinCache.set(id, penguinData); // Cache the result
      return penguinData;
    } catch (error) {
      handleFirestoreError('get penguin', error);
    }
    
    return undefined;
  }

  async createPenguin(penguin: InsertPenguin & { id?: number }): Promise<Penguin> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // If ID is provided, use it, otherwise generate a new one
      let id = penguin.id;
      if (!id) {
        id = this.penguinIdCounter + 1;
        this.penguinIdCounter = id;
      }
      
      // Create with required fields for Penguin type
      const newPenguin: Penguin = {
        ...penguin,
        id,
        bwImageUrl: penguin.bwImageUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.collection(COLLECTIONS.PENGUINS).doc(id.toString()).set(newPenguin);
      penguinCache.set(id, newPenguin); // Cache the new penguin
      return newPenguin;
    } catch (error) {
      handleFirestoreError('create penguin', error);
    }
    
    // TypeScript won't reach here due to handleFirestoreError, but needs this for type safety
    throw new Error("Failed to create penguin");
  }

  // Seen penguin methods
  async getSeenPenguins(userId: number): Promise<number[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      console.log(`Retrieving seen penguins for user ID ${userId} from Firestore`);
      
      const seenPenguinsQuery = db.collection(COLLECTIONS.SEEN_PENGUINS)
        .where("userId", "==", userId);
      
      const snapshot = await seenPenguinsQuery.get();
      const result = snapshot.docs.map(doc => (doc.data() as SeenPenguin).penguinId);
      
      console.log(`Found ${result.length} seen penguins for user ${userId}: ${result.join(', ')}`);
      return result;
    } catch (error) {
      handleFirestoreError('get seen penguins', error);
    }
    
    return [];
  }

  async addSeenPenguin(seenPenguin: InsertSeenPenguin): Promise<SeenPenguin> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      console.log(`Adding seen penguin for userId=${seenPenguin.userId}, penguinId=${seenPenguin.penguinId}`);
      
      // Check if this penguin is already seen by this user
      const seenPenguinsQuery = db.collection(COLLECTIONS.SEEN_PENGUINS)
        .where("userId", "==", seenPenguin.userId)
        .where("penguinId", "==", seenPenguin.penguinId)
        .limit(1);
      
      const snapshot = await seenPenguinsQuery.get();
      if (!snapshot.empty) {
        // Already seen, return the existing entry
        const existingEntry = snapshot.docs[0].data() as SeenPenguin;
        console.log(`Penguin ${seenPenguin.penguinId} already seen by user ${seenPenguin.userId}, returning existing entry with ID=${existingEntry.id}`);
        return existingEntry;
      }
      
      // Generate a new ID
      this.seenPenguinIdCounter += 1;
      const id = this.seenPenguinIdCounter;
      
      // Create the seen penguin entry
      const newSeenPenguin: SeenPenguin = {
        ...seenPenguin,
        id,
        createdAt: new Date().toISOString()
      };
      
      await db.collection(COLLECTIONS.SEEN_PENGUINS).doc(id.toString()).set(newSeenPenguin);
      console.log(`Storage: Created new seen penguin entry with ID=${id}`);
      
      // Log the current state of seen penguins for this user
      const allSeenQuery = db.collection(COLLECTIONS.SEEN_PENGUINS)
        .where("userId", "==", seenPenguin.userId);
      const allSeenSnapshot = await allSeenQuery.get();
      
      console.log(`Storage: All seen penguin entries after adding (${allSeenSnapshot.size} total):`);
      allSeenSnapshot.forEach(doc => {
        const data = doc.data() as SeenPenguin;
        console.log(`Storage: - ID=${data.id}, userId=${data.userId}, penguinId=${data.penguinId}`);
      });
      
      return newSeenPenguin;
    } catch (error) {
      handleFirestoreError('add seen penguin', error);
    }
    
    // TypeScript won't reach here due to handleFirestoreError, but needs this for type safety
    throw new Error("Failed to add seen penguin");
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      console.log(`Storage: Finding seen penguin entry for userId=${userId}, penguinId=${penguinId}`);
      
      // Get all seen penguins for debugging
      const allSeenQuery = db.collection(COLLECTIONS.SEEN_PENGUINS)
        .where("userId", "==", userId);
      const allSeenSnapshot = await allSeenQuery.get();
      
      console.log(`Storage: All seen penguin entries (${allSeenSnapshot.size} total):`);
      allSeenSnapshot.forEach(doc => {
        const data = doc.data() as SeenPenguin;
        console.log(`Storage: - ID=${data.id}, userId=${data.userId}, penguinId=${data.penguinId}`);
      });
      
      // Find the specific entry to remove
      const seenPenguinsQuery = db.collection(COLLECTIONS.SEEN_PENGUINS)
        .where("userId", "==", userId)
        .where("penguinId", "==", penguinId)
        .limit(1);
      
      const snapshot = await seenPenguinsQuery.get();
      if (snapshot.empty) {
        console.log(`Storage: No matching entry found to remove`);
        return; // Nothing to remove
      }
      
      // Delete the entry
      const entryToDelete = snapshot.docs[0].data() as SeenPenguin;
      console.log(`Storage: Found entry with ID=${entryToDelete.id}, removing it`);
      
      await snapshot.docs[0].ref.delete();
      console.log(`Storage: Successfully removed seen penguin entry (userId=${userId}, penguinId=${penguinId})`);
    } catch (error) {
      handleFirestoreError('remove seen penguin', error);
    }
  }

  // Sighting journal methods
  async getUserJournalEntries(userId: number): Promise<SightingJournal[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const cacheKey = `user_${userId}`;
      
      // Check cache first
      if (journalCache.has(cacheKey)) {
        return journalCache.get(cacheKey) || [];
      }
      
      console.log(`Fetching all journal entries for user ${userId} from Firestore`);
      
      const journalQuery = db.collection(COLLECTIONS.JOURNAL_ENTRIES)
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc"); // Most recent first
      
      const snapshot = await journalQuery.get();
      
      // Process entries to handle date conversions
      const entries: SightingJournal[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert sightingDate from ISO string to Date if it's a string
        if (data.sightingDate && typeof data.sightingDate === 'string') {
          // Create a proper SightingJournal object with the Date object for the app
          const entry: SightingJournal = {
            ...data,
            sightingDate: new Date(data.sightingDate) 
          } as SightingJournal;
          entries.push(entry);
        } else {
          entries.push(data as SightingJournal);
        }
      });
      
      console.log(`Found ${entries.length} total journal entries for user ${userId}`);
      
      journalCache.set(cacheKey, entries); // Cache the results
      
      return entries;
    } catch (error) {
      console.error("Error fetching user journal entries:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
      handleFirestoreError('get user journal entries', error);
    }
    
    return [];
  }

  async getPenguinJournalEntries(userId: number, penguinId: number): Promise<SightingJournal[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const cacheKey = `user_${userId}_penguin_${penguinId}`;
      
      // Check cache first
      if (journalCache.has(cacheKey)) {
        return journalCache.get(cacheKey) || [];
      }
      
      console.log(`Fetching journal entries for user ${userId} and penguin ${penguinId} from Firestore`);
      
      const journalQuery = db.collection(COLLECTIONS.JOURNAL_ENTRIES)
        .where("userId", "==", userId)
        .where("penguinId", "==", penguinId)
        .orderBy("createdAt", "desc"); // Most recent first
      
      const snapshot = await journalQuery.get();
      
      // Process entries to handle date conversions
      const entries: SightingJournal[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert sightingDate from ISO string to Date if it's a string
        if (data.sightingDate && typeof data.sightingDate === 'string') {
          // Create a proper SightingJournal object with the Date object for the app
          const entry: SightingJournal = {
            ...data,
            sightingDate: new Date(data.sightingDate) 
          } as SightingJournal;
          entries.push(entry);
        } else {
          entries.push(data as SightingJournal);
        }
      });
      
      console.log(`Found ${entries.length} journal entries for penguin ${penguinId}`);
      
      journalCache.set(cacheKey, entries); // Cache the results
      
      return entries;
    } catch (error) {
      console.error("Error fetching penguin journal entries:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
      handleFirestoreError('get penguin journal entries', error);
    }
    
    return [];
  }

  // Get the maximum journal ID from Firestore
  private async getNextJournalId(): Promise<number> {
    if (this.journalIdCounter > 0) {
      return this.journalIdCounter + 1;
    }
    
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Use orderBy and limit for efficient querying
      const journalQuery = db.collection(COLLECTIONS.JOURNAL_ENTRIES)
        .orderBy("id", "desc")
        .limit(1);
      
      const snapshot = await journalQuery.get();
      if (snapshot.empty) {
        return 1;
      }
      
      const maxId = snapshot.docs[0].data().id;
      this.journalIdCounter = maxId;
      return maxId + 1;
    } catch (error) {
      console.error("Error getting next journal ID:", error);
      return 1;
    }
  }
  
  async addJournalEntry(entry: InsertSightingJournal): Promise<SightingJournal> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      console.log("Adding journal entry with data:", JSON.stringify({
        userId: entry.userId,
        penguinId: entry.penguinId,
        hasDate: !!entry.sightingDate,
        dateType: entry.sightingDate ? typeof entry.sightingDate : 'undefined',
        location: entry.location
      }));
      
      // Generate a new ID
      const id = await this.getNextJournalId();
      this.journalIdCounter = id;
      
      // Convert Date object to ISO string for Firestore
      let sightingDateString: string | undefined;
      if (entry.sightingDate) {
        if (entry.sightingDate instanceof Date) {
          sightingDateString = entry.sightingDate.toISOString();
        } else if (typeof entry.sightingDate === 'string') {
          sightingDateString = entry.sightingDate;
        } else {
          // Handle any other case by using a safe default
          const date = new Date();
          sightingDateString = date.toISOString();
        }
      }
      
      // Create the journal entry
      const newEntry: SightingJournal = {
        id,
        userId: entry.userId,
        penguinId: entry.penguinId,
        sightingDate: entry.sightingDate as Date,
        location: entry.location,
        coordinates: entry.coordinates || null,
        notes: entry.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Replace sightingDate with string for Firestore
      const firestoreEntry = {
        ...newEntry,
        sightingDate: sightingDateString
      };
      
      console.log(`Prepared journal entry for Firestore: ${JSON.stringify({
        id: firestoreEntry.id,
        userId: firestoreEntry.userId,
        penguinId: firestoreEntry.penguinId,
        location: firestoreEntry.location,
        sightingDate: firestoreEntry.sightingDate
      })}`);
      
      await db.collection(COLLECTIONS.JOURNAL_ENTRIES).doc(id.toString()).set(firestoreEntry);
      console.log(`Journal entry saved to Firestore successfully with ID: ${id}`);
      
      // Invalidate cache
      this.invalidateJournalCache(entry.userId, entry.penguinId);
      
      // Return the complete entry with Date object
      return newEntry;
    } catch (error) {
      handleFirestoreError('add journal entry', error);
    }
    
    // TypeScript won't reach here due to handleFirestoreError, but needs this for type safety
    throw new Error("Failed to add journal entry");
  }

  async updateJournalEntry(id: number, updates: Partial<InsertSightingJournal>): Promise<SightingJournal | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Get existing entry
      const entryDoc = await db.collection(COLLECTIONS.JOURNAL_ENTRIES).doc(id.toString()).get();
      if (!entryDoc.exists) {
        console.error(`Journal entry with ID ${id} not found`);
        return undefined;
      }
      
      const existingData = entryDoc.data() as SightingJournal;
      
      // Convert Date object to ISO string for Firestore
      let sightingDateString: string | undefined;
      if (updates.sightingDate) {
        if (updates.sightingDate instanceof Date) {
          sightingDateString = updates.sightingDate.toISOString();
        } else if (typeof updates.sightingDate === 'string') {
          sightingDateString = updates.sightingDate;
        } else {
          // Handle any other case by using a safe default
          const date = new Date();
          sightingDateString = date.toISOString();
        }
      }
      
      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Replace sightingDate with string for Firestore
      if (sightingDateString !== undefined) {
        updateData.sightingDate = sightingDateString;
      }
      
      // Remove any undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      console.log(`Prepared updated entry for Firestore: ${JSON.stringify({
        id,
        userId: existingData.userId,
        penguinId: existingData.penguinId,
        location: updates.location || existingData.location,
        sightingDate: updateData.sightingDate || existingData.sightingDate
      })}`);
      
      // Update in Firestore
      await db.collection(COLLECTIONS.JOURNAL_ENTRIES).doc(id.toString()).update(updateData);
      console.log(`Journal entry updated successfully`);
      
      // Invalidate cache
      this.invalidateJournalCache(existingData.userId, existingData.penguinId);
      
      // Get the updated entry for return
      const updatedDoc = await db.collection(COLLECTIONS.JOURNAL_ENTRIES).doc(id.toString()).get();
      const updatedData = updatedDoc.data() as any;
      
      // Convert sightingDate back to Date object
      const updatedEntry: SightingJournal = {
        ...updatedData,
        sightingDate: updatedData.sightingDate 
          ? new Date(updatedData.sightingDate) 
          : null
      };
      
      return updatedEntry;
    } catch (error) {
      handleFirestoreError('update journal entry', error);
    }
    
    return undefined;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Get the entry first to know which caches to invalidate
      const entryDoc = await db.collection(COLLECTIONS.JOURNAL_ENTRIES).doc(id.toString()).get();
      if (!entryDoc.exists) {
        console.log(`Journal entry with ID ${id} not found, nothing to delete`);
        return;
      }
      
      const entryData = entryDoc.data() as SightingJournal;
      
      // Delete from Firestore
      await db.collection(COLLECTIONS.JOURNAL_ENTRIES).doc(id.toString()).delete();
      console.log(`Journal entry with ID ${id} deleted`);
      
      // Invalidate cache
      this.invalidateJournalCache(entryData.userId, entryData.penguinId);
    } catch (error) {
      handleFirestoreError('delete journal entry', error);
    }
  }

  private invalidateJournalCache(userId: number, penguinId: number): void {
    // Invalidate specific penguin journal cache
    const penguinCacheKey = `user_${userId}_penguin_${penguinId}`;
    journalCache.delete(penguinCacheKey);
    
    // Invalidate all user journals cache
    const userCacheKey = `user_${userId}`;
    journalCache.delete(userCacheKey);
  }
}

export const firestoreServerStorage = new FirestoreServerStorage();