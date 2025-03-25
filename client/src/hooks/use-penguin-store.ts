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
    
    // Only fetch from API if user is authenticated
    if (isAuthenticated) {
      fetchSeenPenguins();
    }
  }, [currentUser, isAuthenticated]);
  
  // Toggle penguin seen status
  const toggleSeen = async (penguinId: number) => {
    const storageKey = getStorageKey();
    
    try {
      const isCurrentlySeen = seenPenguins.includes(penguinId);
      
      if (isCurrentlySeen) {
        // Remove from seen
        if (isAuthenticated) {
          await apiRequest(`/api/seen-penguins/${penguinId}`, 'DELETE', null, {
            headers: {
              'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
            }
          });
        }
        
        // Optimistically update state
        const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
      } else {
        // Add to seen
        if (isAuthenticated) {
          await apiRequest('/api/seen-penguins', 'POST', { penguinId }, {
            headers: {
              'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
            }
          });
        }
        
        // Optimistically update state
        const updatedSeenPenguins = [...seenPenguins, penguinId];
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem(storageKey, JSON.stringify(updatedSeenPenguins));
      }
      
      // Invalidate queries to refresh data
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
      }
    } catch (error) {
      console.error('Failed to toggle penguin seen status:', error);
      // Revert optimistic update if authenticated
      if (isAuthenticated) {
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
      } else {
        // If not authenticated, just revert to the previous localStorage state
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
