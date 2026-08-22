import { supabase } from "./supabase";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function currentUserId() {
  const { data, error } = await requireClient().auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function listTrips() {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await client
    .from("trips")
    .select("*, trip_stops(count), expenses(amount)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing trips:", error);
    throw error;
  }
  return data || [];
}

export async function getTripDetails(tripId: string) {
  const client = requireClient();
  const { data: trip, error: tripErr } = await client
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();

  if (tripErr) throw tripErr;

  const { data: stops, error: stopsErr } = await client
    .from("trip_stops")
    .select("*, activities(*)")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });

  if (stopsErr) throw stopsErr;

  const { data: expenses, error: expErr } = await client
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId);

  if (expErr) throw expErr;

  return {
    ...trip,
    stops: stops || [],
    expenses: expenses || [],
  };
}

export async function createTrip(input: {
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  cover_photo_url?: string;
  budget?: number;
  is_public?: boolean;
}) {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("Please sign in to create a trip.");

  const { data, error } = await client
    .from("trips")
    .insert({
      user_id: userId,
      name: input.name,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      description: input.description || null,
      cover_photo_url: input.cover_photo_url || null,
      budget: input.budget || 0,
      is_public: input.is_public || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrip(id: string, input: Record<string, unknown>) {
  const client = requireClient();
  const { data, error } = await client
    .from("trips")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrip(id: string) {
  const client = requireClient();
  const { error } = await client.from("trips").delete().eq("id", id);
  if (error) throw error;
}

export async function listStops(tripId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("trip_stops")
    .select("*, activities(*)")
    .eq("trip_id", tripId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addStop(input: {
  trip_id: string;
  city_name: string;
  country?: string;
  lat?: number;
  lon?: number;
  start_date?: string;
  end_date?: string;
  order_index?: number;
}) {
  const client = requireClient();

  // If order_index not provided, get max + 1
  let index = input.order_index;
  if (index === undefined) {
    const { data: existing } = await client
      .from("trip_stops")
      .select("order_index")
      .eq("trip_id", input.trip_id)
      .order("order_index", { ascending: false })
      .limit(1);
    index = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
  }

  const { data, error } = await client
    .from("trip_stops")
    .insert({
      trip_id: input.trip_id,
      city_name: input.city_name,
      country: input.country || null,
      lat: input.lat || null,
      lon: input.lon || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      order_index: index,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStop(id: string, input: Record<string, unknown>) {
  const client = requireClient();
  const { data, error } = await client
    .from("trip_stops")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStop(id: string) {
  const client = requireClient();
  const { error } = await client.from("trip_stops").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderStops(tripId: string, orderedStopIds: string[]) {
  const client = requireClient();
  const updates = orderedStopIds.map((id, index) =>
    client.from("trip_stops").update({ order_index: index }).eq("id", id)
  );
  await Promise.all(updates);
}

export async function addActivity(input: {
  trip_stop_id: string;
  name: string;
  category?: string;
  cost?: number;
  day_number?: number;
  time?: string;
  image_url?: string;
  description?: string;
}) {
  const client = requireClient();
  const { data, error } = await client
    .from("activities")
    .insert({
      trip_stop_id: input.trip_stop_id,
      name: input.name,
      category: input.category || "Sightseeing",
      cost: input.cost || 0,
      day_number: input.day_number || 1,
      time: input.time || "10:00 AM",
      image_url: input.image_url || null,
      description: input.description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateActivity(id: string, input: Record<string, unknown>) {
  const client = requireClient();
  const { data, error } = await client
    .from("activities")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteActivity(id: string) {
  const client = requireClient();
  const { error } = await client.from("activities").delete().eq("id", id);
  if (error) throw error;
}

export async function listExpenses(tripId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId);

  if (error) throw error;
  return data || [];
}

export async function addExpense(input: {
  trip_id: string;
  category: "transport" | "stay" | "activities" | "meals";
  amount: number;
}) {
  const client = requireClient();
  const { data, error } = await client
    .from("expenses")
    .insert({
      trip_id: input.trip_id,
      category: input.category,
      amount: input.amount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const client = requireClient();
  const { error } = await client.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

export async function listCommunityPosts() {
  const client = requireClient();
  const { data: posts, error } = await client
    .from("community_posts")
    .select("*, profiles:user_id(first_name, last_name, avatar_url), trips:trip_id(name)")
    .order("created_at", { ascending: false });

  let rawPosts = posts || [];

  if (error || rawPosts.length === 0) {
    const { data: fallback } = await client
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });
    rawPosts = fallback || [];
  }

  if (rawPosts.length === 0) return [];

  // Fetch missing profiles manually if join was empty or null
  const missingUserIds = Array.from(
    new Set(
      rawPosts
        .filter((p: any) => !p.profiles || !p.profiles?.first_name)
        .map((p: any) => p.user_id)
        .filter(Boolean)
    )
  );

  if (missingUserIds.length > 0) {
    const { data: profs } = await client
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", missingUserIds);

    const profMap: Record<string, any> = {};
    (profs || []).forEach((pr: any) => {
      profMap[pr.id] = pr;
    });

    return rawPosts.map((p: any) => ({
      ...p,
      profiles: p.profiles || profMap[p.user_id] || null,
    }));
  }

  return rawPosts;
}

export async function createCommunityPost(content: string, tripId?: string) {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("Please sign in to post to community.");

  const { data: inserted, error } = await client
    .from("community_posts")
    .insert({
      user_id: userId,
      content,
      trip_id: tripId || null,
    })
    .select("*, profiles:user_id(first_name, last_name, avatar_url)")
    .single();

  let post = inserted;

  if (error || !post) {
    const { data: fallback, error: err2 } = await client
      .from("community_posts")
      .insert({
        user_id: userId,
        content,
        trip_id: tripId || null,
      })
      .select()
      .single();

    if (err2) throw err2;
    post = fallback;
  }

  if (post && (!post.profiles || !post.profiles.first_name)) {
    const { data: userProf } = await client
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    post = {
      ...post,
      profiles: userProf || null,
    };
  }

  return post;
}

export async function uploadTripCover(file: File, tripId: string) {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("Please sign in first.");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${tripId}-${Date.now()}.${ext}`;

  const { error } = await client.storage
    .from("trip-covers")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  const { data } = client.storage.from("trip-covers").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(file: File) {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("Please sign in first.");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await client.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;
  const { data } = client.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAccountData() {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("Please sign in first.");

  // Delete user's trips (cascades stops/activities/expenses if configured)
  const { error: tripError } = await client.from("trips").delete().eq("user_id", userId);
  if (tripError) console.error("Trip delete error:", tripError);

  // Delete user profile
  const { error: profileError } = await client.from("profiles").delete().eq("id", userId);
  if (profileError) console.error("Profile delete error:", profileError);

  // Sign out
  await client.auth.signOut();
}

export async function copySharedTrip(tripId: string) {
  const client = requireClient();
  const userId = await currentUserId();
  if (!userId) throw new Error("Please sign in to copy this trip.");

  // Fetch target trip
  const { data: sourceTrip, error: tErr } = await client
    .from("trips")
    .select("*, trip_stops(*, activities(*))")
    .eq("id", tripId)
    .single();

  if (tErr || !sourceTrip) {
    throw new Error("Shared itinerary is no longer available.");
  }

  // Create new trip for current user
  const { data: newTrip, error: createErr } = await client
    .from("trips")
    .insert({
      user_id: userId,
      name: `${sourceTrip.name} (Copy)`,
      start_date: sourceTrip.start_date,
      end_date: sourceTrip.end_date,
      description: sourceTrip.description,
      cover_photo_url: sourceTrip.cover_photo_url,
      budget: sourceTrip.budget || 0,
      is_public: false,
    })
    .select()
    .single();

  if (createErr || !newTrip) throw createErr || new Error("Failed to copy trip.");

  // Copy stops & activities
  if (sourceTrip.trip_stops && sourceTrip.trip_stops.length > 0) {
    for (const stop of sourceTrip.trip_stops) {
      const { data: newStop, error: stopErr } = await client
        .from("trip_stops")
        .insert({
          trip_id: newTrip.id,
          city_name: stop.city_name,
          country: stop.country,
          lat: stop.lat,
          lon: stop.lon,
          start_date: stop.start_date,
          end_date: stop.end_date,
          order_index: stop.order_index,
        })
        .select()
        .single();

      if (!stopErr && newStop && stop.activities && stop.activities.length > 0) {
        const newActivities = stop.activities.map((act: any) => ({
          trip_stop_id: newStop.id,
          name: act.name,
          category: act.category,
          cost: act.cost,
          day_number: act.day_number,
          time: act.time,
          image_url: act.image_url,
          description: act.description,
        }));
        await client.from("activities").insert(newActivities);
      }
    }
  }

  return newTrip;
}

export async function listAdminUsers() {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function toggleUserRole(userId: string, currentRole: string) {
  const client = requireClient();
  const nextRole = currentRole === "admin" ? "user" : "admin";
  const { data, error } = await client
    .from("profiles")
    .update({ role: nextRole })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminAnalytics() {
  const client = requireClient();
  // Fetch profiles, trips, stops, activities
  const [usersRes, tripsRes, stopsRes, activitiesRes] = await Promise.all([
    client.from("profiles").select("id, created_at, city, country, role"),
    client.from("trips").select("id, created_at, user_id, name"),
    client.from("trip_stops").select("city_name, country"),
    client.from("activities").select("name, category, cost"),
  ]);

  const users = usersRes.data || [];
  const trips = tripsRes.data || [];
  const stops = stopsRes.data || [];
  const activities = activitiesRes.data || [];

  // Aggregate popular cities
  const cityCounts: Record<string, number> = {};
  stops.forEach(s => {
    if (s.city_name) {
      cityCounts[s.city_name] = (cityCounts[s.city_name] || 0) + 1;
    }
  });
  const popularCities = Object.entries(cityCounts)
    .map(([city_name, stop_count]) => ({ city_name, stop_count }))
    .sort((a, b) => b.stop_count - a.stop_count)
    .slice(0, 5);

  // Aggregate popular activities
  const actCounts: Record<string, number> = {};
  activities.forEach(a => {
    if (a.name) {
      actCounts[a.name] = (actCounts[a.name] || 0) + 1;
    }
  });
  const popularActivities = Object.entries(actCounts)
    .map(([name, activity_count]) => ({ name, activity_count }))
    .sort((a, b) => b.activity_count - a.activity_count)
    .slice(0, 5);

  return {
    totalUsers: users.length,
    totalTrips: trips.length,
    totalStops: stops.length,
    totalActivities: activities.length,
    popularCities,
    popularActivities,
    users,
    trips,
  };
}
