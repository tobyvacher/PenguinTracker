import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

export function usePenguinStore() {
  const [seenPenguins, setSeenPenguins] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, isAuthenticated } = useAuth();
  
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
  
  // Toggle penguin seen status
  const toggleSeen = async (penguinId: number) => {
    // Use a variable to track the current seen state for this function
    // This prevents race conditions from state updates
    const storageKey = getStorageKey();
    const isCurrentlySeen = seenPenguins.includes(penguinId);
    console.log(`Toggling penguin ${penguinId}, currently seen: ${isCurrentlySeen}`);
    
    // Create a debounce key to prevent duplicate operations
    const operationKey = `toggle_${penguinId}_${Date.now()}`;
    
    // For unauthenticated users, only use localStorage
    if (!isAuthenticated || !currentUser) {
      try {
        if (isCurrentlySeen) {
          // Remove from local seen list
          const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
          setSeenPenguins(updatedSeenPenguins);
          localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
          console.log(`Removed penguin ${penguinId} from local seen list (unauthenticated)`);
        } else {
          // Add to local seen list (only if not already there - safeguard against duplicates)
          if (!seenPenguins.includes(penguinId)) {
            const updatedSeenPenguins = [...seenPenguins, penguinId];
            setSeenPenguins(updatedSeenPenguins);
            localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
            console.log(`Added penguin ${penguinId} to local seen list (unauthenticated)`);
          } else {
            console.log(`Penguin ${penguinId} is already in the local seen list (unauthenticated)`);
          }
        }
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
      return;
    }
    
    // For authenticated users, use API and Firestore
    try {
      // Get auth token for API requests
      const authToken = await currentUser.getIdToken();
      
      if (isCurrentlySeen) {
        // REMOVE PENGUIN FLOW
        console.log(`Attempting to remove penguin ${penguinId} from seen list`);
        
        // Update the UI state first (optimistic update)
        const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
        
        try {
          const response = await fetch(`/api/seen-penguins/${penguinId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              // Add a unique operation ID to prevent duplicate requests
              'X-Operation-ID': operationKey
            },
            credentials: 'include'
          });
          
          if (response.status === 204) {
            console.log(`Successfully removed penguin ${penguinId} from seen list`);
            // State is already updated (optimistic update)
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else if (response.status === 401) {
            // Already handled with optimistic update
            console.warn("Unauthorized to update server data - using local storage only");
          } else {
            throw new Error(`Failed with status: ${response.status}`);
          }
        } catch (deleteError) {
          console.error(`Failed to remove penguin ${penguinId} from seen list:`, deleteError);
          // Revert optimistic update on error
          const originalSeenPenguins = [...seenPenguins];
          setSeenPenguins(originalSeenPenguins);
          localStorage.setItem(storageKey, JSON.stringify(originalSeenPenguins));
        }
      } else {
        // ADD PENGUIN FLOW
        console.log(`Attempting to add penguin ${penguinId} to seen list`);
        
        // Skip if the penguin is already in the list (double-click protection)
        if (seenPenguins.includes(penguinId)) {
          console.log(`Penguin ${penguinId} is already in the seen list, skipping add operation`);
          return;
        }
        
        // Update the UI state first (optimistic update)
        const updatedSeenPenguins = [...seenPenguins, penguinId];
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
        
        try {
          const response = await fetch('/api/seen-penguins', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              // Add a unique operation ID to prevent duplicate requests
              'X-Operation-ID': operationKey
            },
            body: JSON.stringify({ penguinId }),
            credentials: 'include'
          });
          
          if (response.ok) {
            console.log(`Successfully added penguin ${penguinId} to seen list`);
            // State is already updated (optimistic update)
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else if (response.status === 401) {
            // Already handled with optimistic update
            console.warn("Unauthorized to update server data - using local storage only");
          } else {
            throw new Error(`Failed with status: ${response.status}`);
          }
        } catch (postError) {
          console.error(`Failed to add penguin ${penguinId} to seen list:`, postError);
          // Revert optimistic update on error
          const originalSeenPenguins = seenPenguins.filter(id => id !== penguinId);
          setSeenPenguins(originalSeenPenguins);
          localStorage.setItem(storageKey, JSON.stringify(originalSeenPenguins));
        }
      }
    } catch (error) {
      console.error('Failed to toggle penguin seen status:', error);
      
      // Refresh the data from the server to ensure consistency
      try {
        // Get a fresh token
        if (currentUser) {
          const authToken = await currentUser.getIdToken(true);
          
          const response = await fetch('/api/seen-penguins', {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setSeenPenguins(data);
            localStorage.setItem(storageKey, JSON.stringify(data));
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch current seen penguins:', fetchError);
        // No state changes on error
      }
    }
  };
  
  return {
    seenPenguins,
    toggleSeen,
    isLoading,
  };
}
