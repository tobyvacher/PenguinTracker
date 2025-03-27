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
    
    // Then fetch from API if authenticated
    const fetchSeenPenguins = async () => {
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
            setSeenPenguins(data);
            // Update localStorage
            localStorage.setItem(storageKey, JSON.stringify(data));
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
    
    // Always fetch from API for all users (authenticated or not)
    fetchSeenPenguins();
  }, [currentUser, isAuthenticated]);
  
  // Toggle penguin seen status
  const toggleSeen = async (penguinId: number) => {
    const storageKey = getStorageKey();
    const isCurrentlySeen = seenPenguins.includes(penguinId);
    
    // Optimistically update the UI first for responsiveness
    if (isCurrentlySeen) {
      // Remove from seen list (optimistic update)
      const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
      setSeenPenguins(updatedSeenPenguins);
      localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
    } else {
      // Add to seen list (optimistic update)
      const updatedSeenPenguins = [...seenPenguins, penguinId];
      setSeenPenguins(updatedSeenPenguins);
      localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
    }
    
    // Then make the API call in the background
    try {
      if (isCurrentlySeen) {
        // REMOVE PENGUIN FLOW
        console.log(`Attempting to remove penguin ${penguinId} from seen list`);
        
        try {
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
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else {
            throw new Error(`Failed to remove penguin with status: ${response.status}`);
          }
        } catch (deleteError) {
          console.error(`Failed to remove penguin ${penguinId} from seen list:`, deleteError);
          
          // Revert the optimistic update if the API call failed
          if (!seenPenguins.includes(penguinId)) {
            const revertedPenguins = [...seenPenguins, penguinId];
            setSeenPenguins(revertedPenguins);
            localStorage.setItem(storageKey, JSON.stringify(revertedPenguins));
          }
        }
      } else {
        // ADD PENGUIN FLOW
        console.log(`Attempting to add penguin ${penguinId} to seen list`);
        
        try {
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
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
          } else {
            throw new Error(`Failed to add penguin with status: ${response.status}`);
          }
        } catch (postError) {
          console.error(`Failed to add penguin ${penguinId} to seen list:`, postError);
          
          // Revert the optimistic update if the API call failed
          if (seenPenguins.includes(penguinId)) {
            const revertedPenguins = seenPenguins.filter(id => id !== penguinId);
            setSeenPenguins(revertedPenguins);
            localStorage.setItem(storageKey, JSON.stringify(revertedPenguins));
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle penguin seen status:', error);
      
      // Refresh the data from the server to ensure consistency in case of errors
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
        // Keep the optimistic update in place
      }
    }
  };
  
  return {
    seenPenguins,
    toggleSeen,
  };
}
