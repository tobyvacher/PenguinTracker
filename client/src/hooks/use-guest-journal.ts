import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { JOURNAL_API_KEYS } from "./use-journal";

export interface GuestJournalEntry {
  id: number;
  penguinId: number;
  sightingDate: string;
  location: string;
  notes: string | null;
  coordinates: string | null;
}

type AddEntryData = {
  penguinId: number;
  sightingDate: Date;
  location: string;
  notes: string | null;
  coordinates: string | null;
};

type UpdateEntryData = Partial<Omit<AddEntryData, "penguinId">>;

const STORAGE_KEY = "journal-entries-guest";

function readAll(): GuestJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(entries: GuestJournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — silently skip
  }
}

let nextLocalId = -(Date.now());

export function useGuestJournal(penguinId: number) {
  const [allEntries, setAllEntries] = useState<GuestJournalEntry[]>(() => readAll());
  const { toast } = useToast();

  const entries = allEntries.filter((e) => e.penguinId === penguinId);

  const addEntry = async (data: AddEntryData): Promise<void> => {
    const entry: GuestJournalEntry = {
      id: nextLocalId--,
      penguinId: data.penguinId,
      sightingDate: data.sightingDate.toISOString(),
      location: data.location,
      notes: data.notes,
      coordinates: data.coordinates,
    };
    const updated = [...readAll(), entry];
    writeAll(updated);
    setAllEntries(updated);
    toast({
      title: "Sighting saved",
      description: "Sign in to save your entries permanently.",
    });
  };

  const updateEntry = async (id: number, data: UpdateEntryData): Promise<void> => {
    const updated = readAll().map((e) =>
      e.id !== id
        ? e
        : {
            ...e,
            ...(data.location !== undefined && { location: data.location }),
            ...(data.notes !== undefined && { notes: data.notes }),
            ...(data.coordinates !== undefined && { coordinates: data.coordinates }),
            ...(data.sightingDate !== undefined && {
              sightingDate: data.sightingDate.toISOString(),
            }),
          }
    );
    writeAll(updated);
    setAllEntries(updated);
    toast({ title: "Entry updated" });
  };

  const deleteEntry = async (id: number): Promise<void> => {
    const updated = readAll().filter((e) => e.id !== id);
    writeAll(updated);
    setAllEntries(updated);
    toast({ title: "Entry deleted" });
  };

  return { entries, addEntry, updateEntry, deleteEntry };
}

export async function syncGuestJournalToApi(queryClient: QueryClient): Promise<void> {
  const entries = readAll();
  if (entries.length === 0) return;

  let synced = 0;
  for (const entry of entries) {
    try {
      await apiRequest(JOURNAL_API_KEYS.ALL_ENTRIES, "POST", {
        penguinId: entry.penguinId,
        sightingDate: new Date(entry.sightingDate),
        location: entry.location,
        notes: entry.notes ?? null,
        coordinates: entry.coordinates ?? null,
      });
      synced++;
    } catch {
      // Skip entries that fail; they remain in storage for the next attempt
    }
  }

  if (synced > 0) {
    localStorage.removeItem(STORAGE_KEY);
    queryClient.invalidateQueries({ queryKey: [JOURNAL_API_KEYS.ALL_ENTRIES] });
  }
}
