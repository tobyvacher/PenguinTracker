import { useState, useEffect } from "react";
import { firestoreStorage } from "@/lib/firestore-storage";
import { auth, getCurrentUser } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { penguinData } from "@/lib/penguin-data";

// Hook for managing penguin data in Firestore
export function useFirestorePenguinStore() {
  const [seenPenguins, setSeenPenguins] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentUser, isAuthenticated } = useAuth();
  
  // Initialize penguins collection when the hook is first used
  useEffect(() => {
    const initializePenguins = async () => {
      try {
        // Check if we already have penguins in Firestore
        const existingPenguins = await firestoreStorage.getAllPenguins();
        
        // If we don't have any penguins, initialize with our data
        if (!existingPenguins || existingPenguins.length === 0) {
          console.log("Initializing penguin data in Firestore...");
          
          // First penguin will be added one-by-one to establish IDs
          for (const penguin of penguinData) {
            await firestoreStorage.createPenguin(penguin);
          }
          
          console.log("Penguin data initialized in Firestore");
        } else {
          console.log(`Found ${existingPenguins.length} penguins in Firestore`);
        }
      } catch (err) {
        console.error("Error initializing penguins:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    initializePenguins();
  }, []);
  
  // Load seen penguins from Firestore when auth state changes
  useEffect(() => {
    const fetchSeenPenguins = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current Firebase user
        const user = getCurrentUser();
        
        if (!user) {
          // If not logged in, use guest data from localStorage
          const guestData = localStorage.getItem('seenPenguins-guest');
          if (guestData) {
            setSeenPenguins(JSON.parse(guestData));
          } else {
            setSeenPenguins([]);
          }
          
          setIsLoading(false);
          return;
        }
        
        // Get or create user in our database
        const userData = await firestoreStorage.getUserByFirebaseUid(user.uid);
        
        let userId: number;
        if (userData) {
          userId = userData.id;
        } else {
          // Create new user if they don't exist yet
          const newUser = await firestoreStorage.createUser({
            firebaseUid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email || 'User'
          });
          userId = newUser.id;
          
          // Import guest data if available
          const guestData = localStorage.getItem('seenPenguins-guest');
          if (guestData) {
            const guestSeenPenguins = JSON.parse(guestData) as number[];
            
            // Add guest seen penguins to the user's account
            for (const penguinId of guestSeenPenguins) {
              await firestoreStorage.addSeenPenguin({
                userId,
                penguinId
              });
            }
            
            // Clear guest data after import
            localStorage.removeItem('seenPenguins-guest');
          }
        }
        
        // Fetch user's seen penguins
        const userSeenPenguins = await firestoreStorage.getSeenPenguins(userId);
        setSeenPenguins(userSeenPenguins);
        
        // Store in localStorage as backup
        localStorage.setItem(`seenPenguins-${user.uid}`, JSON.stringify(userSeenPenguins));
        
      } catch (err) {
        console.error("Error fetching seen penguins:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        
        // Try to load from localStorage as fallback
        const storageKey = currentUser ? `seenPenguins-${currentUser.uid}` : 'seenPenguins-guest';
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          setSeenPenguins(JSON.parse(storedData));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeenPenguins();
  }, [currentUser, isAuthenticated]);
  
  // Toggle penguin seen status
  const toggleSeen = async (penguinId: number) => {
    try {
      // Check if the penguin is currently seen
      const isCurrentlySeen = seenPenguins.includes(penguinId);
      
      // Get the current user
      const user = getCurrentUser();
      
      if (!user) {
        // If not logged in, just use localStorage
        const guestData = localStorage.getItem('seenPenguins-guest') || '[]';
        let guestSeenPenguins = JSON.parse(guestData) as number[];
        
        if (isCurrentlySeen) {
          // Remove from seen
          guestSeenPenguins = guestSeenPenguins.filter(id => id !== penguinId);
          console.log(`Removed penguin ${penguinId} from guest seen list`);
        } else {
          // Add to seen
          guestSeenPenguins.push(penguinId);
          console.log(`Added penguin ${penguinId} to guest seen list`);
        }
        
        // Update state and localStorage
        setSeenPenguins(guestSeenPenguins);
        localStorage.setItem('seenPenguins-guest', JSON.stringify(guestSeenPenguins));
        return;
      }
      
      // For logged in users, use Firestore
      // Get or create user
      const userData = await firestoreStorage.getUserByFirebaseUid(user.uid);
      if (!userData) {
        throw new Error("User not found in database");
      }
      
      const userId = userData.id;
      
      if (isCurrentlySeen) {
        // Remove from seen
        await firestoreStorage.removeSeenPenguin(userId, penguinId);
        console.log(`Removed penguin ${penguinId} from seen list for user ${userId}`);
        
        // Update state
        const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(`seenPenguins-${user.uid}`, JSON.stringify(updatedSeenPenguins));
      } else {
        // Add to seen
        await firestoreStorage.addSeenPenguin({
          userId,
          penguinId
        });
        console.log(`Added penguin ${penguinId} to seen list for user ${userId}`);
        
        // Update state
        const updatedSeenPenguins = [...seenPenguins, penguinId];
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(`seenPenguins-${user.uid}`, JSON.stringify(updatedSeenPenguins));
      }
    } catch (err) {
      console.error("Error toggling penguin seen status:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Refresh data from Firestore to ensure consistency
      const user = getCurrentUser();
      if (user) {
        const userData = await firestoreStorage.getUserByFirebaseUid(user.uid);
        if (userData) {
          const freshData = await firestoreStorage.getSeenPenguins(userData.id);
          setSeenPenguins(freshData);
          localStorage.setItem(`seenPenguins-${user.uid}`, JSON.stringify(freshData));
        }
      }
    }
  };
  
  return {
    seenPenguins,
    toggleSeen,
    isLoading,
    error
  };
}