import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import PublicSharePage from "./pages/PublicSharePage";
import AdminRoute from "./pages/AdminRoute";

function Router() {
  return (
    <Switch>
      <Route path="/"><Home initialActive="overview" /></Route>
      <Route path="/trips"><Home initialActive="trips" /></Route>
      <Route path="/explore"><Home initialActive="explore" /></Route>
      <Route path="/itinerary"><Home initialActive="itinerary" /></Route>
      <Route path="/itinerary/:id"><Home initialActive="itinerary" /></Route>
      <Route path="/budget"><Home initialActive="budget" /></Route>
      <Route path="/calendar"><Home initialActive="calendar" /></Route>
      <Route path="/community"><Home initialActive="community" /></Route>
      <Route path="/analytics"><AdminRoute /></Route>
      <Route path="/admin"><AdminRoute /></Route>
      <Route path="/settings"><Home initialActive="settings" /></Route>
      <Route path="/login"><AuthPage mode="login" /></Route>
      <Route path="/register"><AuthPage mode="register" /></Route>
      <Route path="/forgot"><AuthPage mode="forgot" /></Route>
      <Route path="/reset"><AuthPage mode="reset" /></Route>
      <Route path="/share/:id"><PublicSharePage /></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
