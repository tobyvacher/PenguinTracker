export const JOURNAL_API_KEYS = {
  ALL_ENTRIES: "/api/journal",
  PENGUIN_ENTRIES: (id: number) => `/api/journal/penguin/${id}`,
} as const;
