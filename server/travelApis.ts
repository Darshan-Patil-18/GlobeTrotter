type GeoCity = { id: number; city: string; country: string; region?: string; latitude?: number; longitude?: number };
type TravelImage = { url: string; photographer: string; profileUrl: string };

const env = (key: string) => process.env[key] || "";

export async function searchCities(query: string): Promise<GeoCity[]> {
  const key = env("GEODB_API_KEY"); const host = env("GEODB_API_HOST");
  if (!key || !host || !query.trim()) return [];
  const url = new URL(`https://${host}/v1/geo/cities`); url.searchParams.set("namePrefix", query.trim()); url.searchParams.set("limit", "10"); url.searchParams.set("sort", "-population");
  const response = await fetch(url, { headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host } });
  if (!response.ok) throw new Error(`GeoDB request failed: ${response.status}`);
  const json = await response.json() as { data?: GeoCity[] }; return json.data || [];
}

export async function searchPlaces(lat: number, lon: number, query = "") {
  const key = env("OPENTRIPMAP_API_KEY"); if (!key) return [];
  const url = new URL("https://api.opentripmap.com/0.1/en/places/radius"); url.searchParams.set("radius", "10000"); url.searchParams.set("lon", String(lon)); url.searchParams.set("lat", String(lat)); url.searchParams.set("limit", "20"); url.searchParams.set("format", "json"); url.searchParams.set("apikey", key);
  if (query) url.searchParams.set("name", query);
  const response = await fetch(url); if (!response.ok) throw new Error(`OpenTripMap request failed: ${response.status}`); return await response.json();
}

export async function searchUnsplash(query: string): Promise<TravelImage[]> {
  const key = env("UNSPLASH_ACCESS_KEY"); if (!key || !query.trim()) return [];
  const url = new URL("https://api.unsplash.com/search/photos"); url.searchParams.set("query", query.trim()); url.searchParams.set("per_page", "10");
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } }); if (!response.ok) throw new Error(`Unsplash request failed: ${response.status}`);
  const json = await response.json() as { results?: Array<{ urls?: { regular?: string }; user?: { name?: string; links?: { html?: string } } }> };
  return (json.results || []).flatMap(item => item.urls?.regular ? [{ url: item.urls.regular, photographer: item.user?.name || "Unsplash contributor", profileUrl: item.user?.links?.html || "https://unsplash.com" }] : []);
}
