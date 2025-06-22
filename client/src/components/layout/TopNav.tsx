import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, HelpCircle, LogOut, Menu, User, Printer, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppSettings } from "@/components/AppContext";
import { Button } from "@/components/ui/button";
import qzTray from "@/lib/qz-tray";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getNavigationItems } from "@/components/layout/Sidebar";

interface TopNavProps {
  onMenuClick: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { settings } = useAppSettings();
  const [qzTrayStatus, setQzTrayStatus] = useState<boolean>(false);

  // Verificar el estado de QZ Tray periódicamente
  useEffect(() => {
    // Comprobar el estado inicial
    setQzTrayStatus(qzTray.isQzTrayActive());

    // Configurar un intervalo para comprobar cada 5 segundos
    const interval = setInterval(() => {
      setQzTrayStatus(qzTray.isQzTrayActive());
    }, 5000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(user?.isAdmin);

  // Get current page and icon based on location
  const getCurrentPage = () => {
    // Primero buscar una coincidencia exacta
    const exactMatch = navigationItems.find(item => item.href === location);
    if (exactMatch) return exactMatch;

    // Si no hay coincidencia exacta, buscar una coincidencia parcial (para rutas con parámetros)
    if (location !== '/') {
      const partialMatch = navigationItems.find(item => 
        item.href !== '/' && location.startsWith(item.href)
      );
      if (partialMatch) return partialMatch;
    }

    // Si no se encuentra, devolver dashboard por defecto
    return navigationItems[0]; // Dashboard
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-600 md:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <div className="w-full flex items-center">
            <div className="flex items-center">
              {/* Usamos el ícono actual según la ruta */}
              {React.createElement(getCurrentPage().icon, { 
                className: "h-6 w-6 text-primary mr-2" 
              })}
              <div className="text-lg font-semibold text-gray-700">
                {getCurrentPage().name}
              </div>
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          {/* QZ Tray status indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1">
                  {qzTrayStatus ? (
                    <Wifi className="h-6 w-6 text-green-500" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{qzTrayStatus ? "QZ Tray conectado" : "QZ Tray desconectado"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notification icon */}
          <button className="ml-3 p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* Help icon */}
          <button className="ml-3 p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <span className="sr-only">View help</span>
            <HelpCircle className="h-6 w-6" aria-hidden="true" />
          </button>

          {/* User menu / Logout button */}
          <Button 
            variant="ghost" 
            className="ml-3 p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-500"
            onClick={logout}
          >
            <LogOut className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopNav;