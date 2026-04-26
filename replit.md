# Penguin Tracker

A web app for tracking penguin species sightings and maintaining a personal bird-watching journal.

## Architecture

**Frontend**: React + TypeScript + Vite  
**Backend**: Express.js  
**Database**: PostgreSQL (Replit-managed) via Drizzle ORM  
**Auth**: Replit Auth (OpenID Connect / Passport.js)  
**Styling**: Tailwind CSS + shadcn/ui

## Key Features

- Browse 18 penguin species (seeded from static data on startup)
- Mark penguins as "seen" — saved per authenticated user
- Sighting journal with date, location, notes, and coordinates
- Dark/light mode toggle
- Replit Auth sign-in (no external auth provider needed)

## Database Tables

- `penguins` — species data (seeded at startup)
- `users` — authenticated users (keyed by `replit_user_id`)
- `seen_penguins` — join table tracking which penguins a user has seen
- `sighting_journal` — journal entries per user per penguin
- `sessions` — session store for Replit Auth (managed by connect-pg-simple)

## Project Structure

```
client/src/
  pages/          # React pages (Home, PenguinDetail, Journal)
  components/     # UI components
  hooks/          # useQuery/mutation hooks (use-penguin-store.ts, use-journal.ts)
  contexts/       # AuthContext, ThemeContext
  lib/            # penguin-data.ts, queryClient.ts

server/
  index.ts        # App entrypoint — sets up auth, routes, Vite
  routes.ts       # API routes for penguins, seen-penguins, journal
  storage.ts      # IStorage interface + DrizzleStorage export
  drizzle-storage.ts  # DrizzleStorage implementation
  db.ts           # Drizzle + pg Pool setup
  replit_integrations/auth/
    replitAuth.ts   # Passport OIDC setup, session store, isAuthenticated middleware
    routes.ts       # /api/auth/user endpoint
    storage.ts      # upsertUser / getUser helpers

shared/
  schema.ts       # Drizzle schema (penguins, users, seenPenguins, sightingJournal)
  models/auth.ts  # sessions table schema
```

## Environment Variables (Replit-managed)

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret
- `REPL_ID` — Replit app identifier (auto-set by Replit)
- `REPLIT_DOMAINS` / `REPLIT_DEV_DOMAIN` — domain info for OAuth callbacks

## Development

```bash
npm run dev       # Start Express + Vite dev server on port 5000
npm run db:push   # Sync Drizzle schema to database
```
