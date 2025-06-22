// client/src/components/AppContext.tsx - VERSIÓN EXTENDIDA CON EMPRESAS Y SEDES

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import qzTray from '@/lib/qz-tray';

// Tipos para empresas y sedes
export interface Sede {
  id: string;
  name: string;
}

export interface Empresa {
  id: string;
  name: string;
  sedes: Sede[];
}

interface AppSettings {
  companyName: string;
  adminEmail: string;
  enableNotifications: boolean;
  // Nueva configuración de empresas y sedes
  empresas: Empresa[];
}

interface AppContextType {
  isAuthenticated: boolean;
  qzTrayConnected: boolean;
  availablePrinters: string[];
  initializeQzTray: () => Promise<boolean>;
  refreshPrinters: () => Promise<void>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  // Nuevas funciones para gestión de empresas y sedes
  addEmpresa: (empresa: Omit<Empresa, 'id'>) => void;
  updateEmpresa: (empresaId: string, empresa: Partial<Empresa>) => void;
  removeEmpresa: (empresaId: string) => void;
  addSede: (empresaId: string, sede: Omit<Sede, 'id'>) => void;
  updateSede: (empresaId: string, sedeId: string, sede: Partial<Sede>) => void;
  removeSede: (empresaId: string, sedeId: string) => void;
  getSedesByEmpresa: (empresaId: string) => Sede[];
  getAllEmpresas: () => Empresa[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [qzTrayConnected, setQzTrayConnected] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  // Estado de configuraciones con valores por defecto que incluyen ejemplos
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'PrinterHub',
    adminEmail: '',
    enableNotifications: false,
    empresas: [
      {
        id: '1',
        name: 'Sede Principal',
        sedes: [
          { id: '1-1', name: 'Piso 1 - Administración' },
          { id: '1-2', name: 'Piso 2 - Contabilidad' },
          { id: '1-3', name: 'Piso 3 - Gerencia' }
        ]
      },
      {
        id: '2', 
        name: 'Sucursal Norte',
        sedes: [
          { id: '2-1', name: 'Área Comercial' },
          { id: '2-2', name: 'Área Técnica' }
        ]
      }
    ],
  });

  // Función para generar IDs únicos
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Función para actualizar configuraciones
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    // Guardar en localStorage para persistencia
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
  };

  // Funciones para gestión de empresas
  const addEmpresa = (empresa: Omit<Empresa, 'id'>) => {
    const newEmpresa: Empresa = {
      ...empresa,
      id: generateId(),
      sedes: empresa.sedes || []
    };

    const updatedSettings = {
      ...settings,
      empresas: [...settings.empresas, newEmpresa]
    };

    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Empresa agregada",
      description: `La empresa "${empresa.name}" ha sido agregada exitosamente.`,
    });
  };

  const updateEmpresa = (empresaId: string, empresaData: Partial<Empresa>) => {
    const updatedSettings = {
      ...settings,
      empresas: settings.empresas.map(empresa => 
        empresa.id === empresaId 
          ? { ...empresa, ...empresaData }
          : empresa
      )
    };

    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Empresa actualizada",
      description: "Los datos de la empresa han sido actualizados exitosamente.",
    });
  };

  const removeEmpresa = (empresaId: string) => {
    const empresa = settings.empresas.find(e => e.id === empresaId);

    const updatedSettings = {
      ...settings,
      empresas: settings.empresas.filter(empresa => empresa.id !== empresaId)
    };

    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Empresa eliminada",
      description: `La empresa "${empresa?.name}" ha sido eliminada exitosamente.`,
      variant: "destructive"
    });
  };

  // Funciones para gestión de sedes
  const addSede = (empresaId: string, sede: Omit<Sede, 'id'>) => {
    const newSede: Sede = {
      ...sede,
      id: generateId()
    };

    const updatedSettings = {
      ...settings,
      empresas: settings.empresas.map(empresa => 
        empresa.id === empresaId 
          ? { ...empresa, sedes: [...empresa.sedes, newSede] }
          : empresa
      )
    };

    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Sede agregada",
      description: `La sede "${sede.name}" ha sido agregada exitosamente.`,
    });
  };

  const updateSede = (empresaId: string, sedeId: string, sedeData: Partial<Sede>) => {
    const updatedSettings = {
      ...settings,
      empresas: settings.empresas.map(empresa => 
        empresa.id === empresaId 
          ? {
              ...empresa,
              sedes: empresa.sedes.map(sede =>
                sede.id === sedeId ? { ...sede, ...sedeData } : sede
              )
            }
          : empresa
      )
    };

    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Sede actualizada",
      description: "Los datos de la sede han sido actualizados exitosamente.",
    });
  };

  const removeSede = (empresaId: string, sedeId: string) => {
    const empresa = settings.empresas.find(e => e.id === empresaId);
    const sede = empresa?.sedes.find(s => s.id === sedeId);

    const updatedSettings = {
      ...settings,
      empresas: settings.empresas.map(empresa => 
        empresa.id === empresaId 
          ? {
              ...empresa,
              sedes: empresa.sedes.filter(sede => sede.id !== sedeId)
            }
          : empresa
      )
    };

    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: "Sede eliminada",
      description: `La sede "${sede?.name}" ha sido eliminada exitosamente.`,
      variant: "destructive"
    });
  };

  // Funciones de utilidad
  const getSedesByEmpresa = (empresaId: string): Sede[] => {
    const empresa = settings.empresas.find(e => e.id === empresaId);
    return empresa?.sedes || [];
  };

  const getAllEmpresas = (): Empresa[] => {
    return settings.empresas;
  };

  // Cargar configuraciones desde localStorage al inicializar
  useEffect(() => {
    const savedSettings = localStorage.getItem('app_settings');
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
      console.log("🚀 Inicializando QZ Tray (modo WebSocket only)...");

      const connected = await qzTray.initQzTray({
        usingSecure: false,
        retries: 3,
        delay: 1
      });

      if (connected) {
        console.log("✅ QZ Tray conectado exitosamente");
        setQzTrayConnected(true);

        // Obtener impresoras disponibles una vez
        try {
          const printers = await qzTray.getPrinters();
          console.log(`🖨️ ${printers.length} impresoras detectadas:`, printers);
          setAvailablePrinters(printers);
        } catch (error) {
          console.error("Error al obtener impresoras:", error);
        }

        console.log("📡 Sistema configurado para usar solo WebSocket");
        console.log("🚫 Polling desactivado - Procesamiento en tiempo real vía WebSocket");
      } else {
        console.log("❌ No se pudo conectar a QZ Tray");
        setQzTrayConnected(false);
      }

      return connected;
    } catch (error) {
      console.error("Error al inicializar QZ Tray:", error);
      setQzTrayConnected(false);
      return false;
    }
  };

  // Función para refrescar impresoras manualmente
  const refreshPrinters = async () => {
    if (!qzTrayConnected) return;

    try {
      const printers = await qzTray.getPrinters();
      setAvailablePrinters(printers);
      console.log(`🔄 Impresoras actualizadas: ${printers.length} encontradas`);
    } catch (error) {
      console.error("Error al refrescar impresoras:", error);
    }
  };

  // Inicializar QZ Tray cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && !qzTrayConnected) {
      initializeQzTray();
    } else if (!isAuthenticated && qzTrayConnected) {
      // Desconectar si el usuario cierra sesión
      qzTray.disconnectQzTray();
      setQzTrayConnected(false);
      setAvailablePrinters([]);
    }
  }, [isAuthenticated]);

  const value: AppContextType = {
    isAuthenticated,
    qzTrayConnected,
    availablePrinters,
    initializeQzTray,
    refreshPrinters,
    settings,
    updateSettings,
    // Nuevas funciones
    addEmpresa,
    updateEmpresa,
    removeEmpresa,
    addSede,
    updateSede,
    removeSede,
    getSedesByEmpresa,
    getAllEmpresas
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
    // Funciones para empresas y sedes
    addEmpresa: context.addEmpresa,
    updateEmpresa: context.updateEmpresa,
    removeEmpresa: context.removeEmpresa,
    addSede: context.addSede,
    updateSede: context.updateSede,
    removeSede: context.removeSede,
    getSedesByEmpresa: context.getSedesByEmpresa,
    getAllEmpresas: context.getAllEmpresas
  };
};

// Alias para compatibilidad con código existente
export const useApp = useAppContext;