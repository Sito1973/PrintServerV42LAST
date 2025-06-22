import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  RotateCw
} from "lucide-react";
import { printService } from "@/services/PrintService";

const RealTimePrintStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [processedJobs, setProcessedJobs] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Verificar estado cada segundo
    const interval = setInterval(() => {
      const connected = printService.isConnected();
      const jobCount = printService.getProcessedJobsCount();

      setIsConnected(connected);
      setProcessedJobs(jobCount);
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReconnect = () => {
    printService.disconnect();
    setTimeout(() => {
      printService.initialize();
    }, 1000);
  };

  const getStatusIcon = () => {
    if (isConnected) {
      return <Wifi className="h-5 w-5 text-green-500" />;
    } else {
      return <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    if (isConnected) {
      return <Badge className="bg-green-100 text-green-800">🚀 ACTIVO</Badge>;
    } else {
      return <Badge variant="destructive">❌ DESCONECTADO</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          🚀 Sistema Principal de Impresión (PrintService)
        </CardTitle>
        <CardDescription>
          Procesamiento automático WebSocket + QZ Tray - Sistema único sin duplicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado principal */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">WebSocket</span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-600 text-lg">{processedJobs}</div>
            <div className="text-blue-600">Trabajos Procesados</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-600">
              {isConnected ? <Activity className="h-4 w-4 mx-auto animate-pulse" /> : <AlertTriangle className="h-4 w-4 mx-auto" />}
            </div>
            <div className="text-purple-600">
              {isConnected ? 'En Línea' : 'Fuera de Línea'}
            </div>
          </div>
        </div>

        {/* Última actualización */}
        {lastUpdate && (
          <div className="text-sm text-gray-500 text-center">
            Estado actualizado: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-2 justify-center">
          {!isConnected && (
            <Button onClick={handleReconnect} size="sm" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Reconectar Servicio
            </Button>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

export default RealTimePrintStatus;