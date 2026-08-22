import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Home from "./Home";
import { supabase } from "@/lib/supabase";

export default function AdminRoute() { const [, navigate] = useLocation(); const [allowed, setAllowed] = useState(false); const [checking, setChecking] = useState(true); useEffect(() => { let active = true; const check = async () => { if (!supabase) { navigate("/"); return; } const { data: auth } = await supabase.auth.getUser(); if (!auth.user) { navigate("/login"); return; } const { data: profile } = await supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle(); if (!active) return; if (profile?.role === "admin") setAllowed(true); else navigate("/"); setChecking(false); }; check(); return () => { active = false; }; }, [navigate]); if (checking || !allowed) return <div className="route-loading">Checking access…</div>; return <Home initialActive="analytics" />; }
