# GlobeTrotter local VS Code setup

Open the repository folder in VS Code. Install Node.js LTS, then open a PowerShell terminal at the folder containing `package.json` and run:

```powershell
corepack enable
pnpm install
pnpm dev
```

Open the URL printed by the terminal, normally `http://localhost:3000`. For a production-style local check, use:

```powershell
pnpm check
pnpm test
pnpm build
pnpm start
```

The client expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Server-side travel procedures expect `GEODB_API_KEY`, `GEODB_API_HOST`, `OPENTRIPMAP_API_KEY`, and `UNSPLASH_ACCESS_KEY`. Keep `.env` files out of Git and configure the local password-reset URL in Supabase Authentication URL settings.

Run `supabase/schema.sql` and `supabase/rls_hardening.sql` in the connected Supabase project if the database has not already been migrated. The project’s current verified migration created the travel tables, ownership policies, admin aggregate views, and public itinerary view.
