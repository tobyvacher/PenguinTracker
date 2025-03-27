import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

export function usePenguinStore() {
  const [seenPenguins, setSeenPenguins] = useState<number[]>([]);
  const { currentUser, isAuthenticated } = useAuth();
  
  // Generate a storage key that includes user ID for authenticated users
  const getStorageKey = () => {
    return currentUser ? `seenPenguins-${currentUser.uid}` : 'seenPenguins-guest';
  };
  
  // Load seen penguins from local storage and API when auth state changes
  useEffect(() => {
    // First try to get from localStorage for immediate display
    const storageKey = getStorageKey();
    const storedSeenPenguins = localStorage.getItem(storageKey);
    
    if (storedSeenPenguins) {
      try {
        const parsedData = JSON.parse(storedSeenPenguins);
        if (Array.isArray(parsedData)) {
          setSeenPenguins(parsedData);
        } else {
          console.error('Invalid format in localStorage:', storedSeenPenguins);
          setSeenPenguins([]);
        }
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
        setSeenPenguins([]);
      }
    } else {
      // If we switched users and there's no data for this user, reset the state
      setSeenPenguins([]);
    }
    
    // For unauthenticated users, only use localStorage
    if (!isAuthenticated) {
      console.log('Using only localStorage for unauthenticated user');
      return;
    }
    
    // Fetch from API for authenticated users
    const fetchSeenPenguins = async () => {
      console.log('Fetching seen penguins from API for authenticated user');
      try {
        let authHeader = '';
        if (currentUser) {
          try {
            authHeader = `Bearer ${await currentUser.getIdToken()}`;
          } catch (tokenError) {
            console.error('Error getting auth token:', tokenError);
            return; // Exit if we can't get a token
          }
        } else {
          console.log('No current user, skipping API fetch');
          return; // Exit if no current user
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
            // If user has seen penguins on the server, use that data
            if (data.length > 0) {
              setSeenPenguins(data);
              localStorage.setItem(storageKey, JSON.stringify(data));
            } 
            // If user has no seen penguins on server but has some locally,
            // we'll keep the local data and it will sync next time they mark a penguin as seen
          } else {
            console.error('API returned non-array data for seen penguins:', data);
          }
        } else {
          console.error('Failed to fetch seen penguins, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to fetch seen penguins:', error);
      }
    };
    
    // Only fetch from API for authenticated users
    fetchSeenPenguins();
  }, [currentUser, isAuthenticated]);
  
  // Toggle penguin seen status
  const toggleSeen = async (penguinId: number) => {
    const storageKey = getStorageKey();
    
    try {
      const isCurrentlySeen = seenPenguins.includes(penguinId);
      
      // For unauthenticated users, only update localStorage (client-side only)
      if (!isAuthenticated) {
        if (isCurrentlySeen) {
          // Remove from local storage only
          const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
          setSeenPenguins(updatedSeenPenguins);
          localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
          console.log(`Removed penguin ${penguinId} from local seen list (unauthenticated)`);
        } else {
          // Add to local storage only
          const updatedSeenPenguins = [...seenPenguins, penguinId];
          setSeenPenguins(updatedSeenPenguins);
          localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
          console.log(`Added penguin ${penguinId} to local seen list (unauthenticated)`);
        }
        return;
      }
      
      // Authenticated user flow - update server and local storage
      if (isCurrentlySeen) {
        // REMOVE PENGUIN FLOW
        console.log(`Attempting to remove penguin ${penguinId} from seen list`);
        
        try {
          // First make the API call
          const response = await fetch(`/api/seen-penguins/${penguinId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (response.status === 204) {
            console.log(`Successfully removed penguin ${penguinId} from seen list`);
            
            // Then update state after successful API call
            const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
            setSeenPenguins(updatedSeenPenguins);
            localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else {
            throw new Error(`Failed with status: ${response.status}`);
          }
        } catch (deleteError) {
          console.error(`Failed to remove penguin ${penguinId} from seen list:`, deleteError);
          // Do not update state on error - keep it as seen
        }
      } else {
        // ADD PENGUIN FLOW
        console.log(`Attempting to add penguin ${penguinId} to seen list`);
        
        try {
          // First make the API call
          const response = await fetch('/api/seen-penguins', {
            method: 'POST',
            headers: {
              'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ penguinId }),
            credentials: 'include'
          });
          
          if (response.ok) {
            console.log(`Successfully added penguin ${penguinId} to seen list`);
            
            // Then update state after successful API call
            const updatedSeenPenguins = [...seenPenguins, penguinId];
            setSeenPenguins(updatedSeenPenguins);
            localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else {
            throw new Error(`Failed with status: ${response.status}`);
          }
        } catch (postError) {
          console.error(`Failed to add penguin ${penguinId} to seen list:`, postError);
          // Do not update state on error - keep it as unseen
        }
      }
    } catch (error) {
      console.error('Failed to toggle penguin seen status:', error);
      
      // Refresh the data from the server to ensure consistency
      try {
        const response = await fetch('/api/seen-penguins', {
          credentials: 'include',
          headers: {
            'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSeenPenguins(data);
          localStorage.setItem(storageKey, JSON.stringify(data));
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
  };
}
