import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Map from "@/pages/map";
import Favorites from "@/pages/favorites";
import History from "@/pages/history";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/map" component={Map} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Add tailwind classes to body to match design
  useEffect(() => {
    document.body.classList.add(
      "font-sans", 
      "antialiased", 
      "bg-gray-50", 
      "min-h-screen"
    );
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
