import React, { useEffect, useContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppProvider } from "@/components/AppContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { printService } from "@/services/PrintService";
import { AuthContext } from "@/components/auth/AuthProvider";

import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Printers from "@/pages/Printers";
import PrintJobs from "@/pages/PrintJobs";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";
import ApiDocs from "@/pages/ApiDocs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Componente interno que maneja el servicio de impresión
const PrintServiceInitializer: React.FC = () => {
  const auth = useContext(AuthContext);
  const { isAuthenticated, apiKey } = auth;
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePrintService = async () => {
      console.log("🚀 ========== INICIALIZANDO PRINTSERVICE (PUNTO ÚNICO) ==========");
      console.log("⚡ Esta es la ÚNICA inicialización activa del sistema");

      // Inicializar PrintService SOLO cuando el usuario está autenticado Y la API key está disponible
      if (!isInitialized && isAuthenticated && apiKey) {
        console.log("🔑 Usuario autenticado con API key disponible, inicializando PrintService...");
        printService.initialize();
        setIsInitialized(true);
        printService.startKeepAlive();
      } else if (!isAuthenticated || !apiKey) {
        console.log("⚠️ Esperando autenticación completa para inicializar PrintService...");
        console.log(`   - Autenticado: ${isAuthenticated}`);
        console.log(`   - API Key: ${apiKey ? 'Disponible' : 'No disponible'}`);
      }
    };

    // Solo ejecutar si el estado de autenticación ya se ha determinado
    if (isAuthenticated !== undefined) {
      initializePrintService();
    }
  }, [isAuthenticated, apiKey, isInitialized]); // Ejecutar cuando cambie el estado de autenticación

  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <PrintServiceInitializer />
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Dashboard />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/printers"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Printers />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/print-jobs"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <PrintJobs />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AppShell>
                        <Users />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AppShell>
                        <Settings />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/api-docs"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <ApiDocs />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={<ProtectedRoute redirectTo="/dashboard"><AppShell><Dashboard /></AppShell></ProtectedRoute>}
                />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <NotFound />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster />
              <ReactQueryDevtools />
            </div>
          </Router>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;