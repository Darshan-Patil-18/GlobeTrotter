type GeoCity = {
  id: number;
  city: string;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
};

type TravelImage = {
  url: string;
  photographer: string;
  profileUrl: string;
};

const env = (key: string) => process.env[key] || "";

// Curated authentic database of popular Indian & Global destinations with authentic images
const DESTINATION_DATABASE: Array<{
  city: string;
  country: string;
  region: string;
  keywords: string[];
  image: string;
  lat: number;
  lon: number;
}> = [
  // Gujarat destinations
  {
    city: "Ahmedabad",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "ahmedabad", "amdavad", "sabarmati"],
    image: "https://images.unsplash.com/photo-1609946850021-3a9ec1a7f052?auto=format&fit=crop&w=900&q=80",
    lat: 23.0225,
    lon: 72.5714,
  },
  {
    city: "Gir National Park",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "gir", "lion", "wildlife", "sasangir"],
    image: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=900&q=80",
    lat: 21.1243,
    lon: 70.8242,
  },
  {
    city: "Rann of Kutch",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "kutch", "rann", "white desert", "bhuj"],
    image: "https://images.unsplash.com/photo-1627894006066-b45786537103?auto=format&fit=crop&w=900&q=80",
    lat: 23.8329,
    lon: 69.8335,
  },
  {
    city: "Statue of Unity (Kevadia)",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "statue of unity", "kevadia", "narmada"],
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80",
    lat: 21.838,
    lon: 73.7191,
  },
  {
    city: "Surat",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "surat", "diamond city", "tapi"],
    image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=80",
    lat: 21.1702,
    lon: 72.8311,
  },
  {
    city: "Vadodara",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "vadodara", "baroda", "laxmi vilas palace"],
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=900&q=80",
    lat: 22.3072,
    lon: 73.1812,
  },
  {
    city: "Dwarka",
    country: "India",
    region: "Gujarat",
    keywords: ["gujarat", "guj", "dwarka", "temple", "dwarkadhish"],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    lat: 22.2442,
    lon: 68.9685,
  },
  // Indian Popular Cities
  {
    city: "Jaipur",
    country: "India",
    region: "Rajasthan",
    keywords: ["jaipur", "pink city", "rajasthan", "india"],
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80",
    lat: 26.9124,
    lon: 75.7873,
  },
  {
    city: "Goa",
    country: "India",
    region: "Goa",
    keywords: ["goa", "beach", "india"],
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
    lat: 15.2993,
    lon: 74.124,
  },
  {
    city: "Mumbai",
    country: "India",
    region: "Maharashtra",
    keywords: ["mumbai", "bombay", "maharashtra", "india"],
    image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=900&q=80",
    lat: 18.922,
    lon: 72.8347,
  },
  {
    city: "Udaipur",
    country: "India",
    region: "Rajasthan",
    keywords: ["udaipur", "city of lakes", "rajasthan"],
    image: "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=900&q=80",
    lat: 24.5854,
    lon: 73.7125,
  },
  // Global Destinations
  {
    city: "Lisbon",
    country: "Portugal",
    region: "Lisbon Coast",
    keywords: ["lisbon", "portugal", "europe"],
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=80",
    lat: 38.7223,
    lon: -9.1393,
  },
  {
    city: "Kyoto",
    country: "Japan",
    region: "Kansai",
    keywords: ["kyoto", "japan", "asia"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
    lat: 35.0116,
    lon: 135.7681,
  },
  {
    city: "Reykjavik",
    country: "Iceland",
    region: "Capital Region",
    keywords: ["reykjavik", "iceland", "nordic"],
    image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=900&q=80",
    lat: 64.1466,
    lon: -21.9426,
  },
  {
    city: "Rome",
    country: "Italy",
    region: "Lazio",
    keywords: ["rome", "italy", "europe"],
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=80",
    lat: 41.9028,
    lon: 12.4964,
  },
  {
    city: "Paris",
    country: "France",
    region: "Île-de-France",
    keywords: ["paris", "france", "eiffel"],
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    city: "Tokyo",
    country: "Japan",
    region: "Kanto",
    keywords: ["tokyo", "japan", "asia"],
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80",
    lat: 35.6762,
    lon: 139.6503,
  },
];

export async function searchCities(query: string): Promise<GeoCity[]> {
  const q = query.trim().toLowerCase();
  if (!q) return DESTINATION_DATABASE.slice(0, 8).map((d, i) => ({
    id: i + 1,
    city: d.city,
    country: d.country,
    region: d.region,
    latitude: d.lat,
    longitude: d.lon,
    image: d.image,
  }));

  // Match local curated database first for instant accurate results
  const localMatches = DESTINATION_DATABASE.filter(
    (d) =>
      d.city.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.keywords.some((k) => k.includes(q) || q.includes(k))
  ).map((d, i) => ({
    id: i + 100,
    city: d.city,
    country: d.country,
    region: d.region,
    latitude: d.lat,
    longitude: d.lon,
    image: d.image,
  }));

  const key = env("GEODB_API_KEY");
  const host = env("GEODB_API_HOST");
  if (!key || !host) return localMatches;

  try {
    const url = new URL(`https://${host}/v1/geo/cities`);
    url.searchParams.set("namePrefix", q);
    url.searchParams.set("limit", "10");
    url.searchParams.set("sort", "-population");

    const response = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
    });
    if (!response.ok) return localMatches;

    const json = (await response.json()) as { data?: GeoCity[] };
    const apiCities = json.data || [];

    // Merge API cities with local matches (avoid duplicates)
    const existingNames = new Set(localMatches.map((m) => m.city.toLowerCase()));
    for (const c of apiCities) {
      if (!existingNames.has(c.city.toLowerCase())) {
        localMatches.push(c);
      }
    }
    return localMatches;
  } catch {
    return localMatches;
  }
}

export async function searchPlaces(lat: number, lon: number, query = "") {
  const key = env("OPENTRIPMAP_API_KEY");
  if (!key) return [];
  try {
    const url = new URL("https://api.opentripmap.com/0.1/en/places/radius");
    url.searchParams.set("radius", "10000");
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("limit", "20");
    url.searchParams.set("format", "json");
    url.searchParams.set("apikey", key);
    if (query) url.searchParams.set("name", query);

    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function searchUnsplash(query: string): Promise<TravelImage[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Check matching local image first
  const match = DESTINATION_DATABASE.find(
    (d) => d.city.toLowerCase().includes(q) || d.keywords.some((k) => k.includes(q))
  );

  const localImages: TravelImage[] = match
    ? [
        {
          url: match.image,
          photographer: "GlobeTrotter Collection",
          profileUrl: "https://unsplash.com",
        },
      ]
    : [];

  const key = env("UNSPLASH_ACCESS_KEY");
  if (!key || key === "your_unsplash_key_here") return localImages;

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", q);
    url.searchParams.set("per_page", "10");

    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
    });
    if (!response.ok) return localImages;

    const json = (await response.json()) as {
      results?: Array<{
        urls?: { regular?: string };
        user?: { name?: string; links?: { html?: string } };
      }>;
    };

    const fetched = (json.results || []).flatMap((item) =>
      item.urls?.regular
        ? [
            {
              url: item.urls.regular,
              photographer: item.user?.name || "Unsplash contributor",
              profileUrl: item.user?.links?.html || "https://unsplash.com",
            },
          ]
        : []
    );

    return fetched.length > 0 ? fetched : localImages;
  } catch {
    return localImages;
  }
}
