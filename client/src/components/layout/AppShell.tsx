import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { PwaInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { useAppSettings } from "@/components/AppContext";
import qzTray from "@/lib/qz-tray";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qzTrayConnected, setQzTrayConnected] = useState(false);
  const { settings } = useAppSettings();

  // Inicializar QZ Tray cuando el componente se monta
  useEffect(() => {
    const initializeQzTray = async () => {
      try {
        console.log("Intentando inicializar QZ Tray...");
        const success = await qzTray.initQzTray();
        setQzTrayConnected(success);
        console.log(`Inicialización de QZ Tray ${success ? 'exitosa' : 'fallida'}`);
      } catch (error) {
        console.error("Error al inicializar QZ Tray:", error);
        setQzTrayConnected(false);
      }
    };

    initializeQzTray();

    // Reintentar la conexión cada 30 segundos si no está conectado
    const interval = setInterval(() => {
      if (!qzTray.isQzTrayActive()) {
        console.log("Reintentando conexión con QZ Tray...");
        initializeQzTray();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Actualizar el título del documento cuando cambia el nombre de la empresa
  useEffect(() => {
    if (settings?.companyName) {
      document.title = settings.companyName;
    }
  }, [settings?.companyName]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;