import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCw,
  AlertTriangle,
  Wifi,
  WifiOff
} from "lucide-react";
import { initQzTray, isQzTrayConnected, getPrinters, printPdfFromUrl, updateJobStatus, printData } from "@/lib/qz-tray";
import { apiRequest } from "@/lib/queryClient";

interface PrintJob {
  id: number;
  documentName: string;
  documentUrl: string;
  printerName: string;
  status: string;
  createdAt: string;
  copies: number;
  duplex: boolean;
  orientation: string;
  qzTrayData?: any;
}

interface PendingJobsResponse {
  success: boolean;
  printer: {
    id: number;
    name: string;
    uniqueId: string;
    status: string;
  };
  jobs: PrintJob[];
  totalJobs: number;
  pendingJobs: number;
  timestamp: string;
}

const PrintJobMonitor: React.FC = () => {
  const [qzStatus, setQzStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [localPrinters, setLocalPrinters] = useState<string[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [processedJobs, setProcessedJobs] = useState(0);
  const [pollingErrors, setPollingErrors] = useState(0);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Query para obtener impresoras del servidor
  const { data: serverPrinters = [] } = useQuery<any[]>({
    queryKey: ['/api/printers'],
    queryFn: () => apiRequest('/api/printers'),
    staleTime: 30000,
  });

  // Inicializar QZ Tray al montar el componente
  useEffect(() => {
    let mounted = true;

    const initializeQzTray = async () => {
      console.log("🔄 [MONITOR] Inicializando QZ Tray...");
      setQzStatus('connecting');

      try {
        const connected = await initQzTray();
        if (mounted) {
          if (connected) {
            console.log("✅ [MONITOR] QZ Tray conectado exitosamente");
            setQzStatus('connected');

            // Obtener impresoras locales
            try {
              const printers = await getPrinters();
              console.log(`🖨️ [MONITOR] Impresoras locales encontradas: ${printers.length}`);
              setLocalPrinters(printers);
            } catch (err) {
              console.error("❌ [MONITOR] Error obteniendo impresoras:", err);
              setLocalPrinters([]);
            }
          } else {
            console.log("❌ [MONITOR] QZ Tray no pudo conectarse");
            setQzStatus('disconnected');
          }
        }
      } catch (error) {
        console.error("❌ [MONITOR] Error inicializando QZ Tray:", error);
        if (mounted) {
          setQzStatus('disconnected');
        }
      }
    };

    initializeQzTray();

    return () => {
      mounted = false;
    };
  }, []);

  // Función para procesar trabajos con datos QZ preconfigurados
  const processJobWithQzData = async (job: PrintJob, printerUniqueId: string): Promise<boolean> => {
      console.log(`🚀 [MONITOR] ========== PROCESANDO TRABAJO CON DATOS QZ ${job.id} ==========`);
      console.log(`📄 [MONITOR] Documento: ${job.documentName}`);
      console.log(`🖨️ [MONITOR] Impresora: ${job.printerName}`);
      console.log(`📊 [MONITOR] Datos QZ disponibles: ${!!job.qzTrayData}`);

      try {
          // Actualizar estado a "processing"
          console.log(`📊 [MONITOR] Marcando trabajo ${job.id} como 'processing'...`);
          await updateJobStatus(job.id, 'processing');

          // Verificar que QZ Tray esté conectado
          if (!isQzTrayConnected()) {
              throw new Error("QZ Tray no está conectado");
          }

          // Parsear datos QZ almacenados
          let qzData;
          try {
              qzData = typeof job.qzTrayData === 'string' ? JSON.parse(job.qzTrayData) : job.qzTrayData;
              console.log(`📋 [MONITOR] Datos QZ parseados:`, qzData);
          } catch (parseError) {
              console.error(`❌ [MONITOR] Error parseando datos QZ:`, parseError);
              throw new Error("Error en datos QZ almacenados");
          }

          // Imprimir usando QZ Tray con datos preconfigurados
          console.log(`🖨️ [MONITOR] Enviando a imprimir trabajo ${job.id} con datos QZ preconfigurados...`);

          // printData es void, no retorna nada. Si no lanza error, fue exitoso
          await printData(job.printerName, qzData.data);

          // Si llegamos aquí, la impresión fue exitosa
          console.log(`✅ [MONITOR] Trabajo ${job.id} enviado exitosamente a la impresora`);
          await updateJobStatus(job.id, 'completed');
          setProcessedJobs(prev => prev + 1);
          return true;

      } catch (error) {
          console.error(`❌ [MONITOR] Error procesando trabajo con datos QZ ${job.id}:`, error);
          await updateJobStatus(job.id, 'failed', error.message);
          return false;
      }
  };
  // Función para procesar un trabajo de impresión
  const processJob = async (job: PrintJob, printerUniqueId: string): Promise<boolean> => {
    console.log(`🖨️ [MONITOR] ========== PROCESANDO TRABAJO ${job.id} ==========`);
    console.log(`📄 [MONITOR] Documento: ${job.documentName}`);
    console.log(`🖨️ [MONITOR] Impresora: ${job.printerName}`);
    console.log(`🔗 [MONITOR] URL: ${job.documentUrl}`);

    try {
      // Actualizar estado a "processing"
      console.log(`📊 [MONITOR] Marcando trabajo ${job.id} como 'processing'...`);
      await updateJobStatus(job.id, 'processing');

      // Verificar que QZ Tray esté conectado
      if (!isQzTrayConnected()) {
        throw new Error("QZ Tray no está conectado");
      }

      // Imprimir usando QZ Tray
      console.log(`🚀 [MONITOR] Enviando a imprimir trabajo ${job.id}...`);
      await printPdfFromUrl(
        job.printerName, 
        job.documentUrl,
        {
            copies: job.copies,
            duplex: job.duplex,
            orientation: job.orientation as 'portrait' | 'landscape'
        }
      );

      // Si no lanzó error, fue exitoso
      console.log(`✅ [MONITOR] Trabajo ${job.id} enviado exitosamente a la impresora`);
      await updateJobStatus(job.id, 'completed');
      setProcessedJobs(prev => prev + 1);
      return true;
    } catch (error) {
      console.error(`❌ [MONITOR] Error procesando trabajo ${job.id}:`, error);
      await updateJobStatus(job.id, 'failed', error.message);
      return false;
    }
  };

  // Función para hacer polling de trabajos pendientes
  const pollForJobs = async () => {
    if (!isQzTrayConnected() || !serverPrinters || !Array.isArray(serverPrinters) || serverPrinters.length === 0) {
      return;
    }

    console.log(`🔍 [MONITOR] Iniciando polling para ${serverPrinters.length} impresoras...`);

    for (const printer of serverPrinters) {
      try {
        // Validar que el printer tenga uniqueId
        if (!printer || !printer.uniqueId) {
          console.log(`⚠️ [MONITOR] Impresora sin uniqueId válido:`, printer);
          continue;
        }

        console.log(`🔍 [MONITOR] Consultando trabajos para ${printer.name} (${printer.uniqueId})...`);

        const response = await fetch(`/api/printers/${printer.uniqueId}/jobs`);
        if (!response.ok) {
          console.log(`⚠️ [MONITOR] Error HTTP ${response.status} para impresora ${printer.uniqueId}`);
          continue;
        }

        const data: PendingJobsResponse = await response.json();

        if (data.success && data.jobs.length > 0) {
          console.log(`📋 [MONITOR] ${data.jobs.length} trabajos encontrados para ${printer.name}`);

          // Log detallado de cada trabajo encontrado
          data.jobs.forEach((job, index) => {
            console.log(`   📄 Trabajo ${index + 1}: ID=${job.id}, Status=${job.status}, Name=${job.documentName}`);
          });

          for (const job of data.jobs) {
            if (job.status === 'ready_for_client' || job.status === 'pending') {
              console.log(`⚡ [MONITOR] Procesando trabajo ${job.id}: ${job.documentName} (Estado: ${job.status})`);

              // Si es ready_for_client, usar los datos QZ almacenados directamente
              if (job.status === 'ready_for_client' && job.qzTrayData) {
                console.log(`🚀 [MONITOR] Trabajo ${job.id} tiene datos QZ preconfigurados, procesando directamente...`);
                const success = await processJobWithQzData(job, printer.uniqueId);
                if (success) {
                  queryClient.invalidateQueries({ queryKey: ['/api/print-jobs'] });
                }
              } else {
                console.log(`🔄 [MONITOR] Trabajo ${job.id} requiere preparación de datos QZ...`);
                const success = await processJob(job, printer.uniqueId);
                if (success) {
                  queryClient.invalidateQueries({ queryKey: ['/api/print-jobs'] });
                }
              }
            } else {
              console.log(`⏭️ [MONITOR] Trabajo ${job.id} omitido (Estado: ${job.status})`);
            }
          }
        } else {
          console.log(`📭 [MONITOR] Sin trabajos pendientes para ${printer.name}`);
        }
      } catch (error) {
        console.error(`❌ [MONITOR] Error consultando trabajos para ${printer.uniqueId}:`, error);
        setPollingErrors(prev => prev + 1);
      }
    }

    setLastPollTime(new Date());
  };

  // Controlar el polling
  const startPolling = () => {
    if (pollingIntervalRef.current) return;

    console.log("🚀 [MONITOR] Iniciando polling reactivo...");
    setIsPolling(true);
    setPollingErrors(0);

    // Polling inmediato
    pollForJobs();

    // Polling cada 3 segundos
    pollingIntervalRef.current = setInterval(pollForJobs, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    console.log("🛑 [MONITOR] Polling detenido");
  };

  // POLLING COMPLETAMENTE DESHABILITADO - Solo PrintService maneja el procesamiento
  useEffect(() => {
    console.log("🚫 [MONITOR] Polling automático DESHABILITADO - Solo modo visualización");
    console.log("⚡ [MONITOR] PrintService maneja todo el procesamiento vía WebSocket");
    
    // Detener cualquier polling que pueda estar activo
    if (isPolling) {
      console.log("🛑 [MONITOR] Deteniendo polling para evitar duplicación");
      stopPolling();
    }

    // Verificación periódica del estado de QZ Tray
    const checkQzInterval = setInterval(() => {
      const isConnected = isQzTrayConnected();
      if (qzStatus === 'connected' && !isConnected) {
        console.log("⚠️ [MONITOR] QZ Tray desconectado, intentando reconectar...");
        setQzStatus('connecting');
        initQzTray().then(connected => {
          setQzStatus(connected ? 'connected' : 'disconnected');
        });
      }
    }, 10000); // Verificar cada 10 segundos

    return () => clearInterval(checkQzInterval);
  }, [qzStatus]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const getQzStatusIcon = () => {
    switch (qzStatus) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'connecting':
        return <RotateCw className="h-5 w-5 text-yellow-500 animate-spin" />;
      default:
        return <WifiOff className="h-5 w-5 text-red-500" />;
    }
  };

  const getQzStatusBadge = () => {
    switch (qzStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Conectando...</Badge>;
      default:
        return <Badge variant="destructive">Desconectado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monitor QZ Tray (Solo Visualización)
        </CardTitle>
        <CardDescription>
          Estado de QZ Tray e impresoras - Procesamiento automático manejado por PrintService
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de QZ Tray */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {getQzStatusIcon()}
            <span className="font-medium">QZ Tray</span>
          </div>
          {getQzStatusBadge()}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-semibold text-blue-600">
              {serverPrinters && Array.isArray(serverPrinters) ? serverPrinters.length : 0}
            </div>
            <div className="text-blue-600">Impresoras Servidor</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-semibold text-green-600">{localPrinters.length}</div>
            <div className="text-green-600">Impresoras Locales</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-semibold text-purple-600">{processedJobs}</div>
            <div className="text-purple-600">Trabajos Procesados</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="font-semibold text-orange-600">
              {isPolling ? <RotateCw className="h-4 w-4 mx-auto animate-spin" /> : <Clock className="h-4 w-4 mx-auto" />}
            </div>
            <div className="text-orange-600">
              {isPolling ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        {/* Última actualización */}
        {lastPollTime && (
          <div className="text-sm text-gray-500 text-center">
            Última verificación: {lastPollTime.toLocaleTimeString()}
          </div>
        )}

        {/* Controles - Solo visualización */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            🚀 <strong>Modo Solo Visualización</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            PrintService maneja el procesamiento automático vía WebSocket
          </p>
        </div>

        {qzStatus === 'disconnected' && (
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Reconectar QZ Tray
            </Button>
          </div>
        )}

        {/* Advertencias */}
        {qzStatus === 'disconnected' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
            <span>QZ Tray no está conectado. Instala y ejecuta QZ Tray para procesar trabajos de impresión.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrintJobMonitor;