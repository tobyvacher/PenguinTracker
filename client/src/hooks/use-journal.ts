import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SightingJournal, InsertSightingJournal } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type JournalEntryInput = Omit<InsertSightingJournal, "userId">;

export const JOURNAL_API_KEYS = {
  ALL_ENTRIES: "/api/journal",
  PENGUIN_ENTRIES: (id: number) => `/api/journal/penguin/${id}`,
};

const API_KEYS = JOURNAL_API_KEYS;

export function useJournal() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getUserJournalQuery = useQuery<SightingJournal[]>({
    queryKey: [API_KEYS.ALL_ENTRIES],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });


  const addJournalEntryMutation = useMutation({
    mutationFn: async (data: JournalEntryInput): Promise<SightingJournal> => {
      const res = await apiRequest(API_KEYS.ALL_ENTRIES, "POST", data);
      return res.json();
    },
    onSuccess: (_result, variables) => {
      toast({ title: "Success", description: "Journal entry added successfully" });
      queryClient.invalidateQueries({ queryKey: [API_KEYS.ALL_ENTRIES] });
      if (variables.penguinId) {
        queryClient.invalidateQueries({ queryKey: [API_KEYS.PENGUIN_ENTRIES(variables.penguinId)] });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const updateJournalEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<JournalEntryInput> }): Promise<SightingJournal> => {
      const res = await apiRequest(`${API_KEYS.ALL_ENTRIES}/${id}`, "PATCH", data);
      return res.json();
    },
    onSuccess: (_result, variables) => {
      toast({ title: "Success", description: "Journal entry updated successfully" });
      queryClient.invalidateQueries({ queryKey: [API_KEYS.ALL_ENTRIES] });
      if (variables.data.penguinId) {
        queryClient.invalidateQueries({ queryKey: [API_KEYS.PENGUIN_ENTRIES(variables.data.penguinId)] });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update journal entry. Please try again.", variant: "destructive" });
    },
  });

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async ({ entryId }: { entryId: number; penguinId?: number }): Promise<void> => {
      await apiRequest(`${API_KEYS.ALL_ENTRIES}/${entryId}`, "DELETE");
    },
    onSuccess: (_result, variables) => {
      toast({ title: "Success", description: "Journal entry deleted successfully" });
      queryClient.invalidateQueries({ queryKey: [API_KEYS.ALL_ENTRIES] });
      if (variables.penguinId) {
        queryClient.invalidateQueries({ queryKey: [API_KEYS.PENGUIN_ENTRIES(variables.penguinId)] });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete journal entry. Please try again.", variant: "destructive" });
    },
  });

  return {
    userJournalEntries: getUserJournalQuery.data || [],
    isLoadingJournal: getUserJournalQuery.isLoading,
    isErrorJournal: getUserJournalQuery.isError,
    journalError: getUserJournalQuery.error,
    addJournalEntry: addJournalEntryMutation.mutateAsync,
    isAddingJournalEntry: addJournalEntryMutation.isPending,

    updateJournalEntry: (id: number, data: Partial<JournalEntryInput>) =>
      updateJournalEntryMutation.mutateAsync({ id, data }),
    isUpdatingJournalEntry: updateJournalEntryMutation.isPending,

    deleteJournalEntry: (entryId: number, penguinId?: number) =>
      deleteJournalEntryMutation.mutateAsync({ entryId, penguinId }),
    isDeletingJournalEntry: deleteJournalEntryMutation.isPending,

    refetchUserJournalEntries: getUserJournalQuery.refetch,
  };
}
