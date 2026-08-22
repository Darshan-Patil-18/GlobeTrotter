# GlobeTrotter Implementation Checklist

- [x] Registration Flow: Circular Photo upload picker at top-center (matching user mockup), profile picture saved to Supabase database (`profiles.avatar_url`)
- [x] User Profile Context: Real user avatar photo and full name dynamically reflected in Topbar, Sidebar, Settings, Community, and Trip listings
- [x] Explore (City Search Screen): Country dropdown removed; single search bar with instant keyword matching (e.g., typing "guj" or "gujarat" displays Gujarat cities with authentic photos)
- [x] Add to Trip Flow: Select target trip dialog in Explore screen; appends stop to database and redirects cleanly to Itinerary Builder
- [x] Itinerary Builder & View: Resolved all text collapsing, font wrapping, and overlapping elements with responsive flexbox/grid layouts
- [x] Create Trip Form: Clean modal layout with fields for Trip Name, First City Destination, Start/End Dates, Budget, Description, and Cover Image Upload with preview
- [x] My Trips Screen: Working **Edit Trip Modal** (edit name, dates, description, budget limit, cover image, public share toggle) with instant Supabase database updates
- [x] All 13 PDF Screens fully wired, responsive, and working against Supabase backend
