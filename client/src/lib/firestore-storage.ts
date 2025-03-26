import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp,
  serverTimestamp,
  writeBatch
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

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  PENGUINS: 'penguins',
  SEEN_PENGUINS: 'seen_penguins',
  JOURNAL_ENTRIES: 'journal_entries',
};

// Error handling helper
const handleFirestoreError = (operation: string, error: any): never => {
  console.error(`Firestore error during ${operation}:`, error);
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

export class FirestoreStorage {
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
        // Ensure we have an ID for each penguin (should always have one from our data)
        const penguinId = (penguin as any).id ? (penguin as any).id : penguins.indexOf(penguin) + 1;
        const docRef = doc(penguinsCollection, penguinId.toString());
        batch.set(docRef, {
          ...penguin,
          id: penguinId,
          // Add any additional fields needed
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`Initialized ${penguins.length} penguins in Firestore`);
      return; // Explicit return for clarity
    } catch (error) {
      handleFirestoreError('initialize penguins', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, id.toString()));
      if (!userDoc.exists()) return undefined;
      
      return userDoc.data() as User;
    } catch (error) {
      handleFirestoreError('get user', error);
    }
    
    return undefined; // Explicit return for TypeScript
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS), 
        where("username", "==", username)
      );
      
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) return undefined;
      
      // Return the first match
      return snapshot.docs[0].data() as User;
    } catch (error) {
      handleFirestoreError('get user by username', error);
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS), 
        where("firebaseUid", "==", firebaseUid)
      );
      
      const snapshot = await getDocs(usersQuery);
      if (snapshot.empty) return undefined;
      
      // Return the first match
      return snapshot.docs[0].data() as User;
    } catch (error) {
      handleFirestoreError('get user by firebase UID', error);
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Check if user already exists
      const existingUser = await this.getUserByFirebaseUid(user.firebaseUid);
      if (existingUser) return existingUser;
      
      // Generate a new ID for the user
      const usersCollection = collection(db, COLLECTIONS.USERS);
      const snapshot = await getDocs(usersCollection);
      const id = snapshot.size + 1;
      
      // Create the user document
      const newUser: User = {
        ...user,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, COLLECTIONS.USERS, id.toString()), newUser);
      return newUser;
    } catch (error) {
      handleFirestoreError('create user', error);
    }
  }

  // Penguin methods
  async getAllPenguins(): Promise<Penguin[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const penguinsCollection = collection(db, COLLECTIONS.PENGUINS);
      const snapshot = await getDocs(penguinsCollection);
      
      return snapshot.docs.map(doc => doc.data() as Penguin);
    } catch (error) {
      handleFirestoreError('get all penguins', error);
    }
  }

  async getPenguin(id: number): Promise<Penguin | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const penguinDoc = await getDoc(doc(db, COLLECTIONS.PENGUINS, id.toString()));
      if (!penguinDoc.exists()) return undefined;
      
      return penguinDoc.data() as Penguin;
    } catch (error) {
      handleFirestoreError('get penguin', error);
    }
  }

  async createPenguin(penguin: InsertPenguin & { id?: number }): Promise<Penguin> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // If ID is provided, use it, otherwise generate a new one
      let id = penguin.id;
      if (!id) {
        const penguinsCollection = collection(db, COLLECTIONS.PENGUINS);
        const snapshot = await getDocs(penguinsCollection);
        id = snapshot.size + 1;
      }
      
      const newPenguin: Penguin = {
        ...penguin,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, COLLECTIONS.PENGUINS, id.toString()), newPenguin);
      return newPenguin;
    } catch (error) {
      handleFirestoreError('create penguin', error);
    }
  }

  // Seen penguin methods
  async getSeenPenguins(userId: number): Promise<number[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const seenPenguinsQuery = query(
        collection(db, COLLECTIONS.SEEN_PENGUINS),
        where("userId", "==", userId)
      );
      
      const snapshot = await getDocs(seenPenguinsQuery);
      return snapshot.docs.map(doc => (doc.data() as SeenPenguin).penguinId);
    } catch (error) {
      handleFirestoreError('get seen penguins', error);
    }
  }

  async addSeenPenguin(seenPenguin: InsertSeenPenguin): Promise<SeenPenguin> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Check if this penguin is already seen by this user
      const seenPenguinsQuery = query(
        collection(db, COLLECTIONS.SEEN_PENGUINS),
        where("userId", "==", seenPenguin.userId),
        where("penguinId", "==", seenPenguin.penguinId)
      );
      
      const snapshot = await getDocs(seenPenguinsQuery);
      if (!snapshot.empty) {
        // Already seen, return the existing entry
        return snapshot.docs[0].data() as SeenPenguin;
      }
      
      // Generate a new ID
      const seenPenguinsCollection = collection(db, COLLECTIONS.SEEN_PENGUINS);
      const allSnapshot = await getDocs(seenPenguinsCollection);
      const id = allSnapshot.size + 1;
      
      // Create the seen penguin entry
      const newSeenPenguin: SeenPenguin = {
        ...seenPenguin,
        id,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, COLLECTIONS.SEEN_PENGUINS, id.toString()), newSeenPenguin);
      return newSeenPenguin;
    } catch (error) {
      handleFirestoreError('add seen penguin', error);
    }
  }

  async removeSeenPenguin(userId: number, penguinId: number): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Find the seen penguin entry
      const seenPenguinsQuery = query(
        collection(db, COLLECTIONS.SEEN_PENGUINS),
        where("userId", "==", userId),
        where("penguinId", "==", penguinId)
      );
      
      const snapshot = await getDocs(seenPenguinsQuery);
      if (snapshot.empty) return; // Nothing to remove
      
      // Delete the entry
      await deleteDoc(snapshot.docs[0].ref);
    } catch (error) {
      handleFirestoreError('remove seen penguin', error);
    }
  }

  // Sighting journal methods
  async getUserJournalEntries(userId: number): Promise<SightingJournal[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const journalQuery = query(
        collection(db, COLLECTIONS.JOURNAL_ENTRIES),
        where("userId", "==", userId)
      );
      
      const snapshot = await getDocs(journalQuery);
      return snapshot.docs.map(doc => doc.data() as SightingJournal);
    } catch (error) {
      handleFirestoreError('get user journal entries', error);
    }
  }

  async getPenguinJournalEntries(userId: number, penguinId: number): Promise<SightingJournal[]> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      const journalQuery = query(
        collection(db, COLLECTIONS.JOURNAL_ENTRIES),
        where("userId", "==", userId),
        where("penguinId", "==", penguinId)
      );
      
      const snapshot = await getDocs(journalQuery);
      return snapshot.docs.map(doc => doc.data() as SightingJournal);
    } catch (error) {
      handleFirestoreError('get penguin journal entries', error);
    }
  }

  async addJournalEntry(entry: InsertSightingJournal): Promise<SightingJournal> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Generate a new ID
      const journalCollection = collection(db, COLLECTIONS.JOURNAL_ENTRIES);
      const allSnapshot = await getDocs(journalCollection);
      const id = allSnapshot.size + 1;
      
      // Create the journal entry
      const newEntry: SightingJournal = {
        ...entry,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()), newEntry);
      return newEntry;
    } catch (error) {
      handleFirestoreError('add journal entry', error);
    }
  }

  async updateJournalEntry(id: number, updates: Partial<InsertSightingJournal>): Promise<SightingJournal | undefined> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      // Get the existing entry
      const entryDoc = await getDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()));
      if (!entryDoc.exists()) return undefined;
      
      // Update the entry
      const updatedEntry: SightingJournal = {
        ...(entryDoc.data() as SightingJournal),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()), updatedEntry);
      return updatedEntry;
    } catch (error) {
      handleFirestoreError('update journal entry', error);
    }
  }

  async deleteJournalEntry(id: number): Promise<void> {
    if (!db) throw new Error("Firestore not initialized");
    
    try {
      await deleteDoc(doc(db, COLLECTIONS.JOURNAL_ENTRIES, id.toString()));
    } catch (error) {
      handleFirestoreError('delete journal entry', error);
    }
  }
}

// Export singleton instance of storage
export const firestoreStorage = new FirestoreStorage();