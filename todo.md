# Project TODO

- [x] Responsive desktop and mobile application shell with sidebar, top bar, and mobile navigation
- [x] Login, registration, duplicate-email handling, forgot-password, and reset-password flows
- [x] Supabase data model and Row Level Security for profiles, trips, stops, activities, expenses, and community posts
- [x] Dashboard with upcoming trips, recommendations, and budget summary
- [x] Create trip flow with cover upload, city search, and suggested activities
- [x] My Trips list with working view, edit, and delete actions
- [x] Itinerary builder with stops, activities, ordering, and deletion
- [x] Read-only itinerary view with list and calendar modes
- [x] City search with filters, photos, and add-to-trip action
- [x] Activity search with category/cost/duration filters and add/remove actions
- [x] Trip budget and cost breakdown with charts and threshold alerts
- [x] Trip calendar/timeline with expandable days and quick editing
- [x] Public shared itinerary URL with copy-trip and social links
- [x] Profile/settings with avatar, language, favorites, and delete-account flow
- [x] Admin-only analytics dashboard with users, trends, popular cities, and popular activities
- [x] Integrations for Unsplash, GeoDB Cities, OpenTripMap, and Supabase configuration
- [x] Vitest coverage for critical backend and data-access behavior
- [x] Desktop and mobile visual verification at representative breakpoints
- [x] Local VS Code setup and run instructions
- [x] Final checkpoint after all completed items are verified

## Change History

- [x] User requested a complete implementation based on the supplied mockup and requirements.
- [x] User clarified that the app must work properly on both mobile and desktop.

- [x] Complete auth UX with all registration fields, inline duplicate-email message, reset email display, and role-based routing
- [x] Replace prototype local data with Supabase-backed trips, itinerary, budget, calendar, community, profile, and admin data
- [x] Implement GeoDB, OpenTripMap, and Unsplash API calls through secure server-side procedures
- [x] Add persistence for trip editing, stop/activity ordering, deletes, uploads, public sharing, and account deletion
- [x] Add feature-level Vitest coverage for profile, trip, itinerary, expense, community, API, and admin authorization logic

- [ ] Copy all project folders and files into the connected C:\\GlobeTrotter folder while preserving the existing .env
- [ ] Verify the copied project contents and local VS Code run path
