// client/src/components/print-jobs/WebSocketOnlyMonitor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { printPdfFromUrl, isQzTrayConnected } from '@/lib/qz-tray';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface PrintJob {
  id: number;
  documentName: string;
  documentUrl: string;
  printerName: string;
  printerUniqueId: string;
  status: string;
  copies: number;
  duplex: boolean;
  orientation: string;
  qzTrayData?: any;
}

export const WebSocketOnlyMonitor: React.FC = () => {
  const socket = useSocket();
  const { toast } = useToast();
  const [processingJobs, setProcessingJobs] = useState<Set<number>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    received: 0,
    processed: 0,
    failed: 0,
    avgTime: 0
  });

  // Procesar trabajo inmediatamente
  const processJob = useCallback(async (job: PrintJob) => {
    const startTime = Date.now();

    if (processingJobs.has(job.id)) {
      console.log(`⏭️ [WS-ONLY] Trabajo ${job.id} ya está siendo procesado`);
      return;
    }

    setProcessingJobs(prev => new Set(prev).add(job.id));
    console.log(`🚀 [WS-ONLY] Procesando trabajo ${job.id} vía WebSocket`);

    try {
      // Verificar QZ Tray
      if (!isQzTrayConnected()) {
        throw new Error("QZ Tray no está conectado");
      }

      // Actualizar estado en servidor
      const apiKey = localStorage.getItem('apiKey');
      await fetch(`/api/print-jobs/${job.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ status: 'processing' })
      });

      // Imprimir directamente desde URL
      console.log(`🔗 [WS-ONLY] Imprimiendo desde URL: ${job.documentUrl}`);
      await printPdfFromUrl(
        job.printerName,
        job.documentUrl,
        {
          copies: job.copies,
          duplex: job.duplex,
          orientation: job.orientation as 'portrait' | 'landscape'
        }
      );

      // Marcar como completado
      await fetch(`/api/print-jobs/${job.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ status: 'completed' })
      });

      const processTime = Date.now() - startTime;
      console.log(`✅ [WS-ONLY] Trabajo ${job.id} completado en ${processTime}ms`);

      // Actualizar estadísticas
      setStats(prev => ({
        ...prev,
        processed: prev.processed + 1,
        avgTime: prev.avgTime 
          ? (prev.avgTime * prev.processed + processTime) / (prev.processed + 1)
          : processTime
      }));

      toast({
        title: "✅ Impresión exitosa",
        description: `${job.documentName} enviado a ${job.printerName} (${processTime}ms)`,
      });

    } catch (error) {
      console.error(`❌ [WS-ONLY] Error procesando trabajo ${job.id}:`, error);

      const apiKey = localStorage.getItem('apiKey');
      await fetch(`/api/print-jobs/${job.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ 
          status: 'failed',
          error: error.message 
        })
      });

      setStats(prev => ({
        ...prev,
        failed: prev.failed + 1
      }));

      toast({
        variant: "destructive",
        title: "❌ Error de impresión",
        description: error.message,
      });
    } finally {
      setProcessingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
    }
  }, [processingJobs, toast]);

  // Botón de recuperación manual (por si acaso)
  const checkPendingJobsManually = useCallback(async () => {
    try {
      console.log("🔄 [MANUAL] Verificando trabajos pendientes...");
      const apiKey = localStorage.getItem('apiKey');
      const response = await fetch('/api/print-jobs/pending', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const jobs = await response.json();
        console.log(`📋 [MANUAL] Encontrados ${jobs.length} trabajos`);

        for (const job of jobs) {
          if (job.status === 'ready_for_client' && !processingJobs.has(job.id)) {
            await processJob(job);
          }
        }

        if (jobs.length === 0) {
          toast({
            title: "No hay trabajos pendientes",
            description: "Todos los trabajos han sido procesados",
          });
        }
      }
    } catch (error) {
      console.error('❌ [MANUAL] Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron verificar los trabajos pendientes",
      });
    }
  }, [processJob, processingJobs, toast]);

  // Configurar listeners de WebSocket
  useEffect(() => {
    if (!socket) return;

    // Eventos de conexión
    const handleConnect = () => {
      console.log("✅ [WS-ONLY] WebSocket conectado");
      setIsConnected(true);
      toast({
        title: "🟢 Conectado",
        description: "Sistema de impresión en tiempo real activo",
      });
    };

    const handleDisconnect = () => {
      console.log("❌ [WS-ONLY] WebSocket desconectado");
      setIsConnected(false);
      toast({
        variant: "destructive",
        title: "🔴 Desconectado",
        description: "Conexión perdida. Los trabajos no se procesarán automáticamente.",
      });
    };

    // Evento de nuevo trabajo
    const handleNewJob = (job: PrintJob) => {
      console.log(`📡 [WS-ONLY] Nuevo trabajo recibido:`, job);
      setStats(prev => ({ ...prev, received: prev.received + 1 }));

      if (job.status === 'ready_for_client') {
        processJob(job);
      }
    };

    // Registrar eventos
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-print-job', handleNewJob);

    // Verificar estado inicial
    if (socket.connected) {
      setIsConnected(true);
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-print-job', handleNewJob);
    };
  }, [socket, processJob, toast]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Estado de conexión */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  WebSocket Conectado
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-600">
                  WebSocket Desconectado
                </span>
              </>
            )}
          </div>

          {/* Botón de recuperación manual */}
          <Button
            variant="outline"
            size="sm"
            onClick={checkPendingJobsManually}
            disabled={processingJobs.size > 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Manualmente
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.received}</div>
            <div className="text-xs text-gray-500">Recibidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            <div className="text-xs text-gray-500">Procesados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-500">Fallidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(stats.avgTime)}ms
            </div>
            <div className="text-xs text-gray-500">Tiempo Promedio</div>
          </div>
        </div>

        {/* Estado de procesamiento */}
        {processingJobs.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700">
                Procesando {processingJobs.size} trabajo(s)...
              </span>
            </div>
          </div>
        )}

        {/* Advertencia si no hay conexión */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Sin conexión WebSocket. Los trabajos no se procesarán automáticamente.
              Use el botón "Verificar Manualmente" para procesar trabajos pendientes.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};