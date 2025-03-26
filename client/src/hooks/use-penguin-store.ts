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
      setSeenPenguins(JSON.parse(storedSeenPenguins));
    } else {
      // If we switched users and there's no data for this user, reset the state
      setSeenPenguins([]);
    }
    
    // Then fetch from API if authenticated
    const fetchSeenPenguins = async () => {
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
          // Update localStorage
          localStorage.setItem(storageKey, JSON.stringify(data));
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
    
    try {
      const isCurrentlySeen = seenPenguins.includes(penguinId);
      
      if (isCurrentlySeen) {
        // Remove from seen - make API call for all users (authenticated or not)
        // First update state optimistically
        const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
        
        // Then make API call
        try {
          console.log(`Attempting to remove penguin ${penguinId} from seen list`);
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
            throw new Error(`Failed with status: ${response.status}`);
          }
        } catch (deleteError) {
          console.error(`Failed to remove penguin ${penguinId} from seen list:`, deleteError);
          // Revert the optimistic update if the API call fails
          setSeenPenguins([...seenPenguins]);
          localStorage.setItem(storageKey, JSON.stringify(seenPenguins));
        }
      } else {
        // Add to seen - make API call for all users (authenticated or not)
        // First update state optimistically
        const updatedSeenPenguins = [...seenPenguins, penguinId];
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
        
        // Then make API call
        try {
          console.log(`Attempting to add penguin ${penguinId} to seen list`);
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
            throw new Error(`Failed with status: ${response.status}`);
          }
        } catch (postError) {
          console.error(`Failed to add penguin ${penguinId} to seen list:`, postError);
          // Revert the optimistic update if the API call fails
          const filteredPenguins = updatedSeenPenguins.filter(id => id !== penguinId);
          setSeenPenguins(filteredPenguins);
          localStorage.setItem(storageKey, JSON.stringify(filteredPenguins));
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
        }
      }
    } catch (error) {
      console.error('Failed to toggle penguin seen status:', error);
      
      // Try to revert the optimistic update by fetching current data
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
        } else {
          // If API call fails, revert to the previous localStorage state
          const storedSeenPenguins = localStorage.getItem(storageKey);
          if (storedSeenPenguins) {
            setSeenPenguins(JSON.parse(storedSeenPenguins));
          }
        }
      } catch (fetchError) {
        console.error('Failed to fetch current seen penguins:', fetchError);
        // Last resort: revert to the previous localStorage state
        const storedSeenPenguins = localStorage.getItem(storageKey);
        if (storedSeenPenguins) {
          setSeenPenguins(JSON.parse(storedSeenPenguins));
        }
      }
    }
  };
  
  return {
    seenPenguins,
    toggleSeen,
  };
}
