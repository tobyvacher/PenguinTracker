import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { SightingJournal, InsertSightingJournal } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export function useJournal() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all journal entries for current user
  const getUserJournalQuery = useQuery({
    queryKey: ["/api/journal"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
  } as any);

  // Fetch journal entries for a specific penguin
  const getPenguinJournalEntries = (penguinId: number) => {
    return useQuery({
      queryKey: ["/api/journal/penguin", penguinId],
      queryFn: getQueryFn({ on401: "returnNull" }),
      enabled: isAuthenticated && !!penguinId,
    } as any);
  };

  // Add a new journal entry
  const addJournalEntryMutation = useMutation({
    mutationFn: async (data: Omit<InsertSightingJournal, "userId">) => {
      const response = await apiRequest("/api/journal", "POST", data);
      return response;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/penguin"] });
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
      const response = await apiRequest(`/api/journal/${id}`, "PATCH", data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/journal/penguin", variables.data.penguinId] 
      });
    },
  });

  // Delete a journal entry
  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/journal/${id}`, "DELETE");
      return id;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/penguin"] });
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
  };
}