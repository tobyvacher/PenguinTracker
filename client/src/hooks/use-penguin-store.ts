import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function usePenguinStore() {
  const [seenPenguins, setSeenPenguins] = useState<number[]>([]);
  
  // Load seen penguins from local storage and API on mount
  useEffect(() => {
    // First try to get from localStorage for immediate display
    const storedSeenPenguins = localStorage.getItem('seenPenguins');
    if (storedSeenPenguins) {
      setSeenPenguins(JSON.parse(storedSeenPenguins));
    }
    
    // Then fetch from API
    const fetchSeenPenguins = async () => {
      try {
        const response = await fetch('/api/seen-penguins', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSeenPenguins(data);
          // Update localStorage
          localStorage.setItem('seenPenguins', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Failed to fetch seen penguins:', error);
      }
    };
    
    fetchSeenPenguins();
  }, []);
  
  // Toggle penguin seen status
  const toggleSeen = async (penguinId: number) => {
    try {
      const isCurrentlySeen = seenPenguins.includes(penguinId);
      
      if (isCurrentlySeen) {
        // Remove from seen
        await apiRequest('DELETE', `/api/seen-penguins/${penguinId}`);
        
        // Optimistically update state
        const updatedSeenPenguins = seenPenguins.filter(id => id !== penguinId);
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem('seenPenguins', JSON.stringify(updatedSeenPenguins));
      } else {
        // Add to seen
        await apiRequest('POST', '/api/seen-penguins', { penguinId });
        
        // Optimistically update state
        const updatedSeenPenguins = [...seenPenguins, penguinId];
        setSeenPenguins(updatedSeenPenguins);
        localStorage.setItem('seenPenguins', JSON.stringify(updatedSeenPenguins));
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
    } catch (error) {
      console.error('Failed to toggle penguin seen status:', error);
      // Revert optimistic update
      const response = await fetch('/api/seen-penguins', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSeenPenguins(data);
        localStorage.setItem('seenPenguins', JSON.stringify(data));
      }
    }
  };
  
  return {
    seenPenguins,
    toggleSeen,
  };
}
