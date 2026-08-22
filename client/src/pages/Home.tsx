import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, BarChart3, ChevronLeft, ChevronRight, Compass, DollarSign,
  LayoutDashboard, ListTodo, LogOut, MapPin, Menu, MoreHorizontal,
  Plus, Search, Settings, Trash2, Users, X, Plane, Calendar, Layers,
  ChevronDown as ArrowDownIcon, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  listTrips, getTripDetails, createTrip, deleteTrip,
  addStop, deleteStop, addActivity, deleteActivity, listCommunityPosts,
  createCommunityPost, uploadAvatar, getAdminAnalytics
} from "@/lib/globetrotterData";

const CHART_COLORS = ["#2ca999", "#467d9d", "#e0a657", "#af655b", "#66c9bb"];

function getInitials(name?: string | null) {
  if (!name) return "GT";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ----------------------------------------------------
// Reusable Wireframe Controls Bar (Search, Group by, Filter, Sort by)
// ----------------------------------------------------
function WireframeControlsBar({ searchVal, setSearchVal, groupBy, setGroupBy, filter, setFilter, sortBy, setSortBy }: any) {
  return (
    <div className="wireframe-controls-bar">
      <div className="search-input">
        <Search size={16} className="text-[#7d9997]" />
        <input
          placeholder="Search bar ..."
          value={searchVal || ""}
          onChange={(e) => setSearchVal && setSearchVal(e.target.value)}
          className="bg-transparent border-0 outline-none text-xs w-full text-[#10232d]"
        />
        {searchVal && (
          <button onClick={() => setSearchVal("")} className="text-gray-400">
            <X size={14} />
          </button>
        )}
      </div>

      <select value={groupBy || "all"} onChange={(e) => setGroupBy && setGroupBy(e.target.value)}>
        <option value="all">Group by: Default</option>
        <option value="region">Group by: Region</option>
        <option value="date">Group by: Date</option>
        <option value="budget">Group by: Budget</option>
      </select>

      <select value={filter || "all"} onChange={(e) => setFilter && setFilter(e.target.value)}>
        <option value="all">Filter: All</option>
        <option value="upcoming">Filter: Upcoming</option>
        <option value="ongoing">Filter: Ongoing</option>
        <option value="completed">Filter: Completed</option>
      </select>

      <select value={sortBy || "recent"} onChange={(e) => setSortBy && setSortBy(e.target.value)}>
        <option value="recent">Sort by: Recent</option>
        <option value="name">Sort by: Name (A-Z)</option>
        <option value="budget_high">Sort by: Budget (High-Low)</option>
      </select>
    </div>
  );
}

// ----------------------------------------------------
// Sidebar Component
// ----------------------------------------------------
function Sidebar({ active, setActive, mobileOpen, setMobileOpen }: any) {
  const { profile, user, isAdmin, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const fullName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "Traveler";

  const initials = getInitials(fullName);

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, key: "overview" },
    { label: "Create Trip", icon: Plus, key: "create_trip" },
    { label: "My Trips", icon: Plane, key: "trips" },
    { label: "Explore & Search", icon: Compass, key: "explore" },
    { label: "Build Itinerary", icon: ListTodo, key: "itinerary" },
    { label: "Budget & Expenses", icon: DollarSign, key: "budget" },
    { label: "Calendar", icon: Calendar, key: "calendar" },
    { label: "Community", icon: Users, key: "community" },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand">
        <span className="brand-mark">
          <Compass size={21} />
        </span>
        <span>
          globe<span>trotter</span>
        </span>
        <button className="mobile-close" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">Navigation</p>
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${active === item.key ? "active" : ""}`}
            onClick={() => {
              setActive(item.key);
              setMobileOpen(false);
            }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.key === "community" && <span className="nav-dot" />}
          </button>
        ))}
      </div>

      <div className="sidebar-section sidebar-bottom">
        <p className="sidebar-label">Manage</p>

        {isAdmin && (
          <button
            className={`nav-item ${active === "analytics" || active === "admin" ? "active" : ""}`}
            onClick={() => {
              setActive("analytics");
              setMobileOpen(false);
            }}
          >
            <BarChart3 size={18} />
            <span>Admin Panel</span>
            <span className="ml-auto text-[9px] font-semibold bg-[#2ca999] text-white px-1.5 py-0.5 rounded">ADMIN</span>
          </button>
        )}

        <button
          className={`nav-item ${active === "settings" ? "active" : ""}`}
          onClick={() => {
            setActive("settings");
            setMobileOpen(false);
          }}
        >
          <Settings size={18} />
          <span>Profile & Settings</span>
        </button>



        {/* Interactive Bottom-Left Profile Menu */}
        <div className="relative">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-[#103842] border border-[#23525a] rounded-xl p-2 shadow-xl z-30 space-y-1">
              <button
                className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#143d46] rounded-lg flex items-center gap-2"
                onClick={() => {
                  setActive("settings");
                  setProfileMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                <User size={15} className="text-[#2ca999]" /> Profile & Settings
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/40 rounded-lg flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut size={15} className="text-red-400" /> Sign Out
              </button>
            </div>
          )}

          <div
            className="profile-mini flex items-center justify-between cursor-pointer hover:bg-[#143d46] p-2 rounded-lg transition-colors relative"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="w-8 h-8 rounded-full object-cover border border-[#2ca999]" />
              ) : (
                <div className="avatar small">{initials}</div>
              )}
              <div className="truncate">
                <b className="truncate font-bold text-xs text-[#eff8f5]">{fullName}</b>
                <span className="capitalize text-[10px] text-[#789195] block">{profile?.role || "Traveler"}</span>
              </div>
            </div>
            <MoreHorizontal size={16} className="text-[#a6bdbe] hover:text-white" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ setMobileOpen, active, setActive }: any) {
  const { profile, user } = useAuth();

  const titleMap: Record<string, string> = {
    overview: "Overview",
    create_trip: "Create a New Trip",
    trips: "My Trips",
    explore: "Explore & Search",
    itinerary: "Build Itinerary",
    budget: "Budget & Expenses",
    calendar: "Calendar",
    community: "Community",
    analytics: "Admin Dashboard",
    admin: "Admin Dashboard",
    settings: "Profile & Settings",
  };

  const title = titleMap[active] || "GlobeTrotter Workspace";
  const fullName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "Traveler";
  const initials = getInitials(fullName);

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
        <Menu size={22} />
      </button>
      <div>
        <p className="breadcrumb">
          GlobeTrotter <ChevronRight size={13} /> <b>{title}</b>
        </p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <div
          className="top-avatar cursor-pointer hover:opacity-90 transition-opacity border border-[#2ca999]"
          onClick={() => setActive && (setActive as any)("settings")}
          title="Go to profile"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}

// ----------------------------------------------------
// Screen 3: Main Landing Page (Wireframe Screen 3)
// ----------------------------------------------------
function Overview({ setActive, trips, setTrips, selectTripForDetails }: any) {
  const { profile } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [groupBy, setGroupBy] = useState("all");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const regionalSelections = [
    { name: "Gujarat", image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=600&q=80", count: "7 Cities" },
    { name: "Rajasthan", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80", count: "5 Cities" },
    { name: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80", count: "4 Cities" },
    { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80", count: "3 Beaches" },
    { name: "Himachal", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80", count: "6 Valleys" },
  ];

  const filteredTrips = trips.filter((t: any) => {
    return !searchVal || t.name.toLowerCase().includes(searchVal.toLowerCase());
  });

  return (
    <>
      {/* Hero Banner Image */}
      <div
        className="wireframe-banner-hero"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=80')`,
        }}
      >
        <div className="wireframe-banner-overlay" />
        <div className="wireframe-banner-content">
          <p className="eyebrow accent-text text-white">Empowering Personalized Travel Planning</p>
          <h2 className="font-bold text-3xl md:text-4xl text-white mb-2 font-['Space_Grotesk']">
            Banner Image — Explore Global Destinations
          </h2>
          <p className="text-sm text-gray-200">
            Dream, design, and organize multi-city travel itineraries with intelligent tools, activity suggestions, and cost breakdown.
          </p>
        </div>
      </div>

      {/* Top Regional Selections */}
      <div className="mb-8">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated Regions</p>
            <h3 className="font-bold text-xl text-[#102f38]">Top Regional Selections</h3>
          </div>
        </div>

        <div className="wireframe-regional-scroll">
          {regionalSelections.map((reg) => (
            <div
              key={reg.name}
              className="wireframe-regional-card"
              style={{ backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(8,35,45,0.85)), url('${reg.image}')` }}
              onClick={() => {
                setActive("explore");
                // Pass region name as search pre-fill via sessionStorage
                sessionStorage.setItem("explore_search", reg.name);
              }}
            >
              <b className="font-bold text-lg leading-tight">{reg.name}</b>
              <span className="text-xs text-[#66c9bb]">{reg.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Previous Trips Section */}
      <div className="mb-12">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your Collection</p>
            <h3 className="font-bold text-xl text-[#102f38]">Previous Trips</h3>
          </div>
          <button className="link-button" onClick={() => setActive("trips")}>
            View all trips <ArrowRight size={15} />
          </button>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-[#a9c6c2] rounded-xl">
            <Plane className="mx-auto h-10 w-10 text-[#2ca999] mb-2" />
            <h4 className="font-bold text-sm text-[#102f38]">No previous trips found</h4>
            <p className="text-xs text-[#789092]">Click "+ Plan a trip" to create your first journey.</p>
          </div>
        ) : (
          <div className="trip-grid">
            {filteredTrips.map((trip: any) => (
              <article className="trip-card" key={trip.id}>
                <div
                  className="trip-image"
                  style={{
                    backgroundImage: `linear-gradient(180deg, transparent 36%, rgba(7,18,27,.78)), url(${trip.cover_photo_url || "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80"
                      })`,
                  }}
                >
                  <Badge className={`trip-status ${trip.is_public ? "upcoming" : "planning"}`}>
                    {trip.is_public ? "Public Shared" : "Private"}
                  </Badge>
                  <div className="trip-image-caption">
                    <p>{trip.name}</p>
                    <span>{trip.start_date ? `${trip.start_date} ${trip.end_date ? `– ${trip.end_date}` : ""}` : "Dates TBD"}</span>
                  </div>
                </div>
                <div className="trip-card-body">
                  <div className="trip-meta">
                    <span>
                      <MapPin size={14} /> {trip.trip_stops?.length || 1} stop(s)
                    </span>
                    {trip.budget > 0 && (
                      <span>
                        <DollarSign size={14} /> ${trip.budget} budget
                      </span>
                    )}
                  </div>
                  <div className="trip-card-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        selectTripForDetails(trip.id);
                        setActive("itinerary");
                      }}
                    >
                      View itinerary
                    </Button>
                    <button
                      className="text-button danger"
                      onClick={async () => {
                        if (window.confirm(`Delete trip "${trip.name}"?`)) {
                          await deleteTrip(trip.id);
                          setTrips(trips.filter((t: any) => t.id !== trip.id));
                          toast.success("Trip deleted");
                        }
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Wireframe Floating Button at Bottom Right */}
      <button className="floating-plan-btn" onClick={() => setActive("create_trip")}>
        <Plus size={20} /> Plan a trip
      </button>
    </>
  );
}

// ----------------------------------------------------
// Screen 4: Create a new Trip (Wireframe Screen 4)
// ----------------------------------------------------
function CreateTripPage({ setActive, trips, setTrips, selectTripForDetails }: any) {
  const [startDate, setStartDate] = useState("");
  const [place, setPlace] = useState(() => {
    const p = sessionStorage.getItem("prefill_place") || "";
    sessionStorage.removeItem("prefill_place");
    return p;
  });
  const [endDate, setEndDate] = useState("");
  const [tripName, setTripName] = useState(() => {
    const n = sessionStorage.getItem("prefill_name") || "";
    sessionStorage.removeItem("prefill_name");
    return n;
  });
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const suggestions = [
    { title: "Gir National Park Safari", region: "Gujarat", image: "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=500&q=80" },
    { title: "Statue of Unity Visit", region: "Kevadia, Gujarat", image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=500&q=80" },
    { title: "Sunset at Rann of Kutch", region: "Kutch, Gujarat", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=500&q=80" },
    { title: "Arashiyama Bamboo Grove", region: "Kyoto, Japan", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80" },
    { title: "Eiffel Tower Sunset Walk", region: "Paris, France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80" },
    { title: "Colosseum Cultural Tour", region: "Rome, Italy", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=500&q=80" },
  ];

  const handleFormSubmit = async (e: any) => {
    e.preventDefault();
    const finalName = tripName.trim() || (place ? `${place} Adventure` : "My Multi-City Trip");

    setIsSubmitting(true);
    try {
      const newTrip = await createTrip({
        name: finalName,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        description: description.trim() || undefined,
        budget: budget ? parseFloat(budget) : 0,
      });

      if (place.trim()) {
        await addStop({
          trip_id: newTrip.id,
          city_name: place.trim(),
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          order_index: 0,
        });
      }

      toast.success("New Trip Created! Opening Itinerary Builder...");
      // Refresh full list from DB so budget/dates are correct
      const refreshed = await listTrips();
      setTrips(refreshed);
      selectTripForDetails(newTrip.id);
      setActive("itinerary");
    } catch (err: any) {
      toast.error(err.message || "Failed to create trip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white border border-[#2ca999] rounded-xl p-6 shadow-md space-y-6">
        <div>
          <p className="eyebrow accent-text">Plan a New Trip</p>
          <h2 className="font-bold text-2xl text-[#102f38]">Plan a new trip</h2>
          <p className="text-xs text-[#789092]">Fill in trip details to generate your customized multi-city itinerary.</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#527271] block mb-1">Trip Name</label>
              <Input
                placeholder="e.g. Gujarat Cultural Expedition"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#527271] block mb-1">Select a Place :</label>
              <Input
                placeholder="e.g. Ahmedabad, Gir, Kyoto, Paris"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#527271] block mb-1">Start Date:</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold text-[#527271] block mb-1">End Date:</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold text-[#527271] block mb-1">Target Budget ($):</label>
              <Input type="number" placeholder="1500" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#527271] block mb-1">Trip Notes / Objectives:</label>
            <Textarea
              placeholder="Add travel goals, lodging requirements, or sightseeing notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#e1f1ed]">
            <Button variant="outline" type="button" onClick={() => setActive("overview")}>
              Cancel
            </Button>
            <Button className="primary-button px-6" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Save & Open Builder"}
            </Button>
          </div>
        </form>
      </div>

      {/* Suggestion for Places to Visit / Activities to perform */}
      <div className="space-y-4">
        <div className="section-heading">
          <div>
            <p className="eyebrow accent-text">Inspiration</p>
            <h3 className="font-bold text-xl text-[#102f38]">Suggestion for Places to Visit / Activities to perform</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((item, idx) => (
            <div key={idx} className="bg-white border border-[#e3ece9] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
              <img src={item.image} alt={item.title} className="w-full h-36 object-cover" />
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#2ca999] uppercase">{item.region}</span>
                  <h4 className="font-bold text-sm text-[#102f38] leading-snug">{item.title}</h4>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs justify-center"
                  onClick={() => {
                    setTripName(item.title);
                    setPlace(item.region);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    toast.success(`Form pre-filled with "${item.title}"!`);
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add to Trip
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionActivityComposer({ stopId, onAdded }: { stopId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("Flexible");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter activity/item name.");
    setAdding(true);
    try {
      await addActivity({
        trip_stop_id: stopId,
        name: name.trim(),
        cost: cost ? parseFloat(cost) : 0,
        time: category,
      });
      toast.success("Activity & Spend item added!");
      setName("");
      setCost("");
      setOpen(false);
      onAdded();
    } catch (err: any) {
      toast.error(err.message || "Failed to add activity.");
    } finally {
      setAdding(false);
    }
  };

  if (!open) {
    return (
      <button
        className="mt-3 text-xs font-semibold text-[#2ca999] hover:text-[#1e786d] flex items-center gap-1"
        onClick={() => setOpen(true)}
      >
        <Plus size={14} /> Add Activity / Spend Field
      </button>
    );
  }

  return (
    <form onSubmit={handleAdd} className="mt-3 p-3 bg-[#f5f9f7] rounded-lg border border-[#c2e2da] space-y-2">
      <b className="text-xs text-[#102f38] block">Add Activity & Spend Field</b>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          placeholder="Activity / Hotel / Cab Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xs h-8 bg-white"
          required
        />
        <Input
          type="number"
          placeholder="Spend / Cost ($)"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="text-xs h-8 bg-white"
        />
        <Input
          placeholder="Time / Category (e.g. 10:00 AM)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs h-8 bg-white"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" type="button" className="h-7 text-xs" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button className="primary-button h-7 text-xs" type="submit" disabled={adding}>
          {adding ? "Saving..." : "Save Item"}
        </Button>
      </div>
    </form>
  );
}

// ----------------------------------------------------
// Screen 5: Build Itinerary Screen (Wireframe Screen 5)
// ----------------------------------------------------
function ItineraryPage({ trips, activeTripId, setActiveTripId, setActive }: any) {
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [stopCity, setStopCity] = useState("");
  const [stopStart, setStopStart] = useState("");
  const [stopEnd, setStopEnd] = useState("");
  const [stopBudget, setStopBudget] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  const currentTrip = trips.find((t: any) => t.id === activeTripId) || trips[0];

  const loadDetails = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const details = await getTripDetails(id);
      setTripDetails(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTrip?.id) {
      loadDetails(currentTrip.id);
    }
  }, [currentTrip?.id]);

  const handleAddSection = async (e: any) => {
    e.preventDefault();
    if (!stopCity.trim()) return toast.error("Please enter a section/city name.");
    if (!currentTrip?.id) return;

    try {
      await addStop({
        trip_id: currentTrip.id,
        city_name: stopCity.trim(),
        start_date: stopStart || undefined,
        end_date: stopEnd || undefined,
      });

      toast.success(`Section "${stopCity}" added to itinerary!`);
      setStopCity("");
      setStopStart("");
      setStopEnd("");
      setStopBudget("");
      setShowAddSection(false);
      await loadDetails(currentTrip.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to add section.");
    }
  };

  if (!currentTrip) {
    return (
      <div className="p-12 text-center bg-white border border-dashed border-[#a9c6c2] rounded-xl">
        <Plane className="mx-auto h-12 w-12 text-[#2ca999] mb-3" />
        <h3 className="font-bold text-lg text-[#102f38]">No active trip selected</h3>
      </div>
    );
  }

  const stops = tripDetails?.stops || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="eyebrow accent-text">Build Itinerary</p>
          <h2 className="font-bold text-2xl text-[#102f38]">{currentTrip.name}</h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="font-bold text-xs bg-white border border-[#c2e2da] rounded-md px-3 py-2 text-[#102f38]"
            value={currentTrip.id}
            onChange={(e) => setActiveTripId(e.target.value)}
          >
            {trips.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => setActive("budget")}>
            <DollarSign size={14} className="mr-1" /> View Budget & Expenses
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {stops.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-[#c2e2da] rounded-xl">
            <p className="text-xs text-[#789092]">No itinerary sections created yet. Click "+ Add another Section" below.</p>
          </div>
        ) : (
          stops.map((stop: any, index: number) => {
            const sectionBudget = stop.activities?.reduce((sum: number, a: any) => sum + Number(a.cost || 0), 0) || 0;
            const effectiveStart = stop.start_date || currentTrip?.start_date;
            const effectiveEnd = stop.end_date || currentTrip?.end_date;
            const dateRangeText = effectiveStart
              ? `${effectiveStart}${effectiveEnd ? ` → ${effectiveEnd}` : ""}`
              : "TBD";

            return (
              <div className="wireframe-section-box" key={stop.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-[#102f38]">
                      Section {index + 1}: {stop.city_name}
                    </h3>
                    <p className="text-xs text-[#789092] mt-1 max-w-xl">
                      {stop.description || "All the necessary information about this section. This can be anything like travel section, hotel, or any other activity."}
                    </p>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                    onClick={async () => {
                      if (window.confirm(`Delete Section ${index + 1}?`)) {
                        await deleteStop(stop.id);
                        await loadDetails(currentTrip.id);
                      }
                    }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                {/* Section Activities */}
                {stop.activities && stop.activities.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {stop.activities.map((act: any) => (
                      <div key={act.id} className="p-2.5 bg-[#f5f9f7] rounded-lg border border-[#e3ece9] flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-[#102f38]">{act.name}</span>
                          <span className="text-[10px] text-[#789092] ml-2">({act.time || "Flexible"})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#b77825]">${act.cost || 0}</span>
                          <button
                            className="text-red-400 hover:text-red-600"
                            onClick={async () => {
                              await deleteActivity(act.id);
                              await loadDetails(currentTrip.id);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <SectionActivityComposer stopId={stop.id} onAdded={() => loadDetails(currentTrip.id)} />

                {/* Bottom Row Badges */}
                <div className="section-badges">
                  <span className="text-xs font-semibold px-3 py-1 bg-[#e1f1ed] text-[#158978] rounded-md border border-[#c2e2da]">
                    Date Range: {dateRangeText}
                  </span>
                  <span className="text-xs font-bold px-3 py-1 bg-[#f8ecd6] text-[#b77825] rounded-md border border-[#ebd7b4]">
                    Budget of this section: ${sectionBudget} {sectionBudget === 0 && currentTrip?.budget ? `(Trip Total: $${currentTrip.budget})` : ""}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Section Form or Centered Button */}
      {showAddSection ? (
        <form onSubmit={handleAddSection} className="p-6 bg-white border border-[#2ca999] rounded-xl space-y-4 shadow-md">
          <h4 className="font-bold text-sm text-[#102f38]">Add New Itinerary Section</h4>
          <Input
            placeholder="Section Title / City Name (e.g. Travel & Hotel Section)"
            value={stopCity}
            onChange={(e) => setStopCity(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={stopStart} onChange={(e) => setStopStart(e.target.value)} />
            <Input type="date" value={stopEnd} onChange={(e) => setStopEnd(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAddSection(false)}>
              Cancel
            </Button>
            <Button className="primary-button" type="submit">
              Save Section
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-center pt-2">
          <Button className="primary-button px-8 py-3 rounded-full shadow-md" onClick={() => setShowAddSection(true)}>
            <Plus size={18} className="mr-1" /> Add another Section
          </Button>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Screen 6: User Trip Listing (Wireframe Screen 6)
// ----------------------------------------------------
function Trips({ trips, setTrips, setActive, selectTripForDetails }: any) {
  const [searchVal, setSearchVal] = useState("");
  const [groupBy, setGroupBy] = useState("all");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const now = new Date();

  // 1. Search Filter
  let processedTrips = trips.filter((t: any) => {
    if (!searchVal.trim()) return true;
    const query = searchVal.toLowerCase();
    return (
      t.name?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  });

  // 2. Status Filter
  if (filter !== "all") {
    processedTrips = processedTrips.filter((t: any) => {
      if (filter === "ongoing") {
        if (!t.start_date || !t.end_date) return false;
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        return now >= start && now <= end;
      }
      if (filter === "upcoming") {
        if (!t.start_date) return true;
        return new Date(t.start_date) > now;
      }
      if (filter === "completed") {
        if (!t.end_date) return false;
        return new Date(t.end_date) < now;
      }
      return true;
    });
  }

  // 3. Sorting
  processedTrips.sort((a: any, b: any) => {
    if (sortBy === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }
    if (sortBy === "budget_high") {
      return Number(b.budget || 0) - Number(a.budget || 0);
    }
    // "recent"
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });

  // Categorize for default view
  const ongoingTrips = processedTrips.filter((t: any) => {
    if (!t.start_date || !t.end_date) return false;
    const start = new Date(t.start_date);
    const end = new Date(t.end_date);
    return now >= start && now <= end;
  });

  const upcomingTrips = processedTrips.filter((t: any) => {
    if (!t.start_date) return true;
    return new Date(t.start_date) > now;
  });

  const completedTrips = processedTrips.filter((t: any) => {
    if (!t.end_date) return false;
    return new Date(t.end_date) < now;
  });

  return (
    <>
      {/* Wireframe Controls Bar */}
      <WireframeControlsBar
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="space-y-8">
        {processedTrips.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-[#c2e2da] rounded-xl">
            <Plane className="mx-auto h-10 w-10 text-[#2ca999] mb-2" />
            <p className="text-sm font-semibold text-[#102f38]">No trips found matching criteria.</p>
            <p className="text-xs text-[#789092] mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : filter !== "all" || groupBy !== "all" ? (
          <div>
            <h3 className="font-bold text-xl text-[#102f38] mb-3 capitalize">
              Filtered Trips ({processedTrips.length})
            </h3>
            {processedTrips.map((t: any) => (
              <div key={t.id} className="p-5 bg-white border border-[#2ca999] rounded-xl mb-3 shadow-sm flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-base text-[#102f38]">{t.name}</h4>
                  <p className="text-xs text-[#789092] mt-1">
                    Dates: {t.start_date || "TBD"} {t.end_date ? `to ${t.end_date}` : ""} — Budget: ${t.budget || 0}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { selectTripForDetails(t.id); setActive("itinerary"); }}>
                  View Details
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Ongoing Section */}
            <div>
              <h3 className="font-bold text-xl text-[#102f38] mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2ca999]" /> Ongoing Trips ({ongoingTrips.length})
              </h3>
              {ongoingTrips.length === 0 ? (
                <div className="p-4 bg-white border border-[#e3ece9] rounded-xl text-xs text-[#789092]">No ongoing trips at the moment.</div>
              ) : (
                ongoingTrips.map((t: any) => (
                  <div key={t.id} className="p-5 bg-white border border-[#2ca999] rounded-xl mb-3 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-base text-[#102f38]">{t.name}</h4>
                      <p className="text-xs text-[#789092] mt-1">Overview — {t.start_date} to {t.end_date} — Budget: ${t.budget || 0}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { selectTripForDetails(t.id); setActive("itinerary"); }}>
                      View Details
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Up-coming Section */}
            <div>
              <h3 className="font-bold text-xl text-[#102f38] mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e0a657]" /> Up-coming Trips ({upcomingTrips.length})
              </h3>
              {upcomingTrips.length === 0 ? (
                <div className="p-4 bg-white border border-[#e3ece9] rounded-xl text-xs text-[#789092]">No upcoming trips scheduled.</div>
              ) : (
                upcomingTrips.map((t: any) => (
                  <div key={t.id} className="p-5 bg-white border border-[#e3ece9] rounded-xl mb-3 shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-base text-[#102f38]">{t.name}</h4>
                      <p className="text-xs text-[#789092] mt-1">Overview — Starts {t.start_date || "Dates TBD"} — Budget: ${t.budget || 0}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { selectTripForDetails(t.id); setActive("itinerary"); }}>
                      View Details
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Completed Section */}
            <div>
              <h3 className="font-bold text-xl text-[#102f38] mb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Completed Trips ({completedTrips.length})
              </h3>
              {completedTrips.length === 0 ? (
                <div className="p-4 bg-white border border-[#e3ece9] rounded-xl text-xs text-[#789092]">No completed trips yet.</div>
              ) : (
                completedTrips.map((t: any) => (
                  <div key={t.id} className="p-5 bg-white border border-[#e3ece9] rounded-xl mb-3 shadow-sm flex justify-between items-center opacity-85">
                    <div>
                      <h4 className="font-bold text-base text-[#102f38]">{t.name}</h4>
                      <p className="text-xs text-[#789092] mt-1">Overview — Ended {t.end_date} — Budget: ${t.budget || 0}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { selectTripForDetails(t.id); setActive("itinerary"); }}>
                      View Memory
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ----------------------------------------------------
// Screen 7: User Profile Pages (Wireframe Screen 7)
// ----------------------------------------------------
function SettingsPage({ trips, setActive, selectTripForDetails }: any) {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [, navigate] = useLocation();

  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [bio, setBio] = useState(profile?.additional_info || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setCountry(profile.country || "");
      setBio(profile.additional_info || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        country: country.trim() || null,
        additional_info: bio.trim() || null,
        avatar_url: avatarUrl || null,
      });

      if (error) throw error;

      await refreshProfile();
      toast.success("User details updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user details.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      toast.success("Photo uploaded successfully!");
    } catch (err: any) {
      toast.error("Avatar upload failed.");
    }
  };

  const preplannedTrips = trips ? trips.slice(0, 3) : [];
  const previousTrips = trips ? trips.slice(3) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top User Card (Screen 7 Wireframe) */}
      <div className="bg-white border border-[#e3ece9] rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-3 min-w-[140px]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="w-28 h-28 rounded-full object-cover border-2 border-[#2ca999]" />
          ) : (
            <div className="avatar large">{getInitials(firstName || profile?.first_name)}</div>
          )}
          <label className="upload-button text-xs font-semibold cursor-pointer border border-[#c2e2da] px-3 py-1.5 rounded-md hover:bg-[#e1f1ed]">
            Change Photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
          </label>
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div>
            <h3 className="font-bold text-xl text-[#102f38]">
              {firstName ? `${firstName} ${lastName}` : "User Profile Details"}
            </h3>
            <p className="text-xs text-[#789092]">User Details with appropriate option to edit those information....</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#527271] block">Email (read-only)</label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-[#f5f9f7] text-[#789092] cursor-not-allowed opacity-80"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>

          <Button className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile Changes"}
          </Button>
        </div>
      </div>

      {/* Preplanned Trips Section */}
      <div>
        <h3 className="font-bold text-xl text-[#102f38] mb-3">Preplanned Trips</h3>
        {preplannedTrips.length === 0 ? (
          <div className="p-4 bg-white border border-[#e3ece9] rounded-xl text-xs text-[#789092]">No preplanned trips found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {preplannedTrips.map((t: any) => (
              <div key={t.id} className="bg-white border border-[#e3ece9] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <h4 className="font-bold text-sm text-[#102f38] truncate">{t.name}</h4>
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" onClick={() => { selectTripForDetails(t.id); setActive("itinerary"); }}>
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Trips Section */}
      <div>
        <h3 className="font-bold text-xl text-[#102f38] mb-3">Previous Trips</h3>
        {previousTrips.length === 0 ? (
          <div className="p-4 bg-white border border-[#e3ece9] rounded-xl text-xs text-[#789092]">No previous trips recorded.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {previousTrips.map((t: any) => (
              <div key={t.id} className="bg-white border border-[#e3ece9] rounded-xl p-4 flex flex-col justify-between space-y-3">
                <h4 className="font-bold text-sm text-[#102f38] truncate">{t.name}</h4>
                <Button variant="outline" size="sm" className="w-full justify-center text-xs" onClick={() => { selectTripForDetails(t.id); setActive("itinerary"); }}>
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Screen 8: Activity Search Pages / City Search Page (Wireframe Screen 8)
// ----------------------------------------------------
function ExploreLive({ setActive, trips, setTrips, selectTripForDetails }: any) {
  const [searchVal, setSearchVal] = useState(() => sessionStorage.getItem("explore_search") || "");
  const [groupBy, setGroupBy] = useState("all");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedCityForModal, setSelectedCityForModal] = useState<any>(null);
  const [targetTripId, setTargetTripId] = useState<string>("");

  useEffect(() => { sessionStorage.removeItem("explore_search"); }, []);

  const cityQuery = trpc.travel.cities.useQuery(
    { query: searchVal },
    { enabled: searchVal.trim().length >= 1 }
  );

  const POPULAR_DESTINATIONS = useMemo(() => [
    { city: "Ahmedabad", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1609946850021-3a9ec1a7f052?auto=format&fit=crop&w=900&q=80" },
    { city: "Gir National Park", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=900&q=80" },
    { city: "Rann of Kutch", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1627894006066-b45786537103?auto=format&fit=crop&w=900&q=80" },
    { city: "Statue of Unity (Kevadia)", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80" },
    { city: "Surat", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=80" },
    { city: "Vadodara", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=80" },
    { city: "Dwarka", country: "India", region: "Gujarat", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80" },
    { city: "Jaipur", country: "India", region: "Rajasthan", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80" },
    { city: "Udaipur", country: "India", region: "Rajasthan", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80" },
    { city: "Munnar", country: "India", region: "Kerala", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=80" },
    { city: "Panaji", country: "India", region: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80" },
    { city: "Manali", country: "India", region: "Himachal", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80" },
    { city: "Shimla", country: "India", region: "Himachal", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=900&q=80" },
    { city: "Paris", country: "France", region: "Europe", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80" },
    { city: "Kyoto", country: "Japan", region: "Asia", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80" },
    { city: "Rome", country: "Italy", region: "Europe", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80" },
    { city: "Tokyo", country: "Japan", region: "Asia", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80" },
    { city: "London", country: "United Kingdom", region: "Europe", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80" },
    { city: "New York", country: "United States", region: "Americas", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=900&q=80" },
  ], []);

  const displayCities = useMemo(() => {
    if (cityQuery.data && cityQuery.data.length > 0) return cityQuery.data;
    if (!searchVal.trim()) return [];
    const q = searchVal.toLowerCase().trim();
    return POPULAR_DESTINATIONS.filter(
      (d) =>
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q)
    );
  }, [cityQuery.data, searchVal, POPULAR_DESTINATIONS]);

  const handleConfirmAddStop = async () => {
    if (!selectedCityForModal || !targetTripId) return;
    try {
      await addStop({
        trip_id: targetTripId,
        city_name: selectedCityForModal.city || selectedCityForModal.name,
        country: selectedCityForModal.country || undefined,
      });

      toast.success(`"${selectedCityForModal.city || selectedCityForModal.name}" added to trip!`);
      setSelectedCityForModal(null);
      selectTripForDetails(targetTripId);
      setActive("itinerary");
    } catch (err: any) {
      toast.error(err.message || "Failed to add stop.");
    }
  };

  return (
    <>
      {/* Wireframe Controls Bar */}
      <WireframeControlsBar
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {selectedCityForModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2ca999] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-[#102f38]">
              Add {selectedCityForModal.city || selectedCityForModal.name} to Trip
            </h3>
            {trips.length > 0 ? (
              <select
                className="w-full border rounded p-2 text-xs bg-white"
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
              >
                {trips.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-[#789092]">You don't have any created trips yet. You can create a new trip with this place!</p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCityForModal(null)}>
                  Cancel
                </Button>
                {trips.length > 0 && (
                  <Button className="primary-button" onClick={handleConfirmAddStop}>
                    Add Stop & Open Itinerary
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                className="text-xs text-[#2ca999] font-bold"
                onClick={() => {
                  const name = selectedCityForModal.city || selectedCityForModal.name;
                  sessionStorage.setItem("prefill_name", `${name} Trip`);
                  sessionStorage.setItem("prefill_place", name);
                  setSelectedCityForModal(null);
                  setActive("create_trip");
                }}
              >
                + Plan New Trip with {selectedCityForModal.city || selectedCityForModal.name}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results List Stack (Screen 8 Wireframe) */}
      <div className="space-y-4">
        <h3 className="font-bold text-xl text-[#102f38]">Results</h3>

        {searchVal.trim().length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-[#c2e2da] rounded-xl">
            <Compass className="mx-auto h-10 w-10 text-[#2ca999] mb-2" />
            <p className="text-sm text-[#789092]">Type a city or region name above to search destinations.</p>
          </div>
        ) : cityQuery.isLoading ? (
          <div className="p-8 text-center text-xs text-[#789092]">Searching...</div>
        ) : displayCities.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#789092]">No results found for "{searchVal}".</div>
        ) : (
          displayCities.map((item: any, idx: number) => {
            const name = item.city || item.name;
            const country = item.country || "Destination";
            const img = item.image || "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80";

            return (
              <div key={name + idx} className="bg-white border border-[#e3ece9] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <img src={img} alt={name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-base text-[#102f38]">{name}</h4>
                    <p className="text-xs text-[#789092]">{country} {item.region ? `— ${item.region}` : ""}</p>
                  </div>
                </div>

                <Button
                  className="primary-button text-xs w-full md:w-auto"
                  onClick={() => {
                    if (trips.length === 0) return toast.error("Please create a trip first.");
                    setSelectedCityForModal(item);
                    setTargetTripId(trips[0]?.id || "");
                  }}
                >
                  <Plus size={14} className="mr-1" /> Add to Trip
                </Button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

// ----------------------------------------------------
// ----------------------------------------------------
// Budget & Expenses Screen (replaces Structured View & single dropdown)
// ----------------------------------------------------
function TripBudgetItem({ trip }: { trip: any }) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trip?.id) {
      getTripDetails(trip.id)
        .then(setDetails)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [trip?.id]);

  const stops = details?.stops || [];
  const expenses = details?.expenses || [];

  const totalActivityCost = stops.reduce(
    (sum: number, stop: any) =>
      sum + (stop.activities || []).reduce((s2: number, a: any) => s2 + Number(a.cost || 0), 0),
    0
  );
  const totalExpensesCost = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
  const totalSpent = totalActivityCost + totalExpensesCost;
  const budget = Number(trip.budget || 0);
  const remaining = budget - totalSpent;

  return (
    <div className="bg-white border border-[#2ca999] rounded-xl p-5 shadow-sm space-y-4">
      {/* Trip Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e1f1ed] pb-3 gap-2">
        <div>
          <h3 className="font-bold text-xl text-[#102f38]">{trip.name}</h3>
          <p className="text-xs text-[#789092] mt-0.5">
            {trip.start_date ? `📅 ${trip.start_date} → ${trip.end_date || "TBD"}` : "No dates set"}
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="px-3 py-1.5 bg-[#e1f1ed] text-[#102f38] rounded-lg font-bold">
            Budget: <span className="text-[#2ca999]">${budget.toFixed(2)}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#f8ecd6] text-[#b77825] rounded-lg font-bold">
            Spent: <span>${totalSpent.toFixed(2)}</span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg font-bold ${remaining >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            Remaining: <span>${remaining.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center text-xs text-[#789092]">Loading trip breakdown...</div>
      ) : (
        <div className="space-y-4">
          {/* Table Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-[#c2e2da] font-bold text-xs text-[#102f38] uppercase">
            <div>Physical Activity</div>
            <div>Expense / Cost</div>
          </div>

          {stops.length === 0 && expenses.length === 0 ? (
            <div className="p-4 text-center bg-[#f7faf9] rounded-lg text-xs text-[#789092] border border-dashed border-[#c2e2da]">
              No activities or expenses added for this trip yet.
            </div>
          ) : (
            <>
              {stops.map((stop: any, sIdx: number) => (
                <div key={stop.id || sIdx} className="space-y-2">
                  <div className="inline-block px-2.5 py-0.5 bg-[#2ca999] text-white rounded text-[11px] font-bold">
                    Section {sIdx + 1}: {stop.city_name}
                  </div>

                  {stop.activities && stop.activities.length > 0 ? (
                    stop.activities.map((act: any, aIdx: number) => (
                      <div key={act.id || aIdx} className="space-y-1">
                        <div className="wireframe-flow-day">
                          <div className="p-2.5 bg-[#f7faf9] border border-[#e3ece9] rounded-lg shadow-xs">
                            <b className="text-xs text-[#102f38] block">{act.name}</b>
                            {act.category && <span className="text-[10px] text-[#789092]">Category: {act.category}</span>}
                          </div>

                          <div className="p-2.5 bg-[#f8ecd6] border border-[#ebd7b4] text-[#b77825] rounded-lg text-xs font-bold flex items-center justify-between">
                            <span>Cost:</span>
                            <span>${Number(act.cost || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-[#f7faf9] rounded border border-[#e3ece9] text-[11px] text-[#789092] italic">
                      No activities for this section.
                    </div>
                  )}
                </div>
              ))}

              {/* Extra Expenses */}
              {expenses.length > 0 && (
                <div className="pt-2 space-y-2 border-t border-[#e1f1ed]">
                  <b className="text-xs font-bold text-[#102f38] block">Other Expenses</b>
                  {expenses.map((exp: any, expIdx: number) => (
                    <div key={exp.id || expIdx} className="flex justify-between items-center p-2.5 bg-[#f7faf9] border border-[#e3ece9] rounded-lg text-xs">
                      <div>
                        <span className="font-semibold text-[#102f38]">{exp.title || exp.category || "Expense"}</span>
                        {exp.notes && <span className="text-[10px] text-[#789092] block">{exp.notes}</span>}
                      </div>
                      <span className="font-bold text-[#b77825]">${Number(exp.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetPage({ trips }: any) {
  const [searchVal, setSearchVal] = useState("");

  const filteredTrips = trips.filter((t: any) =>
    t.name?.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <>
      <WireframeControlsBar searchVal={searchVal} setSearchVal={setSearchVal} />

      <div className="space-y-6">
        <div>
          <p className="eyebrow accent-text">Budget & Expenses</p>
          <h2 className="font-bold text-2xl text-[#102f38]">All Trip Budgets & Expenses</h2>
          <p className="text-xs text-[#789092] mt-1">Overview of activities, expenses, and budget status across all your trips.</p>
        </div>

        {trips.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-[#c2e2da] rounded-xl">
            <DollarSign className="mx-auto h-10 w-10 text-[#2ca999] mb-2" />
            <p className="text-sm font-semibold text-[#102f38]">No trips created yet.</p>
            <p className="text-xs text-[#789092] mt-1">Create a trip to view budget and activity expense breakdowns.</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#789092]">No trips matching "{searchVal}".</div>
        ) : (
          <div className="space-y-6">
            {filteredTrips.map((trip: any) => (
              <TripBudgetItem key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ----------------------------------------------------
// Screen 10: Community Tab Screen (Wireframe Screen 10)
// ----------------------------------------------------
function CommunityLive() {
  const { user, profile } = useAuth();
  const [searchVal, setSearchVal] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState("");

  const myFullName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : "Traveler";

  useEffect(() => {
    listCommunityPosts().then(setPosts).catch(console.error);
  }, []);

  const handlePost = async () => {
    if (!text.trim()) return;
    try {
      const newPost = await createCommunityPost(text.trim());
      const postWithProfile = {
        ...newPost,
        profiles: newPost.profiles || profile || {
          first_name: profile?.first_name || "Traveler",
          last_name: profile?.last_name || "",
          avatar_url: profile?.avatar_url || null,
        },
      };
      setPosts([postWithProfile, ...posts]);
      setText("");
      toast.success("Published!");
    } catch (err: any) {
      toast.error("Failed to post.");
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchVal.trim()) return true;
    const q = searchVal.toLowerCase();
    const author = p.profiles?.first_name
      ? `${p.profiles.first_name} ${p.profiles.last_name || ""}`.toLowerCase()
      : "explorer";
    return p.content?.toLowerCase().includes(q) || author.includes(q);
  });

  return (
    <>
      {/* Wireframe Controls Bar */}
      <WireframeControlsBar searchVal={searchVal} setSearchVal={setSearchVal} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-bold text-2xl text-[#102f38]">Community tab</h2>

          {/* Composer */}
          <div className="p-4 bg-white border border-[#e3ece9] rounded-xl flex gap-3 shadow-sm">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={myFullName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#2ca999]"
              />
            ) : (
              <div className="avatar small flex-shrink-0">{getInitials(myFullName)}</div>
            )}
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Share your travel experiences..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end">
                <Button className="primary-button text-xs" onClick={handlePost}>
                  Post
                </Button>
              </div>
            </div>
          </div>

          {/* Posts Stack */}
          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-[#c2e2da] rounded-xl text-xs text-[#789092]">
                No community posts match "{searchVal}".
              </div>
            ) : (
              filteredPosts.map((p, i) => {
                const isMyPost = Boolean(user?.id && p.user_id && p.user_id === user.id);

                const authorName = isMyPost
                  ? myFullName
                  : p.profiles?.first_name
                  ? `${p.profiles.first_name} ${p.profiles.last_name || ""}`.trim()
                  : "GlobeTrotter Explorer";

                const avatarUrl = isMyPost
                  ? profile?.avatar_url || p.profiles?.avatar_url
                  : p.profiles?.avatar_url;

                return (
                  <div key={p.id || i} className="p-4 bg-white border border-[#e3ece9] rounded-xl flex gap-3 shadow-sm">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={authorName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#2ca999]"
                      />
                    ) : (
                      <div className="avatar small flex-shrink-0">{getInitials(authorName)}</div>
                    )}
                    <div className="flex-1">
                      <b className="text-xs text-[#102f38] block">{authorName}</b>
                      <p className="text-xs text-[#4f6d6d] mt-1">{p.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side Explanatory Box (Screen 10 Wireframe) */}
        <div>
          <div className="p-5 bg-white border border-[#2ca999] rounded-xl shadow-sm text-xs text-[#102f38] space-y-2 sticky top-28">
            <h4 className="font-bold text-sm text-[#2ca999]">About Community Section</h4>
            <p className="text-[#587775] leading-relaxed">
              Community section where all the users can share their experience about a certain trip or activity. Using the search, group by or filter and sortby option, the user can narrow down the result that he is looking for...
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ----------------------------------------------------
// Calendar Page — real calendar showing trip date ranges
// ----------------------------------------------------
function CalendarPage({ trips }: any) {
  const today = new Date();
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [selectedTrip, setSelectedTrip] = useState<string>("all");

  const handleTripChange = (tripId: string) => {
    setSelectedTrip(tripId);
    if (tripId !== "all") {
      const matched = trips.find((t: any) => t.id === tripId);
      if (matched && matched.start_date) {
        const d = new Date(matched.start_date);
        if (!isNaN(d.getTime())) {
          setCurYear(d.getFullYear());
          setCurMonth(d.getMonth());
        }
      }
    }
  };

  const filtered = selectedTrip === "all" ? trips : trips.filter((t: any) => t.id === selectedTrip);

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const TRIP_COLORS = ["#2ca999", "#e0a657", "#af655b", "#467d9d", "#66c9bb", "#8b5cf6"];

  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

  function isTripDay(dayNum: number, trip: any) {
    if (!trip.start_date) return false;
    const day = new Date(curYear, curMonth, dayNum);
    const start = new Date(trip.start_date);
    const end = trip.end_date ? new Date(trip.end_date) : start;
    return day >= start && day <= end;
  }

  const tripColorMap: Record<string, string> = {};
  trips.forEach((t: any, i: number) => {
    tripColorMap[t.id] = TRIP_COLORS[i % TRIP_COLORS.length];
  });

  const calDays: number[] = [];
  for (let i = 0; i < firstDay; i++) calDays.push(0);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="eyebrow accent-text">Your Travel Calendar</p>
          <h2 className="font-bold text-2xl text-[#102f38]">{MONTH_NAMES[curMonth]} {curYear}</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="font-bold text-xs bg-white border border-[#c2e2da] rounded-md px-3 py-2 text-[#102f38]"
            value={selectedTrip}
            onChange={(e) => handleTripChange(e.target.value)}
          >
            <option value="all">All Trips</option>
            {trips.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button
            className="icon-button"
            onClick={() => { if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); } else setCurMonth(m => m - 1); }}
          ><ChevronLeft size={18} /></button>
          <button
            className="icon-button"
            onClick={() => { if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); } else setCurMonth(m => m + 1); }}
          ><ChevronRight size={18} /></button>
          <button
            className="text-xs font-semibold px-3 py-1.5 border border-[#c2e2da] rounded-md hover:bg-[#e1f1ed] text-[#527271]"
            onClick={() => { setCurYear(today.getFullYear()); setCurMonth(today.getMonth()); }}
          >Today</button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-[#e3ece9] rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-[#e3ece9]">
          {DAY_LABELS.map(d => <div key={d} className="py-2 text-center text-[10px] font-bold text-[#789092] uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {calDays.map((dayNum, idx) => {
            if (dayNum === 0) return <div key={`e-${idx}`} className="min-h-[90px] border-b border-r border-[#f0f5f3]" />;
            const isToday = dayNum === today.getDate() && curMonth === today.getMonth() && curYear === today.getFullYear();
            const dayTrips = filtered.filter((t: any) => isTripDay(dayNum, t));
            return (
              <div key={dayNum} className={`min-h-[90px] p-1.5 border-b border-r border-[#f0f5f3] ${isToday ? "bg-[#e8f8f5]" : ""}`}>
                <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#2ca999] text-white" : "text-[#72908d]"
                  }`}>{dayNum}</span>
                <div className="mt-1 space-y-0.5">
                  {dayTrips.map((t: any) => (
                    <div key={t.id} className="text-[9px] font-semibold px-1 py-0.5 rounded truncate text-white" style={{ backgroundColor: tripColorMap[t.id] }}>
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trip Legend */}
      {trips.length > 0 && (
        <div className="bg-white border border-[#e3ece9] rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-sm text-[#102f38] mb-3">Trip Legend</h4>
          <div className="flex flex-wrap gap-3">
            {trips.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 text-xs text-[#527271]">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tripColorMap[t.id] }} />
                <span className="font-semibold">{t.name}</span>
                {t.start_date && <span className="text-[#789092]">({t.start_date} → {t.end_date || "TBD"})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboardPage() {
  const { isAdmin } = useAuth();
  const [, navigate] = useLocation();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    getAdminAnalytics().then(setAnalytics).catch(console.error);
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-2xl text-[#102f38]">Admin Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{analytics?.totalUsers || 0}</div>
          <div className="stat-helper">Total Registered Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{analytics?.totalTrips || 0}</div>
          <div className="stat-helper">Total Created Trips</div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Main Home Container
// ----------------------------------------------------
export default function Home({ initialActive = "overview" }: { initialActive?: string }) {
  const [active, setActive] = useState(initialActive);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>("");
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/register");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      listTrips()
        .then((data) => {
          setTrips(data);
          if (data.length > 0 && !activeTripId) {
            setActiveTripId(data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const selectTripForDetails = (id: string) => {
    setActiveTripId(id);
  };

  const content = useMemo(() => {
    if (!user) return null;
    switch (active) {
      case "overview":
        return <Overview setActive={setActive} trips={trips} setTrips={setTrips} selectTripForDetails={selectTripForDetails} />;
      case "create_trip":
        return <CreateTripPage setActive={setActive} trips={trips} setTrips={setTrips} selectTripForDetails={selectTripForDetails} />;
      case "trips":
        return <Trips trips={trips} setTrips={setTrips} setActive={setActive} selectTripForDetails={selectTripForDetails} />;
      case "explore":
        return <ExploreLive setActive={setActive} trips={trips} setTrips={setTrips} selectTripForDetails={selectTripForDetails} />;
      case "itinerary":
        return <ItineraryPage trips={trips} activeTripId={activeTripId} setActiveTripId={setActiveTripId} setActive={setActive} />;
      case "itinerary_view":
      case "budget":
        return <BudgetPage trips={trips} />;
      case "calendar":
        return <CalendarPage trips={trips} />;
      case "community":
        return <CommunityLive />;
      case "analytics":
      case "admin":
        return <AdminDashboardPage />;
      case "settings":
        return <SettingsPage trips={trips} setActive={setActive} selectTripForDetails={selectTripForDetails} />;
      default:
        return <Overview setActive={setActive} trips={trips} setTrips={setTrips} selectTripForDetails={selectTripForDetails} />;
    }
  }, [active, trips, activeTripId, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d232a] text-[#2ca999]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#2ca999] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold tracking-wider uppercase text-gray-300">Loading GlobeTrotter...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}
      <main className="main-content">
        <Topbar setMobileOpen={setMobileOpen} active={active} setActive={setActive} />
        <div className="content-wrap">{content}</div>
      </main>
    </div>
  );
}
