import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  writeBatch,
  limit,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import type { 
  User, 
  Penguin, 
  SeenPenguin, 
  SightingJournal, 
  InsertUser, 
  InsertPenguin, 
  InsertSeenPenguin, 
  InsertSightingJournal 
} from "@shared/schema";

// Define the storage interface type
interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByDisplayName(displayName: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
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

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  PENGUINS: 'penguins',
  SEEN_PENGUINS: 'seen_penguins',
  JOURNAL_ENTRIES: 'journal_entries',
};

// Caching maps for better performance
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

// Function to validate Firestore rules
export async function validateFirestoreRules(): Promise<boolean> {
  if (!db) {
    console.error('Firestore not initialized');
    return false;
  }
  
  try {
    console.log('Validating Firestore rules...');
    
    // Try to read from a test document to validate read permissions
    const testDocRef = doc(db, 'test_permissions', 'test_doc');
    
    // First try reading
    try {
      await getDoc(testDocRef);
      console.log('Firestore read permissions are valid');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.error('Firestore read permissions are denied by security rules');
        return false;
      }
      // Not found is expected and means read permissions are OK
      console.log('Firestore read permissions appear to be valid');
    }
    
    // Then try writing
    try {
      await setDoc(testDocRef, { 
        timestamp: new Date().toISOString(),
        message: 'Testing write permissions'
      });
      console.log('Firestore write permissions are valid');
      
      // Clean up after ourselves
      await deleteDoc(testDocRef);
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.error('Firestore write permissions are denied by security rules');
        return false;
      }
      console.error('Error validating write permissions:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating Firestore rules:', error);
    return false;
  }
};

export class FirestoreStorage implements IStorage {
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
      const penguinsCollection = collection(db, COLLECTIONS.PENGUINS);
      const snapshot = await getDocs(penguinsCollection);
      
      // If we already have penguins, don't re-add them
      if (!snapshot.empty) return;
      
      // Add all penguins to the collection
      const batch = writeBatch(db);
      for (const penguin of penguins) {
        // Ensure we have an ID for each penguin
        const penguinId = (penguin as any).id ? (penguin as any).id : penguins.indexOf(penguin) + 1;
        const docRef = doc(penguinsCollection, penguinId.toString());
        
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
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, id.toString()));
      if (!userDoc.exists()) return undefined;
      
      const data = userDoc.data();
      // Ensure we have a properly typed User object with seenPenguins as an array or null
      const userData: User = {
        id: data.id,
        firebaseUid: data.firebaseUid,
        displayName: data.displayName || null,
        email: data.email || null,
        photoURL: data.photoURL || null,
        seenPenguins: data.seenPenguins || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
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
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS), 
        where("displayName", "==", displayName),
        limit(1) // Only need first match
      );
      
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) return undefined;
      
      const data = snapshot.docs[0].data();
      // Ensure we have a properly typed User object with seenPenguins as an array or null
      const userData: User = {
        id: data.id,
        firebaseUid: data.firebaseUid,
        displayName: data.displayName || null,
        email: data.email || null,
        photoURL: data.photoURL || null,
        seenPenguins: data.seenPenguins || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
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
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS), 
        where("firebaseUid", "==", firebaseUid),
        limit(1) // Only need first match
      );
      
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) return undefined;
      
      const data = snapshot.docs[0].data();
      // Ensure we have a properly typed User object with seenPenguins as an array or null
      const userData: User = {
        id: data.id,
        firebaseUid: data.firebaseUid,
        displayName: data.displayName || null,
        email: data.email || null,
        photoURL: data.photoURL || null,
        seenPenguins: data.seenPenguins || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
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
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        orderBy("id", "desc"),
        limit(1)
      );
      
      const snapshot = await getDocs(usersQuery);
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
        id,
        firebaseUid: user.firebaseUid,
        displayName: user.displayName || null,
        email: user.email || null,
        photoURL: user.photoURL || null,
        seenPenguins: user.seenPenguins || [], // Initialize with empty array if not provided
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, id.toString()), newUser);
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
      const penguinsCollection = collection(db, COLLECTIONS.PENGUINS);
      const snapshot = await getDocs(penguinsCollection);
      
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
      const penguinDoc = await getDoc(doc(db, COLLECTIONS.PENGUINS, id.toString()));
      if (!penguinDoc.exists()) return undefined;
      
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
      
      await setDoc(doc(db, COLLECTIONS.PENGUINS, id.toString()), newPenguin);
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
      console.log(`Getting seen penguins for user ID ${userId} from Firestore`);
      
      // Get the user document
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId.toString()));
      if (!userDoc.exists()) {
        console.log(`User ${userId} not found`);
        return [];
      }
      
      const data = userDoc.data();
      // Ensure we have a properly typed User object with seenPenguins as an array or null
      const userData: User = {
        id: data.id,
        firebaseUid: data.firebaseUid,
        displayName: data.displayName || null,
        email: data.email || null,
        photoURL: data.photoURL || null,
        seenPenguins: data.seenPenguins || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      // Get seenPenguins from user document
      const seenPenguinIds = userData.seenPenguins || [];
      
      // Convert string IDs to numbers
      const result = seenPenguinIds.map(id => parseInt(id, 10));
      
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
      
      // Get the user document
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, seenPenguin.userId.toString()));
      if (!userDoc.exists()) {
        throw new Error(`User ${seenPenguin.userId} not found`);
      }
      
      const data = userDoc.data();
      // Ensure we have a properly typed User object with seenPenguins as an array or null
      const userData: User = {
        id: data.id,
        firebaseUid: data.firebaseUid,
        displayName: data.displayName || null,
        email: data.email || null,
        photoURL: data.photoURL || null,
        seenPenguins: data.seenPenguins || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      // Get current seen penguins
      const seenPenguinIds = userData.seenPenguins || [];
      const penguinIdStr = seenPenguin.penguinId.toString();
      
      // Check if already in the list
      if (seenPenguinIds.includes(penguinIdStr)) {
        console.log(`Penguin ${seenPenguin.penguinId} already seen by user ${seenPenguin.userId}`);
        
        // Create a representation of the SeenPenguin for backward compatibility
        const id = this.seenPenguinIdCounter + 1;
        this.seenPenguinIdCounter = id;
        
        return {
          id,
          userId: seenPenguin.userId,
          penguinId: seenPenguin.penguinId,
          createdAt: new Date().toISOString()
        };
      }
      
      // Add the penguin to the list
      seenPenguinIds.push(penguinIdStr);
      
      // Update the user document
      await updateDoc(doc(db, COLLECTIONS.USERS, seenPenguin.userId.toString()), {
        seenPenguins: seenPenguinIds,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Added penguin ${seenPenguin.penguinId} to user ${seenPenguin.userId}'s seen penguins. Total now: ${seenPenguinIds.length}`);
      
      // Create a representation of the SeenPenguin for backward compatibility
      const id = this.seenPenguinIdCounter + 1;
      this.seenPenguinIdCounter = id;
      
      return {
        id,
        userId: seenPenguin.userId,
        penguinId: seenPenguin.penguinId,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      handleFirestoreError('add seen penguin', error);
    }
    
    // TypeScript won't reach here due to handleFirestoreError, but needs this for type safety
    throw new Error("Failed to add seen penguin");
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      console.log(`Removing penguin ${penguinId} from user ${userId}'s seen penguins`);
      
      // Get the user document
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId.toString()));
      if (!userDoc.exists()) {
        console.log(`User ${userId} not found`);
        return;
      }
      
      const userData = userDoc.data() as User;
      
      // Get current seen penguins
      const seenPenguinIds = userData.seenPenguins || [];
      const penguinIdStr = penguinId.toString();
      
      // Check if in the list
      if (!seenPenguinIds.includes(penguinIdStr)) {
        console.log(`Penguin ${penguinId} not found in user ${userId}'s seen penguins`);
        return; // Nothing to remove
      }
      
      // Remove the penguin from the list
      const updatedSeenPenguins = seenPenguinIds.filter(id => id !== penguinIdStr);
      
      // Update the user document
      await updateDoc(doc(db, COLLECTIONS.USERS, userId.toString()), {
        seenPenguins: updatedSeenPenguins,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Removed penguin ${penguinId} from user ${userId}'s seen penguins. Remaining: ${updatedSeenPenguins.length}`);
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
      
      const journalQuery = query(
        collection(db, COLLECTIONS.JOURNAL_ENTRIES),
        where("userId", "==", userId),
        orderBy("createdAt", "desc") // Most recent first
      );
      
      console.time('getUserJournalEntries');
      const snapshot = await getDocs(journalQuery);
      console.timeEnd('getUserJournalEntries');
      
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
      
      const journalQuery = query(
        collection(db, COLLECTIONS.JOURNAL_ENTRIES),
        where("userId", "==", userId),
        where("penguinId", "==", penguinId),
        orderBy("createdAt", "desc") // Most recent first
      );
      
      console.time('getPenguinJournalEntries');
      const snapshot = await getDocs(journalQuery);
      console.timeEnd('getPenguinJournalEntries');
      
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
      const journalQuery = query(
        collection(db, COLLECTIONS.JOURNAL_ENTRIES),
        orderBy("id", "desc"),
        limit(1)
      );
      
      const snapshot = await getDocs(journalQuery);
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
      
      // Get the next ID
      const id = await this.getNextJournalId();
      this.journalIdCounter = id;
      
      // Create the firestore document object (with string dates)
      const firestoreDoc = {
        ...entry,
        id,
        notes: entry.notes || null,
        coordinates: entry.coordinates || null,
        sightingDate: entry.sightingDate 
          ? (entry.sightingDate instanceof Date 
              ? entry.sightingDate.toISOString() 
              : new Date(entry.sightingDate).toISOString())
          : new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Then create the SightingJournal object that matches the schema type
      const newEntry: SightingJournal = {
        ...entry,
        id,
        notes: entry.notes || null,
        coordinates: entry.coordinates || null,
        // For the app, convert ISO string back to Date if needed
        sightingDate: entry.sightingDate || new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Prepared journal entry for Firestore:", JSON.stringify({
        id: firestoreDoc.id,
        userId: firestoreDoc.userId,
        penguinId: firestoreDoc.penguinId,
        location: firestoreDoc.location,
        sightingDate: firestoreDoc.sightingDate
      }));
      
      // Add the document with the ID as its key for faster lookup
      await setDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()), firestoreDoc);
      console.log("Journal entry saved to Firestore successfully with ID:", id);
      
      // Update cache
      this.invalidateJournalCache(entry.userId, entry.penguinId);
      
      return newEntry;
    } catch (error) {
      console.error("Detailed Firestore error adding journal entry:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      handleFirestoreError('add journal entry', error);
    }
    
    // TypeScript won't reach here due to handleFirestoreError, but needs this for type safety
    throw new Error("Failed to add journal entry");
  }

  async updateJournalEntry(id: number, updates: Partial<InsertSightingJournal>): Promise<SightingJournal | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      console.log("Updating journal entry", id, "with data:", JSON.stringify({
        hasDate: !!updates.sightingDate,
        dateType: updates.sightingDate ? typeof updates.sightingDate : 'undefined',
        location: updates.location,
        notes: updates.notes?.substring(0, 20) + (updates.notes && updates.notes.length > 20 ? '...' : '')
      }));
      
      // Get the existing entry
      const entryDoc = await getDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()));
      if (!entryDoc.exists()) {
        console.error(`Entry with ID ${id} not found in Firestore`);
        return undefined;
      }
      
      const existingEntry = entryDoc.data() as any; // Use any temporarily to avoid type issues
      
      // Process sightingDate - convert to ISO string for Firestore
      let firestoreSightingDate = existingEntry.sightingDate; // Get string from Firestore
      if (updates.sightingDate) {
        firestoreSightingDate = updates.sightingDate instanceof Date 
          ? updates.sightingDate.toISOString() 
          : new Date(updates.sightingDate).toISOString();
      }
      
      // Create Firestore document object (with string dates for storage)
      const firestoreDoc = {
        ...existingEntry,
        ...updates,
        notes: updates.notes !== undefined ? updates.notes : existingEntry.notes,
        coordinates: updates.coordinates !== undefined ? updates.coordinates : existingEntry.coordinates,
        sightingDate: firestoreSightingDate,
        updatedAt: new Date().toISOString()
      };
      
      // Create the return object that matches the schema types
      const updatedEntry: SightingJournal = {
        ...existingEntry,
        ...updates,
        notes: updates.notes !== undefined ? updates.notes : existingEntry.notes,
        coordinates: updates.coordinates !== undefined ? updates.coordinates : existingEntry.coordinates,
        // For the app, use the Date object
        sightingDate: updates.sightingDate || 
                     (existingEntry.sightingDate ? 
                      typeof existingEntry.sightingDate === 'string' ? 
                      new Date(existingEntry.sightingDate) : 
                      existingEntry.sightingDate : 
                      new Date()),
        updatedAt: new Date().toISOString()
      };
      
      console.log("Prepared updated entry for Firestore:", JSON.stringify({
        id: firestoreDoc.id,
        userId: firestoreDoc.userId,
        penguinId: firestoreDoc.penguinId,
        location: firestoreDoc.location,
        sightingDate: firestoreDoc.sightingDate
      }));
      
      await updateDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()), firestoreDoc);
      console.log("Journal entry updated successfully");
      
      // Update cache
      this.invalidateJournalCache(existingEntry.userId, existingEntry.penguinId);
      
      return updatedEntry;
    } catch (error) {
      console.error("Detailed Firestore error updating journal entry:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      handleFirestoreError('update journal entry', error);
    }
    
    return undefined;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Get the entry first to know which caches to invalidate
      const entryDoc = await getDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()));
      if (!entryDoc.exists()) return;
      
      const entry = entryDoc.data() as SightingJournal;
      
      // Delete the document
      await deleteDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()));
      
      // Update cache
      this.invalidateJournalCache(entry.userId, entry.penguinId);
    } catch (error) {
      handleFirestoreError('delete journal entry', error);
    }
  }
  
  // Helper to invalidate journal caches
  private invalidateJournalCache(userId: number, penguinId: number): void {
    // Clear the specific penguin journal cache
    journalCache.delete(`user_${userId}_penguin_${penguinId}`);
    
    // Clear the user's overall journal cache
    journalCache.delete(`user_${userId}`);
  }
}

// Export singleton instance of storage
export const firestoreStorage = new FirestoreStorage();