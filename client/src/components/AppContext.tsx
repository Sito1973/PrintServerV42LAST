// client/src/components/AppContext.tsx - VERSIÓN LIMPIA SIN EMPRESAS/SEDES

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import qzTray from '@/lib/qz-tray';

// Configuraciones generales de la aplicación (SIN empresas/sedes)
interface AppSettings {
  companyName: string;
  adminEmail: string;
  enableNotifications: boolean;
  // Otras configuraciones que NO sean empresas/sedes
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  autoConnectQzTray: boolean;
}

interface AppContextType {
  // Estados de autenticación y QZ Tray
  isAuthenticated: boolean;
  qzTrayConnected: boolean;
  availablePrinters: string[];

  // Funciones QZ Tray
  initializeQzTray: () => Promise<boolean>;
  refreshPrinters: () => Promise<void>;

  // Configuraciones generales
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [qzTrayConnected, setQzTrayConnected] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  // Estado de configuraciones generales (SIN empresas/sedes)
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'PrinterHub',
    adminEmail: '',
    enableNotifications: false,
    theme: 'system',
    language: 'es',
    autoConnectQzTray: true,
  });

  // Función para actualizar configuraciones generales
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Guardar solo configuraciones generales en localStorage
    localStorage.setItem('app_general_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Configuración actualizada",
      description: "Los cambios han sido guardados exitosamente.",
    });
  };

  // Cargar configuraciones desde localStorage al inicializar
  useEffect(() => {
    const savedSettings = localStorage.getItem('app_general_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error al cargar configuraciones guardadas:', error);
      }
    }
  }, []);

  // Configurar función global de toast
  useEffect(() => {
    (window as any).showGlobalToast = toast;
    return () => {
      delete (window as any).showGlobalToast;
    };
  }, [toast]);

  // Inicializar QZ Tray (sin polling)
  const initializeQzTray = async (): Promise<boolean> => {
    try {
      console.log("🚀 Inicializando QZ Tray...");

      const connected = await qzTray.initQzTray({
        polling: false, // Deshabilitado por defecto
        onPrinterListChanged: (printers: string[]) => {
          setAvailablePrinters(printers);
        }
      });

      setQzTrayConnected(connected);

      if (connected) {
        console.log("✅ QZ Tray conectado exitosamente");
        toast({
          title: "QZ Tray Conectado",
          description: "La conexión con QZ Tray ha sido establecida exitosamente.",
        });

        // Obtener lista inicial de impresoras
        await refreshPrinters();
      } else {
        console.log("❌ No se pudo conectar a QZ Tray");
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar a QZ Tray. Verifica que esté instalado y funcionando.",
          variant: "destructive",
        });
      }

      return connected;
    } catch (error) {
      console.error("❌ Error al inicializar QZ Tray:", error);
      setQzTrayConnected(false);
      toast({
        title: "Error de QZ Tray",
        description: "Ocurrió un error al conectar con QZ Tray.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Refrescar lista de impresoras
  const refreshPrinters = async (): Promise<void> => {
    try {
      if (!qzTrayConnected) {
        console.log("⚠️ QZ Tray no está conectado");
        return;
      }

      console.log("🔄 Refrescando lista de impresoras...");
      const printers = await qzTray.getPrinters();
      setAvailablePrinters(printers);
      console.log(`✅ Se encontraron ${printers.length} impresoras:`, printers);

      toast({
        title: "Lista actualizada",
        description: `Se encontraron ${printers.length} impresoras disponibles.`,
      });
    } catch (error) {
      console.error("❌ Error al refrescar impresoras:", error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar la lista de impresoras.",
        variant: "destructive",
      });
    }
  };

  // Auto-inicializar QZ Tray cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && settings.autoConnectQzTray && !qzTrayConnected) {
      // Esperar un poco antes de inicializar automáticamente
      const timer = setTimeout(() => {
        initializeQzTray();
      }, 1000);

      return () => clearTimeout(timer);
    } else if (!isAuthenticated && qzTrayConnected) {
      // Desconectar si el usuario cierra sesión
      qzTray.disconnectQzTray();
      setQzTrayConnected(false);
      setAvailablePrinters([]);
    }
  }, [isAuthenticated, settings.autoConnectQzTray]);

  const value: AppContextType = {
    isAuthenticated,
    qzTrayConnected,
    availablePrinters,
    initializeQzTray,
    refreshPrinters,
    settings,
    updateSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook principal
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Hook específico para configuraciones (alias de useAppContext)
export const useAppSettings = () => {
  const context = useAppContext();
  return {
    settings: context.settings,
    updateSettings: context.updateSettings,
  };
};

// Alias para compatibilidad con código existente
export const useApp = useAppContext;