import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    const check = async () => {
      if (!supabase) {
        if (active) { setAllowed(true); setChecking(false); }
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) { navigate("/login"); return; }
      setAllowed(true);
      setChecking(false);
    };

    check();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    }) ?? { data: null };

    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, [navigate]);

  if (checking || !allowed) return <div className="route-loading">Checking your session…</div>;
  return <>{children}</>;
}