import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Copy, Facebook, MapPin, Share2, Compass, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { copySharedTrip } from "@/lib/globetrotterData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const fallbackStops = [
  { city_name: "Kyoto", start_date: "Apr 12 – 16", activities: ["Fushimi Inari Shrine", "Nishiki Market", "Arashiyama bamboo grove"] },
  { city_name: "Osaka", start_date: "Apr 16 – 19", activities: ["Dotonbori food walk", "Osaka Castle", "Umeda Sky Building"] },
  { city_name: "Tokyo", start_date: "Apr 19 – 22", activities: ["Shibuya crossing", "teamLab Borderless", "Tsukiji Outer Market"] }
];

export default function PublicSharePage() {
  const [, params] = useRoute("/share/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyTripAction = async () => {
    if (!user) {
      toast.info("Please sign in to copy this itinerary to your account.");
      navigate("/login");
      return;
    }
    if (!params?.id || params.id === "demo") {
      toast.info("Demo itinerary copied to your account concept.");
      return;
    }
    try {
      const created = await copySharedTrip(params.id);
      toast.success(`"${created.name}" was copied to your trips!`);
      navigate(`/itinerary/${created.id}`);
    } catch (error: any) {
      toast.error(error.message || "Could not copy this trip.");
    }
  };

  const shareTrip = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: trip?.name || "GlobeTrotter Itinerary", url: window.location.href });
      } else {
        await navigator.clipboard?.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Public link copied to clipboard!");
      }
    } catch {
      /* user cancelled native share */
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!supabase || !params?.id || params.id === "demo") {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("*, profiles:user_id(first_name, last_name, avatar_url), trip_stops(*, activities(*))")
          .eq("id", params.id)
          .single();

        if (!error && data) {
          setTrip(data);
        } else {
          // Fallback to view
          const { data: viewData } = await supabase
            .from("public_shared_itineraries")
            .select("*")
            .eq("trip_id", params.id)
            .order("order_index");

          if (viewData?.length) {
            setTrip({
              id: params.id,
              name: viewData[0].name,
              start_date: viewData[0].start_date,
              end_date: viewData[0].end_date,
              description: viewData[0].description,
              cover_photo_url: viewData[0].cover_photo_url,
              trip_stops: viewData.reduce((acc: any[], row: any) => {
                let stop = acc.find(s => s.city_name === row.city_name);
                if (!stop) {
                  stop = {
                    city_name: row.city_name,
                    country: row.country,
                    start_date: row.stop_start_date,
                    end_date: row.stop_end_date,
                    activities: [],
                  };
                  acc.push(stop);
                }
                if (row.activity_name) {
                  stop.activities.push({ name: row.activity_name, description: row.activity_description });
                }
                return acc;
              }, []),
            });
          }
        }
      } catch (err) {
        console.error("Error loading public trip:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id]);

  const authorName = trip?.profiles
    ? `${trip.profiles.first_name || ""} ${trip.profiles.last_name || ""}`.trim() || "GlobeTrotter Traveler"
    : "GlobeTrotter Traveler";

  const stops = trip?.trip_stops?.length ? trip.trip_stops : fallbackStops;

  return (
    <div className="public-share">
      <div className="public-nav">
        <div className="brand">
          <span className="brand-mark">
            <Compass size={19} />
          </span>
          <span>
            globe<span>trotter</span>
          </span>
        </div>
        <Button variant="outline" onClick={copyTripAction}>
          <Copy size={15} /> Copy trip
        </Button>
      </div>

      <div className="public-hero">
        {trip?.cover_photo_url && (
          <img className="w-full max-h-64 object-cover rounded-xl mb-6 shadow-md" src={trip.cover_photo_url} alt={trip.name} />
        )}
        <p className="eyebrow accent-text">{authorName}’s Itinerary</p>
        <h1>{trip?.name || "Shared Travel Itinerary"}</h1>
        <p>{trip?.description || "Explore this customized multi-city travel itinerary created on GlobeTrotter."}</p>
        
        <div className="public-actions">
          <Button className="primary-button" onClick={copyTripAction}>
            <Copy size={16} /> Copy this trip to your workspace
          </Button>
          <Button variant="outline" onClick={shareTrip}>
            {copied ? <Check size={15} /> : <Share2 size={15} />} {copied ? "Copied!" : "Share link"}
          </Button>
        </div>
      </div>

      <div className="public-stops">
        {stops.map((stop: any, index: number) => (
          <article key={stop.id || stop.city_name || index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="eyebrow">
                {stop.start_date || stop.stop_start_date || "Flexible Dates"}
                {stop.end_date ? ` – ${stop.end_date}` : ""}
              </p>
              <h2>{stop.city_name || stop.city}</h2>
              {stop.country && <div className="text-xs text-muted-foreground mb-2">{stop.country}</div>}
              
              <div className="space-y-1.5 mt-3">
                {Array.isArray(stop.activities) && stop.activities.length > 0 ? (
                  stop.activities.map((act: any, ai: number) => (
                    <div key={ai} className="text-sm text-[#4f6d6d] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2ca999]" />
                      <span>{typeof act === "string" ? act : act.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">No activities listed for this stop.</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="public-footer">
        <span>Shared via GlobeTrotter — Empowering Personalized Travel Planning</span>
        <span>
          <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this trip itinerary: ${trip?.name || "GlobeTrotter"}`)}&url=${encodeURIComponent(window.location.href)}`, "_blank")}>
            <Share2 size={15} />
          </button>
        </span>
      </div>
    </div>
  );
}
