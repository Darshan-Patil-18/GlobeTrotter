# 🌍 GlobeTrotter — Empowering Personalized Travel Planning

A modern, full-stack travel planning web application built to design, organize, and manage multi-city itineraries, budget breakdowns, community experiences, and travel calendars.

---

## 🚀 Key Features

* **Interactive Trip Builder**: Create multi-city trips with customizable itinerary sections, dates, and physical activity schedules.
* **Stacked Budget & Expense Tracker**: View total trip budgets, itemized section activity costs, and extra expenses in stacked real-time views.
* **Explore & Search Engine**: Discover top destinations and curated regions powered by GeoDB and Unsplash APIs. Direct "Add to Trip" integration pre-fills trip planning forms.
* **Interactive My Trips Hub**: Real-time searching, grouping, status filtering (*Ongoing*, *Upcoming*, *Completed*), and sorting (*Name*, *Budget*, *Recent*).
* **Interactive Travel Calendar**: Visual month/year view mapping trip date ranges with automatic month jumping when selecting specific trips.
* **Live Community Feed**: Share travel experiences, post updates with custom user profile photos and full author names, and search community posts.
* **User Profile & Account Management**: Edit profile details (first/last name, phone, location, bio), upload custom profile avatars, and view read-only account email credentials.
* **Admin Dashboard**: System analytics overview tracking registered users and created trips.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Sonner Toasts, Wouter Routing |
| **Backend** | Node.js, Express, tRPC, Axios |
| **Database & Auth** | Supabase (PostgreSQL, Row Level Security, Auth Services, Storage Buckets) |
| **APIs & Services** | GeoDB RapidAPI, Unsplash API, OpenTripMap API |

---

## 👥 Team Contribution & Commit Responsibilities

To streamline collaboration across a 3-member team, repository files and components are structured by role:

```
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx        # Main application views (Overview, Trips, Itinerary, Budget, Calendar, Community)
│   │   │   ├── AuthPage.tsx    # Auth screens (Login, Register, Password Reset)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx # Authentication state management
│   │   ├── lib/
│   │   │   ├── globetrotterData.ts # Data layer & Supabase RPC wrappers
│   │   │   ├── supabase.ts     # Supabase client instance
│   │   │   └── trpc.ts         # tRPC React Query client
│   │   └── index.css           # Global design system, glassmorphism, & theme styles
├── server/                     # Backend API & Server Logic
│   ├── _core/                  # Server entrypoint, tRPC context & SDK
│   └── routes.ts               # Travel destination & analytics API routes
├── shared/                     # Shared TypeScript schemas & types
├── drizzle/                    # Database models & schema types
└── supabase/                   # Master database SQL migration scripts
    └── schema.sql              # Consolidated single-step SQL setup script
```

### Member 1: Frontend Developer (UI & User Experience)
* **Responsible Files**: `client/src/pages/Home.tsx`, `client/src/pages/AuthPage.tsx`, `client/src/index.css`, `client/index.html`
* **Commits**:
  * User interface components (Sidebar, Topbar, Responsive Mobile Navigation).
  * Page views (`Overview`, `Trips`, `ItineraryPage`, `BudgetPage`, `CalendarPage`, `CommunityLive`, `SettingsPage`).
  * Custom CSS design system, typography, animations, glassmorphism, and responsive layouts.
  * Form pre-filling, dropdown filter handlers, and toast notification triggers.

### Member 2: Backend Developer & Database Engineer (Server & Data Layer)
* **Responsible Files**: `server/`, `supabase/schema.sql`, `client/src/lib/globetrotterData.ts`, `shared/`, `drizzle/`
* **Commits**:
  * Supabase PostgreSQL database tables, Row Level Security (RLS) policies, and storage buckets (`schema.sql`).
  * Backend API endpoints in `server/routes.ts` (GeoDB & Unsplash integrations).
  * Data query helper methods in `client/src/lib/globetrotterData.ts` for trips, stops, activities, expenses, profiles, and community posts.
  * Express server setup and tRPC router context.

### Member 3: Full-Stack Integration & Auth Lead
* **Responsible Files**: `client/src/contexts/AuthContext.tsx`, `client/src/lib/supabase.ts`, `client/src/lib/trpc.ts`, `vite.config.ts`, `package.json`, `.gitignore`, `LOCAL_SETUP.md`, `README.md`
* **Commits**:
  * Supabase authentication lifecycle (signup, login, logout, profile loading).
  * Client-side tRPC integration and API environment bridge.
  * Repository configuration, environment variables, dependencies, and `.gitignore` setup.
  * System verification, walkthrough documentation, and project setup guides.

---

## ⚡ Quick Start Guide (Local Setup)

### Prerequisites
* Node.js (v18+ recommended)
* pnpm (`corepack enable` or `npm install -g pnpm`)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd globetrotter
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

UNSPLASH_ACCESS_KEY=<your-unsplash-access-key>
GEODB_API_KEY=<your-geodb-api-key>
GEODB_API_HOST=wft-geo-db.p.rapidapi.com
OPENTRIPMAP_API_KEY=<your-opentripmap-api-key>
```

### 3. Run Development Server
```bash
pnpm dev
```
Open your browser at **`http://localhost:3000`**.

---

## 📊 Database Initialization Guide (For Evaluators)

Setting up a fresh Supabase database takes **1 single step**:

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab from the left sidebar.
3. Click **+ New Query**, paste the entire contents of **`supabase/schema.sql`**, and click **Run**.

*This script automatically creates all required tables (`profiles`, `trips`, `trip_stops`, `activities`, `expenses`, `community_posts`), RLS policies, user triggers, and storage buckets (`avatars`, `trip-covers`, `community`).*
