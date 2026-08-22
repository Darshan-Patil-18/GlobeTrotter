import { useEffect } from "react";
import { useLocation } from "wouter";
import Home from "./Home";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRoute() {
  const [, navigate] = useLocation();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f8f7] text-[#527271]">
        <div className="text-center">
          <div className="mb-2 text-lg font-semibold">Verifying admin permissions…</div>
          <div className="text-xs text-muted-foreground">GlobeTrotter Security Guard</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <Home initialActive="analytics" />;
}
