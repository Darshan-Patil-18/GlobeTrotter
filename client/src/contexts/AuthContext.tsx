import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  additional_info: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at?: string;
  saved_destinations?: Array<{ city: string; country: string; image?: string }>;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (currentUser: User) => {
    if (!supabase) return;

    // Set fallback profile immediately based on user session metadata
    const fallbackProfile: UserProfile = {
      id: currentUser.id,
      first_name: currentUser.user_metadata?.first_name || currentUser.email?.split("@")[0] || "Traveler",
      last_name: currentUser.user_metadata?.last_name || "",
      phone: null,
      city: null,
      country: null,
      additional_info: null,
      avatar_url: currentUser.user_metadata?.avatar_url || null,
      role: currentUser.email === "admin123@gmail.com" ? "admin" : "user",
    };

    setProfile(fallbackProfile);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as UserProfile);
      } else if (!data) {
        // Attempt creating profile row in Supabase database
        const { data: created } = await supabase
          .from("profiles")
          .upsert({
            id: currentUser.id,
            first_name: fallbackProfile.first_name,
            last_name: fallbackProfile.last_name,
            role: fallbackProfile.role,
          } as any)
          .select()
          .single();

        if (created) setProfile(created as UserProfile);
      }
    } catch (e) {
      console.warn("Profile fetch notice:", e);
    }
  };

  const refreshProfile = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user);
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted && data.user) {
          setUser(data.user);
          await fetchProfile(data.user);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        if (authListener?.subscription) {
          authListener.subscription.unsubscribe();
        }
      };
    }
  }, []);

  const isAdmin = profile?.role === "admin" || user?.email === "admin123@gmail.com";

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
