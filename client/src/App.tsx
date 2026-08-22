import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import PublicSharePage from "./pages/PublicSharePage";
import AdminRoute from "./pages/AdminRoute";
import AuthGuard from "./components/AuthGuard";

function Router() {
  return (
    <Switch>
      <Route path="/"><AuthGuard><Home initialActive="overview" /></AuthGuard></Route>
      <Route path="/trips"><AuthGuard><Home initialActive="trips" /></AuthGuard></Route>
      <Route path="/explore"><AuthGuard><Home initialActive="explore" /></AuthGuard></Route>
      <Route path="/itinerary"><AuthGuard><Home initialActive="itinerary" /></AuthGuard></Route>
      <Route path="/calendar"><AuthGuard><Home initialActive="calendar" /></AuthGuard></Route>
      <Route path="/community"><AuthGuard><Home initialActive="community" /></AuthGuard></Route>
      <Route path="/analytics"><AdminRoute /></Route>
      <Route path="/admin"><AdminRoute /></Route>
      <Route path="/settings"><AuthGuard><Home initialActive="settings" /></AuthGuard></Route>
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}