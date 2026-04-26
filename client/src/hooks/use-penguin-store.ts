import { useState, useEffect, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePenguinStore() {
  const [seenPenguins, setSeenPenguins] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPenguins, setLoadingPenguins] = useState<number[]>([]);
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const pendingChanges = useRef<{ id: number; action: 'add' | 'remove' }[]>([]);

  const getStorageKey = () =>
    currentUser ? `seenPenguins-${currentUser.replitUserId}` : 'seenPenguins-guest';

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadFromLocalStorage = (): number[] => {
      try {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            if (isMounted) setSeenPenguins(parsed);
            return parsed;
          }
        }
      } catch {
        // ignore
      }
      if (isMounted) setSeenPenguins([]);
      return [];
    };

    const fetchFromAPI = async (): Promise<number[] | null> => {
      try {
        const response = await fetch('/api/seen-penguins', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            if (isMounted) {
              setSeenPenguins(data);
              localStorage.setItem(getStorageKey(), JSON.stringify(data));
            }
            return data;
          }
        }
        return null;
      } catch {
        return null;
      }
    };

    const init = async () => {
      try {
        if (isAuthenticated && currentUser) {
          const apiData = await fetchFromAPI();
          if (apiData === null) loadFromLocalStorage();
        } else {
          loadFromLocalStorage();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [currentUser, isAuthenticated]);

  const processPendingChanges = async () => {
    if (pendingChanges.current.length === 0) return;

    for (const change of [...pendingChanges.current]) {
      try {
        let ok = false;
        if (change.action === 'add') {
          const res = await fetch('/api/seen-penguins', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ penguinId: change.id }),
            credentials: 'include',
          });
          ok = res.ok;
        } else {
          const res = await fetch(`/api/seen-penguins/${change.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          ok = res.status === 204;
        }

        if (ok) {
          pendingChanges.current = pendingChanges.current.filter(
            c => !(c.id === change.id && c.action === change.action)
          );
        }
      } catch {
        // keep for retry
      }
    }

    queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
  };

  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && currentUser) processPendingChanges();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated, currentUser]);

  const toggleSeen = async (penguinId: number) => {
    const storageKey = getStorageKey();
    const isCurrentlySeen = seenPenguins.includes(penguinId);
    const originalSeenPenguins = [...seenPenguins];

    setLoadingPenguins(prev => [...prev, penguinId]);

    try {
      const updated = isCurrentlySeen
        ? seenPenguins.filter(id => id !== penguinId)
        : [...seenPenguins, penguinId];

      setSeenPenguins(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));

      if (isAuthenticated && currentUser) {
        if (!navigator.onLine) {
          pendingChanges.current.push({ id: penguinId, action: isCurrentlySeen ? 'remove' : 'add' });
          return;
        }

        try {
          let response: Response;
          if (isCurrentlySeen) {
            response = await fetch(`/api/seen-penguins/${penguinId}`, {
              method: 'DELETE',
              credentials: 'include',
            });

            if (response.status === 401) {
              toast({ title: "Session expired", description: "Please log in again to save your progress", variant: "destructive" });
              throw new Error('Authentication failed');
            }
            if (response.status !== 204) throw new Error(`Failed with status: ${response.status}`);
          } else {
            response = await fetch('/api/seen-penguins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ penguinId }),
              credentials: 'include',
            });

            if (response.status === 401) {
              toast({ title: "Session expired", description: "Please log in again to save your progress", variant: "destructive" });
              throw new Error('Authentication failed');
            }
            if (!response.ok) throw new Error(`Failed with status: ${response.status}`);
          }

          queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
        } catch (apiError) {
          console.error(`Error syncing penguin ${penguinId}:`, apiError);
          toast({ title: "Error updating collection", description: "We'll try again when your connection improves", variant: "destructive" });
        }
      }
    } catch (error) {
      console.error('Unexpected error toggling penguin status:', error);
      setSeenPenguins(originalSeenPenguins);
      localStorage.setItem(storageKey, JSON.stringify(originalSeenPenguins));
      toast({ title: "Error updating collection", description: "Please try again later", variant: "destructive" });
    } finally {
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
