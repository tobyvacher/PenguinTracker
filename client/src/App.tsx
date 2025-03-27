import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Map from "@/pages/Map";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/map" component={Map} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Log environment variables (without values) to help with debugging
  console.log("Environment variables present:", {
    VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_APP_ID: !!import.meta.env.VITE_FIREBASE_APP_ID,
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
