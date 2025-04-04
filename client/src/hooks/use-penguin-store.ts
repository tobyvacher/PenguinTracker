import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePenguinStore() {
  const [seenPenguins, setSeenPenguins] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPenguins, setLoadingPenguins] = useState<number[]>([]);
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const pendingChanges = useRef<{id: number, action: 'add' | 'remove'}[]>([]);
  
  // Generate a storage key that includes user ID for authenticated users
  const getStorageKey = () => {
    return currentUser ? `seenPenguins-${currentUser.uid}` : 'seenPenguins-guest';
  };
  
  // Load seen penguins from appropriate source based on authentication status
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // Function to load data from local storage
    const loadFromLocalStorage = () => {
      try {
        const storageKey = getStorageKey();
        const storedSeenPenguins = localStorage.getItem(storageKey);
        
        if (storedSeenPenguins) {
          try {
            const parsedData = JSON.parse(storedSeenPenguins);
            if (Array.isArray(parsedData)) {
              if (isMounted) setSeenPenguins(parsedData);
              return parsedData;
            } else {
              console.error('Invalid format in localStorage:', storedSeenPenguins);
              if (isMounted) setSeenPenguins([]);
              return [];
            }
          } catch (e) {
            console.error('Failed to parse localStorage data:', e);
            if (isMounted) setSeenPenguins([]);
            return [];
          }
        } else {
          // If no data exists for this key
          if (isMounted) setSeenPenguins([]);
          return [];
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
        if (isMounted) setSeenPenguins([]);
        return [];
      }
    };
    
    // Function to fetch data from API
    const fetchFromAPI = async () => {
      console.log('Fetching seen penguins from API');
      try {
        let authHeader = '';
        if (currentUser) {
          try {
            authHeader = `Bearer ${await currentUser.getIdToken()}`;
          } catch (tokenError) {
            console.error('Error getting auth token:', tokenError);
          }
        }
        
        const response = await fetch('/api/seen-penguins', {
          credentials: 'include',
          headers: {
            'Authorization': authHeader,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Received seen penguins from API:', data);
          
          if (Array.isArray(data)) {
            // Only update state if the component is still mounted
            if (isMounted) {
              setSeenPenguins(data);
              // Also update localStorage as a backup
              const storageKey = getStorageKey();
              localStorage.setItem(storageKey, JSON.stringify(data));
            }
            return data;
          } else {
            console.error('API returned non-array data for seen penguins:', data);
            return null;
          }
        } else {
          console.error('Failed to fetch seen penguins, status:', response.status);
          return null;
        }
      } catch (error) {
        console.error('Failed to fetch seen penguins:', error);
        return null;
      }
    };
    
    const init = async () => {
      try {
        if (isAuthenticated && currentUser) {
          // For authenticated users, get data from API which serves from Firestore
          console.log('Authenticated user: fetching seen penguins from Firestore via API');
          const apiData = await fetchFromAPI();
          
          // If API fetch failed, fall back to localStorage
          if (apiData === null) {
            console.log('API fetch failed, falling back to localStorage');
            loadFromLocalStorage();
          }
        } else {
          // For unauthenticated users, only use localStorage
          console.log('Using only localStorage for unauthenticated user');
          loadFromLocalStorage();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentUser, isAuthenticated]);
  
  // Function to process pending changes when back online
  const processPendingChanges = async () => {
    if (pendingChanges.current.length === 0) return;
    console.log('Processing pending changes:', pendingChanges.current);
    
    // Process each pending change
    for (const change of [...pendingChanges.current]) {
      try {
        if (change.action === 'add') {
          // Add penguin to server
          const response = await fetch('/api/seen-penguins', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await currentUser?.getIdToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ penguinId: change.id }),
            credentials: 'include'
          });
          
          if (response.ok) {
            console.log(`Successfully synced pending add for penguin ${change.id}`);
            // Remove from pending queue if successful
            pendingChanges.current = pendingChanges.current.filter(c => 
              !(c.id === change.id && c.action === 'add')
            );
          } else {
            throw new Error(`Failed with status: ${response.status}`);
          }
        } else {
          // Remove penguin from server
          const response = await fetch(`/api/seen-penguins/${change.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${await currentUser?.getIdToken()}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (response.status === 204) {
            console.log(`Successfully synced pending remove for penguin ${change.id}`);
            // Remove from pending queue if successful
            pendingChanges.current = pendingChanges.current.filter(c => 
              !(c.id === change.id && c.action === 'remove')
            );
          } else {
            throw new Error(`Failed with status: ${response.status}`);
          }
        }
      } catch (error) {
        console.error('Error processing pending change', error);
        // Keep in queue to retry later
      }
    }
    
    // After processing, invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
  };

  // Listen for online status changes
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && currentUser) {
        processPendingChanges();
      }
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated, currentUser]);
  
  // Toggle penguin seen status (optimistically!)
  const toggleSeen = async (penguinId: number) => {
    const storageKey = getStorageKey();
    const isCurrentlySeen = seenPenguins.includes(penguinId);
    
    // Set loading state for this penguin
    setLoadingPenguins(prev => [...prev, penguinId]);
    
    // Store original state in case we need to revert
    const originalSeenPenguins = [...seenPenguins];
    
    try {
      // STEP 1: Update UI immediately (optimistically)
      let updatedSeenPenguins: number[];
      
      if (isCurrentlySeen) {
        // Remove penguin from seen list
        updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
      } else {
        // Add penguin to seen list
        updatedSeenPenguins = [...seenPenguins, penguinId];
      }
      
      // Update state optimistically
      setSeenPenguins(updatedSeenPenguins);
      
      // Update localStorage (this happens for all users)
      localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
      
      // We'll use the custom SuccessToast instead
      // Remove toast here as it creates duplicate notifications
      
      // STEP 2: Perform actual server update in the background
      if (isAuthenticated && currentUser) {
        try {
          let response;
          
          // Check if we're online
          if (navigator.onLine) {
            if (isCurrentlySeen) {
              // REMOVE PENGUIN
              console.log(`Attempting to remove penguin ${penguinId} from seen list`);
              
              response = await fetch(`/api/seen-penguins/${penguinId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${await currentUser.getIdToken()}`,
                  'Content-Type': 'application/json'
                },
                credentials: 'include'
              });
              
              if (response.status === 204) {
                console.log(`Successfully removed penguin ${penguinId} from seen list`);
                // Success - no need to do anything as state is already updated
              } else if (response.status === 401) {
                // Handle authentication error
                toast({
                  title: "Session expired",
                  description: "Please log in again to save your progress",
                  variant: "destructive",
                });
                throw new Error('Authentication failed');
              } else {
                throw new Error(`Failed with status: ${response.status}`);
              }
            } else {
              // ADD PENGUIN
              console.log(`Attempting to add penguin ${penguinId} to seen list`);
              
              response = await fetch('/api/seen-penguins', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${await currentUser.getIdToken()}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ penguinId }),
                credentials: 'include'
              });
              
              if (response.ok) {
                console.log(`Successfully added penguin ${penguinId} to seen list`);
                // Success - no need to do anything as state is already updated
              } else if (response.status === 401) {
                // Handle authentication error
                toast({
                  title: "Session expired",
                  description: "Please log in again to save your progress",
                  variant: "destructive",
                });
                throw new Error('Authentication failed');
              } else {
                throw new Error(`Failed with status: ${response.status}`);
              }
            }
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else {
            // We're offline, add to pending changes
            console.log(`Offline - adding change to pending queue: ${isCurrentlySeen ? 'remove' : 'add'} penguin ${penguinId}`);
            pendingChanges.current.push({
              id: penguinId,
              action: isCurrentlySeen ? 'remove' : 'add'
            });
          }
        } catch (apiError) {
          console.error(`API error when toggling penguin ${penguinId}:`, apiError);
          
          // Show error toast
          toast({
            title: "Error updating collection",
            description: "We'll try again when your connection improves",
            variant: "destructive",
          });
          
          // Don't revert the UI state, since we'll retry the operation when online
          // Also, the user has already seen the immediate UI update
        }
      } else {
        // For non-authenticated users, just update localStorage (already done above)
        console.log(`${isCurrentlySeen ? 'Removed' : 'Added'} penguin ${penguinId} to local seen list (unauthenticated)`);
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error('Unexpected error toggling penguin status:', error);
      
      // Revert to original state
      setSeenPenguins(originalSeenPenguins);
      localStorage.setItem(storageKey, JSON.stringify(originalSeenPenguins));
      
      // Show error toast
      toast({
        title: "Error updating collection",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      // Remove loading state for this penguin
      setLoadingPenguins(prev => prev.filter(id => id !== penguinId));
    }
  };
  
  return {
    seenPenguins,
    toggleSeen,
    isLoading,
    loadingPenguins,
    isPenguinLoading: (id: number) => loadingPenguins.includes(id),
  };
}
