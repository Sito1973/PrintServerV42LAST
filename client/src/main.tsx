import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppProvider } from "@/components/AppContext";
import { registerServiceWorker } from "./pwa-register";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <App />
        <Toaster />
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Registrar el Service Worker para habilitar funcionalidades PWA
registerServiceWorker();
