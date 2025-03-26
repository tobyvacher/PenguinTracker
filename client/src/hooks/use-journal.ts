import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SightingJournal, InsertSightingJournal } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { firestoreStorage } from "@/lib/firestore-storage";
import { useState, useEffect } from "react";

export function useJournal() {
  const { isAuthenticated, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [useFirestore, setUseFirestore] = useState(false);
  
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

  // Fetch all journal entries for current user
  const getUserJournalQuery = useQuery({
    queryKey: useFirestore ? ["firestore-journal"] : ["/api/journal"],
    queryFn: async () => {
      if (useFirestore && currentUser) {
        // Get user ID from Firestore
        const fbUser = await firestoreStorage.getUserByFirebaseUid(currentUser.uid);
        if (fbUser) {
          return await firestoreStorage.getUserJournalEntries(fbUser.id);
        }
        return [];
      }
      
      // Fallback to API
      const fetchFn = getQueryFn<SightingJournal[]>({ on401: "returnNull" });
      return fetchFn({ 
        queryKey: ["/api/journal"],
        signal: new AbortController().signal,
        meta: undefined 
      });
    },
    enabled: isAuthenticated,
  } as any);

  // Fetch journal entries for a specific penguin
  const getPenguinJournalEntries = (penguinId: number) => {
    return useQuery({
      queryKey: useFirestore 
        ? ["firestore-journal", "penguin", penguinId] 
        : [`/api/journal/penguin/${penguinId}`],
      queryFn: async () => {
        if (useFirestore && currentUser && penguinId) {
          // Get user ID from Firestore
          const fbUser = await firestoreStorage.getUserByFirebaseUid(currentUser.uid);
          if (fbUser) {
            return await firestoreStorage.getPenguinJournalEntries(fbUser.id, penguinId);
          }
          return [];
        }
        
        // Fallback to API
        const fetchFn = getQueryFn<SightingJournal[]>({ on401: "returnNull" });
        return fetchFn({ 
          queryKey: [`/api/journal/penguin/${penguinId}`],
          signal: new AbortController().signal,
          meta: undefined 
        });
      },
      enabled: !!penguinId && isAuthenticated,
    } as any);
  };

  // Add a new journal entry
  const addJournalEntryMutation = useMutation({
    mutationFn: async (data: Omit<InsertSightingJournal, "userId">) => {
      if (useFirestore && currentUser) {
        // Get user ID from Firestore
        const fbUser = await firestoreStorage.getUserByFirebaseUid(currentUser.uid);
        if (fbUser) {
          // Add userId to the data
          const fullEntry: InsertSightingJournal = {
            ...data,
            userId: fbUser.id,
          };
          
          // Store in Firestore
          return await firestoreStorage.addJournalEntry(fullEntry);
        } else {
          throw new Error("User not found in Firestore database");
        }
      }
      
      // Fallback to API
      const response = await apiRequest("/api/journal", "POST", data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data - handle both API and Firestore queries
      if (useFirestore) {
        queryClient.invalidateQueries({ queryKey: ["firestore-journal"] });
        if (variables.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: ["firestore-journal", "penguin", variables.penguinId]
          });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
        if (variables.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/journal/penguin/${variables.penguinId}`]
          });
        }
      }
    },
  });

  // Update a journal entry
  const updateJournalEntryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<InsertSightingJournal, "userId">>;
    }) => {
      if (useFirestore) {
        // Update in Firestore
        return await firestoreStorage.updateJournalEntry(id, data);
      }
      
      // Fallback to API
      const response = await apiRequest(`/api/journal/${id}`, "PATCH", data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data - handle both API and Firestore queries
      if (useFirestore) {
        queryClient.invalidateQueries({ queryKey: ["firestore-journal"] });
        if (variables.data.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: ["firestore-journal", "penguin", variables.data.penguinId]
          });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
        if (variables.data.penguinId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/journal/penguin/${variables.data.penguinId}`]
          });
        }
      }
    },
  });

  // Delete a journal entry
  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      if (useFirestore) {
        // Delete from Firestore
        await firestoreStorage.deleteJournalEntry(entryId);
        return entryId;
      }
      
      // Fallback to API
      await apiRequest(`/api/journal/${entryId}`, "DELETE");
      return entryId;
    },
    onSuccess: () => {
      // Invalidate all journal queries - for both Firestore and API
      if (useFirestore) {
        // Invalidate Firestore queries
        queryClient.invalidateQueries({ queryKey: ["firestore-journal"] });
        // Invalidate all Firestore penguin journal entries
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) && 
              queryKey.length > 1 && 
              queryKey[0] === "firestore-journal" && 
              queryKey[1] === "penguin"
            ); 
          }
        });
      } else {
        // Invalidate API queries
        queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
        // Invalidate all API penguin journal entries
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const queryKey = query.queryKey[0];
            return typeof queryKey === 'string' && queryKey.startsWith('/api/journal/penguin/'); 
          }
        });
      }
    },
  });

  return {
    // Queries
    userJournalEntries: getUserJournalQuery.data || [],
    isLoadingJournal: getUserJournalQuery.isLoading,
    isErrorJournal: getUserJournalQuery.isError,
    getPenguinJournalEntries,
    
    // Mutations
    addJournalEntry: addJournalEntryMutation.mutate,
    isAddingJournalEntry: addJournalEntryMutation.isPending,
    
    updateJournalEntry: updateJournalEntryMutation.mutate,
    isUpdatingJournalEntry: updateJournalEntryMutation.isPending,
    
    deleteJournalEntry: deleteJournalEntryMutation.mutate,
    isDeletingJournalEntry: deleteJournalEntryMutation.isPending,
    
    // Configuration
    useFirestore, // Indicate whether we're using Firestore or the API
  };
}