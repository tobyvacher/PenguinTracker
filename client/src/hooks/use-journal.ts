import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SightingJournal, InsertSightingJournal } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreStorage } from "@/lib/firestore-storage";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

// Type for journal entry input
type JournalEntryInput = Omit<InsertSightingJournal, "userId">;

// Firebase query keys
const FIRESTORE_KEYS = {
  ALL_ENTRIES: "firestore-journal",
  PENGUIN_ENTRIES: "penguin"
};

// API query keys
const API_KEYS = {
  ALL_ENTRIES: "/api/journal",
  PENGUIN_ENTRIES: (id: number) => `/api/journal/penguin/${id}`
};

export function useJournal() {
  const { isAuthenticated, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [useFirestore, setUseFirestore] = useState(false);
  const userIdCache = useRef<Record<string, number>>({});
  const { toast } = useToast();
  
  // Determine whether to use Firestore or API
  useEffect(() => {
    // Check if we have Firebase configuration
    const envVars = import.meta.env;
    const hasFirebaseConfig = 
      !!envVars.VITE_FIREBASE_API_KEY && 
      !!envVars.VITE_FIREBASE_PROJECT_ID && 
      !!envVars.VITE_FIREBASE_APP_ID;
      
    setUseFirestore(hasFirebaseConfig);
    console.log("Journal storage mode:", hasFirebaseConfig ? "Firestore" : "API");
  }, []);

  // Helper to get user ID from Firebase UID - with caching for performance
  // Will create the user in Firestore if not found
  const getUserIdFromFirebase = useCallback(async (firebaseUid: string): Promise<number | null> => {
    // Check cache first
    if (userIdCache.current[firebaseUid]) {
      return userIdCache.current[firebaseUid];
    }
    
    try {
      // First try to get existing user
      const fbUser = await firestoreStorage.getUserByFirebaseUid(firebaseUid);
      if (fbUser) {
        // Cache the user ID for future use
        userIdCache.current[firebaseUid] = fbUser.id;
        return fbUser.id;
      }
      
      // If user not found but we have current Firebase user, create them in Firestore
      if (currentUser) {
        console.log("User not found in Firestore, creating now:", firebaseUid);
        
        try {
          // Create the user in Firestore with fields matching InsertUser type
          const newUser = await firestoreStorage.createUser({
            firebaseUid: currentUser.uid,
            displayName: currentUser.displayName || null,
            email: currentUser.email || null,
            photoURL: currentUser.photoURL || null
          });
          
          console.log("Created new user in Firestore:", newUser);
          
          // Cache the new user ID
          userIdCache.current[firebaseUid] = newUser.id;
          return newUser.id;
        } catch (createError) {
          console.error("Error creating user in Firestore:", createError);
          // Fall through to return null
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching/creating user in Firestore:", error);
      toast({
        title: "Error",
        description: "Could not retrieve or create user information",
        variant: "destructive"
      });
      return null;
    }
  }, [toast, currentUser]);

  // Fetch all journal entries for current user
  const getUserJournalQuery = useQuery({
    queryKey: useFirestore ? [FIRESTORE_KEYS.ALL_ENTRIES] : [API_KEYS.ALL_ENTRIES],
    queryFn: async () => {
      if (useFirestore && currentUser) {
        const userId = await getUserIdFromFirebase(currentUser.uid);
        if (userId) {
          console.time('fetchAllJournalEntries');
          const entries = await firestoreStorage.getUserJournalEntries(userId);
          console.timeEnd('fetchAllJournalEntries');
          return entries;
        }
        return [];
      }
      
      // Fallback to API
      const fetchFn = getQueryFn<SightingJournal[]>({ on401: "returnNull" });
      return fetchFn({ 
        queryKey: [API_KEYS.ALL_ENTRIES],
        signal: new AbortController().signal,
        meta: undefined 
      });
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes - don't refetch too often
    retry: 2, // Retry failed queries twice
  });

  // Fetch journal entries for a specific penguin - with enhanced caching
  const getPenguinJournalEntries = (penguinId: number) => {
    const queryOptions: UseQueryOptions<SightingJournal[], Error, SightingJournal[]> = {
      queryKey: useFirestore 
        ? [FIRESTORE_KEYS.ALL_ENTRIES, FIRESTORE_KEYS.PENGUIN_ENTRIES, penguinId] 
        : [API_KEYS.PENGUIN_ENTRIES(penguinId)],
      queryFn: async () => {
        // Check if we can get from all entries cache first (faster)
        if (useFirestore && currentUser && penguinId) {
          const existingAllEntries = queryClient.getQueryData<SightingJournal[]>(
            [FIRESTORE_KEYS.ALL_ENTRIES]
          );
          
          // If we already have all entries cached, filter them instead of fetching
          if (existingAllEntries && existingAllEntries.length > 0) {
            console.log(`Using cached entries for penguin ${penguinId}`);
            const userId = await getUserIdFromFirebase(currentUser.uid);
            if (userId) {
              return existingAllEntries.filter(entry => 
                entry.userId === userId && entry.penguinId === penguinId
              );
            }
          }
          
          // Otherwise fetch as usual
          const userId = await getUserIdFromFirebase(currentUser.uid);
          if (userId) {
            console.time(`fetchPenguinJournal-${penguinId}`);
            const entries = await firestoreStorage.getPenguinJournalEntries(userId, penguinId);
            console.timeEnd(`fetchPenguinJournal-${penguinId}`);
            return entries;
          }
          return [];
        }
        
        // Fallback to API
        const fetchFn = getQueryFn<SightingJournal[]>({ on401: "returnNull" });
        return fetchFn({ 
          queryKey: [API_KEYS.PENGUIN_ENTRIES(penguinId)],
          signal: new AbortController().signal,
          meta: undefined 
        });
      },
      enabled: !!penguinId && isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes - don't refetch too often
      retry: 2 // Retry failed queries twice
    };
    
    return useQuery(queryOptions);
  };

  // Add a new journal entry with enhanced error handling and logging
  const addJournalEntryMutation = useMutation({
    mutationFn: async (data: JournalEntryInput) => {
      try {
        console.log('Starting addJournalEntry mutation with data:', {
          penguinId: data.penguinId,
          hasDate: !!data.sightingDate,
          dateType: data.sightingDate ? typeof data.sightingDate : 'undefined',
          location: data.location,
          mode: useFirestore ? 'Firestore' : 'API'
        });
        
        if (useFirestore && currentUser) {
          console.log('Using Firestore for journal entry creation');
          
          // Verify Firestore is available (using any type to avoid TS errors with global declarations)
          const firebaseGlobal = (window as any).firebase;
          if (!firebaseGlobal?.firestore) {
            console.error('Firestore is not properly initialized in window.firebase');
          }
          
          // Get user ID from Firebase UID
          const userId = await getUserIdFromFirebase(currentUser.uid);
          if (!userId) {
            console.error('Failed to get user ID for Firebase UID:', currentUser.uid);
            throw new Error("User not found in Firestore database. Please try refreshing the page.");
          }
          console.log('Got userId:', userId, 'for Firebase UID:', currentUser.uid);
          
          // Add userId to the data and ensure required fields
          const fullEntry: InsertSightingJournal = {
            ...data,
            userId,
            // Required fields should always have values
            sightingDate: data.sightingDate || new Date(),
            notes: data.notes || null,
            coordinates: data.coordinates || null
          };
          
          console.log('Prepared entry with fields:', {
            userId: fullEntry.userId,
            penguinId: fullEntry.penguinId,
            location: fullEntry.location,
            hasDate: !!fullEntry.sightingDate,
            dateType: fullEntry.sightingDate ? 
              (fullEntry.sightingDate instanceof Date ? 'Date' : typeof fullEntry.sightingDate) 
              : 'undefined'
          });
          
          // Performance optimization - add timestamp before starting
          console.time('addJournalEntry');
          const result = await firestoreStorage.addJournalEntry(fullEntry);
          console.timeEnd('addJournalEntry');
          
          console.log('Successfully created journal entry with ID:', result.id);
          return result;
        }
        
        // Fallback to API
        console.log('Using API for journal entry creation');
        const response = await apiRequest(API_KEYS.ALL_ENTRIES, "POST", data);
        return response;
      } catch (error) {
        console.error("Detailed error in addJournalEntry mutation:", error);
        
        // Add more context to help debug
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
          
          // Enhance the error message with more context
          error.message = `Failed to add journal entry: ${error.message}`;
        }
        
        throw error; // Re-throw for the onError handler
      }
    },
    onSuccess: (result, variables) => {
      // Success toast
      toast({
        title: "Success",
        description: "Journal entry added successfully",
        variant: "default"
      });
      
      // Type-safe logging of the result
      if (useFirestore) {
        // In Firestore mode, result is SightingJournal
        const journalEntry = result as SightingJournal;
        console.log('Journal entry mutation succeeded with result:', {
          id: journalEntry.id,
          penguinId: journalEntry.penguinId,
          location: journalEntry.location,
          date: journalEntry.sightingDate
        });
      } else {
        // In API mode, just log that it succeeded
        console.log('Journal entry mutation succeeded with API response');
      }
      
      // Intelligently invalidate only what's needed
      if (useFirestore) {
        // Instead of invalidating, we can update the cache directly
        updateJournalCache(result as SightingJournal, "add");
        
        // Still invalidate queries to ensure data consistency
        queryClient.invalidateQueries({ 
          queryKey: [FIRESTORE_KEYS.ALL_ENTRIES] 
        });
        
        // Only invalidate the specific penguin query if needed
        if (variables.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [FIRESTORE_KEYS.ALL_ENTRIES, FIRESTORE_KEYS.PENGUIN_ENTRIES, variables.penguinId]
          });
        }
      } else {
        // For API, just invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [API_KEYS.ALL_ENTRIES] });
        if (variables.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [API_KEYS.PENGUIN_ENTRIES(variables.penguinId)]
          });
        }
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unknown error occurred while saving your journal entry";
        
      console.error("Failed to add journal entry:", error);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Optimistically update the journal cache
  const updateJournalCache = (
    entry: SightingJournal, 
    operation: 'add' | 'update' | 'delete'
  ) => {
    // Only run this for Firestore mode
    if (!useFirestore) return;
    
    // Helper to update a specific query's data
    const updateQueryData = (queryKey: unknown[]) => {
      queryClient.setQueryData(queryKey, (oldData: SightingJournal[] | undefined) => {
        if (!oldData) return oldData;
        
        if (operation === 'add') {
          return [entry, ...oldData];
        } else if (operation === 'update') {
          return oldData.map(item => (item.id === entry.id ? entry : item));
        } else if (operation === 'delete') {
          return oldData.filter(item => item.id !== entry.id);
        }
        return oldData;
      });
    };
    
    // Update the all entries cache
    updateQueryData([FIRESTORE_KEYS.ALL_ENTRIES]);
    
    // Update the specific penguin entries cache
    updateQueryData([
      FIRESTORE_KEYS.ALL_ENTRIES, 
      FIRESTORE_KEYS.PENGUIN_ENTRIES,
      entry.penguinId
    ]);
  };

  // Update a journal entry with better error handling
  const updateJournalEntryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<JournalEntryInput>;
    }) => {
      if (useFirestore) {
        console.time('updateJournalEntry');
        const result = await firestoreStorage.updateJournalEntry(id, data);
        console.timeEnd('updateJournalEntry');
        
        if (!result) {
          throw new Error(`Journal entry with ID ${id} not found`);
        }
        return result;
      }
      
      // Fallback to API
      const response = await apiRequest(`${API_KEYS.ALL_ENTRIES}/${id}`, "PATCH", data);
      return response;
    },
    onSuccess: (result, variables) => {
      // Success toast
      toast({
        title: "Success",
        description: "Journal entry updated successfully",
        variant: "default"
      });
      
      if (useFirestore) {
        // Optimistic cache update
        updateJournalCache(result as SightingJournal, "update");
        
        // Still invalidate for consistency
        queryClient.invalidateQueries({ 
          queryKey: [FIRESTORE_KEYS.ALL_ENTRIES] 
        });
        
        // Only invalidate specific penguin if needed
        const penguinId = (result as SightingJournal)?.penguinId || variables.data.penguinId;
        if (penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [FIRESTORE_KEYS.ALL_ENTRIES, FIRESTORE_KEYS.PENGUIN_ENTRIES, penguinId]
          });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: [API_KEYS.ALL_ENTRIES] });
        if (variables.data.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [API_KEYS.PENGUIN_ENTRIES(variables.data.penguinId)]
          });
        }
      }
    },
    onError: (error) => {
      console.error("Failed to update journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to update journal entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete a journal entry
  const deleteJournalEntryMutation = useMutation({
    mutationFn: async ({ entryId, penguinId }: { entryId: number, penguinId?: number }) => {
      if (useFirestore) {
        // If we have the penguinId, get the entry first to use for cache updates
        let entryToDelete: SightingJournal | undefined;
        
        if (!penguinId && currentUser) {
          // Try to find the entry from the cache to get its penguinId
          const userId = await getUserIdFromFirebase(currentUser.uid);
          if (userId) {
            const allEntries = queryClient.getQueryData<SightingJournal[]>(
              [FIRESTORE_KEYS.ALL_ENTRIES]
            );
            entryToDelete = allEntries?.find(entry => entry.id === entryId);
          }
        }
        
        console.time('deleteJournalEntry');
        await firestoreStorage.deleteJournalEntry(entryId);
        console.timeEnd('deleteJournalEntry');
        
        return { entryId, penguinId: penguinId || entryToDelete?.penguinId, entry: entryToDelete };
      }
      
      // Fallback to API
      await apiRequest(`${API_KEYS.ALL_ENTRIES}/${entryId}`, "DELETE");
      return { entryId, penguinId };
    },
    onSuccess: (result) => {
      // Success toast
      toast({
        title: "Success",
        description: "Journal entry deleted successfully",
        variant: "default"
      });
      
      if (useFirestore) {
        if (result.entry) {
          // Optimistic cache update if we have the entry
          updateJournalCache(result.entry, "delete");
        }
        
        // Invalidate queries for consistency
        queryClient.invalidateQueries({ 
          queryKey: [FIRESTORE_KEYS.ALL_ENTRIES] 
        });
        
        if (result.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [FIRESTORE_KEYS.ALL_ENTRIES, FIRESTORE_KEYS.PENGUIN_ENTRIES, result.penguinId]
          });
        }
      } else {
        // For API, invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [API_KEYS.ALL_ENTRIES] });
        if (result.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [API_KEYS.PENGUIN_ENTRIES(result.penguinId)]
          });
        }
      }
    },
    onError: (error) => {
      console.error("Failed to delete journal entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    // Queries
    userJournalEntries: getUserJournalQuery.data || [],
    isLoadingJournal: getUserJournalQuery.isLoading,
    isErrorJournal: getUserJournalQuery.isError,
    journalError: getUserJournalQuery.error,
    getPenguinJournalEntries,
    
    // Mutations with enhanced interfaces that return promises
    addJournalEntry: (data: JournalEntryInput): Promise<SightingJournal> => {
      return new Promise((resolve, reject) => {
        addJournalEntryMutation.mutate(data, {
          onSuccess: (result) => resolve(result as SightingJournal),
          onError: (error) => reject(error)
        });
      });
    },
    isAddingJournalEntry: addJournalEntryMutation.isPending,
    
    updateJournalEntry: (id: number, data: Partial<JournalEntryInput>): Promise<SightingJournal> => {
      return new Promise((resolve, reject) => {
        updateJournalEntryMutation.mutate({ id, data }, {
          onSuccess: (result) => resolve(result as SightingJournal),
          onError: (error) => reject(error)
        });
      });
    },
    isUpdatingJournalEntry: updateJournalEntryMutation.isPending,
    
    deleteJournalEntry: (entryId: number, penguinId?: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        deleteJournalEntryMutation.mutate({ entryId, penguinId }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
    },
    isDeletingJournalEntry: deleteJournalEntryMutation.isPending,
    
    // Configuration
    useFirestore, // Indicate whether we're using Firestore or the API
    
    // Utilities
    refetchUserJournalEntries: getUserJournalQuery.refetch,
  };
}