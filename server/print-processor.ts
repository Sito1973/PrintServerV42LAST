import { storage } from "./storage";
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

/**
 * Servicio de procesamiento automático de trabajos de impresión
 * Se ejecuta independientemente de la interfaz web
 */

interface QzTrayPrintData {
  printer: string;
  data: Array<{
    type: string;
    format: string;
    flavor: string;
    data: string;
    options?: {
      orientation?: string;
      copies?: number;
      duplex?: boolean;
      pageRanges?: string;
      ignoreTransparency?: boolean;
      altFontRendering?: boolean;
    };
  }>;
  config?: {
    orientation?: string;
    copies?: number;
    duplex?: boolean;
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    size?: {
      width?: number;
      height?: number;
    };
    units?: string;
    density?: string | number;
    colorType?: string;
    jobName?: string;
    interpolation?: string;
    scaleContent?: boolean;
    rasterize?: boolean;
  };
}

class PrintProcessor {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 5000; // 5 segundos

  /**
   * Iniciar el procesador automático (DESHABILITADO - solo modo manual)
   */
  start() {
    if (this.isRunning) {
      console.log("Print Processor ya está ejecutándose");
      return;
    }

    console.log("🖨️ ========== PRINT PROCESSOR EN MODO MANUAL ==========");
    console.log("🚫 Procesamiento automático COMPLETAMENTE DESHABILITADO");
    console.log("⚡ Solo PrintService (WebSocket) maneja el procesamiento automático");
    console.log("📋 Este componente solo proporciona métodos manuales");
    this.isRunning = true;

    // NO iniciar interval automático - solo procesamiento manual
    // this.interval = setInterval(async () => {
    //   await this.processPendingJobs();
    // }, this.POLL_INTERVAL);

    // NO procesar trabajos pendientes automáticamente al iniciar
    // this.processPendingJobs();
  }

  /**
   * Detener el procesador automático
   */
  stop() {
    if (!this.isRunning) return;

    console.log("🛑 Deteniendo Print Processor automático");
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Procesar todos los trabajos pendientes (MÉTODO MANUAL)
   * Este método ya NO se ejecuta automáticamente
   */
  private async processPendingJobs() {
    try {
      console.log("⚠️ [MÉTODO MANUAL] processPendingJobs llamado manualmente");

      // Obtener todos los trabajos pendientes
      const allJobs = await storage.listPrintJobs();
      const pendingJobs = allJobs.filter(job => job.status === 'pending');

      if (pendingJobs.length === 0) {
        console.log("📭 No hay trabajos pendientes para procesar manualmente");
        return; // No hay trabajos pendientes
      }

      console.log(`📄 [MANUAL] Procesando ${pendingJobs.length} trabajos pendientes`);

      // Procesar cada trabajo
      for (const job of pendingJobs) {
        await this.processJob(job);
        // Pequeña pausa entre trabajos para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error("Error al procesar trabajos pendientes manualmente:", error);
    }
  }

  // Método optimizado sin setTimeout artificial
  public async processJob(job: any) {
    try {
      console.log(`🔥 [PrintProcessor] === PROCESAMIENTO OPTIMIZADO DE TRABAJO ${job.id} ===`);

      // Verificar estado actual
      const currentJob = await storage.getPrintJob(job.id);
      if (!currentJob || currentJob.status !== 'pending') {
        console.log(`⏭️ [PrintProcessor] Trabajo ${job.id} ya procesado`);
        return;
      }

      // Marcar como listo inmediatamente con la URL
      await storage.updatePrintJob(job.id, { status: 'processing' });

      const printer = await storage.getPrinter(job.printerId);
      if (!printer) {
        await storage.updatePrintJob(job.id, { status: 'failed' });
        return;
      }

      // Preparar datos mínimos para QZ Tray (sin descargar PDF)
      const qzData = await this.prepareQzTrayData(job, printer);

      // Marcar inmediatamente como listo
      await storage.updatePrintJob(job.id, { 
        status: 'ready_for_client',
        qzTrayData: JSON.stringify(qzData)
      });

      console.log(`✅ [PrintProcessor] Trabajo ${job.id} listo para impresión directa`);

    } catch (error) {
      console.error(`❌ [PrintProcessor] Error:`, error);
      await storage.updatePrintJob(job.id, { status: 'failed' });
    }
  }

  /**
   * Preparar datos según la documentación oficial de QZ Tray
   */
  private async prepareQzTrayData(job: any, printer: any): Promise<QzTrayPrintData> {
    // Configuración del config según la documentación
    const config: any = {
      jobName: `${job.documentName} - ID: ${job.id}`,
      units: 'mm',
      margins: job.margins || {
        top: 6.35,    // equivalente a 0.25 pulgadas
        right: 6.35,
        bottom: 6.35,
        left: 6.35
      }
    };

    // Configurar orientación
    if (job.orientation) {
      config.orientation = job.orientation;
    }

    // Configurar copias
    if (job.copies && job.copies > 1) {
      config.copies = job.copies;
    }

    // Configurar duplex
    if (job.duplex) {
      config.duplex = true;
    }

    // OPTIMIZACIÓN: No descargar el PDF, enviar solo la URL
    // QZ Tray puede descargar e imprimir directamente
    let pdfDataItem: any;

    if (job.documentUrl && (job.documentUrl.startsWith('http://') || job.documentUrl.startsWith('https://'))) {
      console.log(`🚀 [PrintProcessor] Preparando URL directa para QZ Tray: ${job.documentUrl}`);

      // QZ Tray soporta URLs directas con flavor 'file'
      pdfDataItem = {
        type: 'pixel',
        format: 'pdf',
        flavor: 'file', // Cambiar de 'base64' a 'file' para URL directa
        data: job.documentUrl, // Enviar URL directamente
        options: {
          orientation: job.orientation || 'portrait',
          copies: job.copies || 1,
          duplex: job.duplex || false,
          ignoreTransparency: job.options?.ignoreTransparency ?? true,
          altFontRendering: job.options?.altFontRendering ?? true,
          ...(job.options?.pageRanges && { pageRanges: job.options.pageRanges }),
          ...(job.options?.scaleContent !== undefined && { scaleContent: job.options.scaleContent }),
          ...(job.options?.rasterize !== undefined && { rasterize: job.options.rasterize }),
          ...(job.options?.interpolation && { interpolation: job.options.interpolation }),
          ...(job.options?.colorType && { colorType: job.options.colorType }),
        }
      };

      console.log(`✅ [PrintProcessor] URL preparada para impresión directa`);
    } else {
      throw new Error('URL de documento inválida para procesamiento de PDF');
    }

    return {
      printer: printer.name,
      data: [pdfDataItem],
      config: config
    };
  }


  /**
   * Método para que el cliente procese trabajos listos
   */
  async getJobsReadyForClient(printerUniqueId: string) {
    try {
      const printer = await storage.getPrinterByUniqueId(printerUniqueId);
      if (!printer) {
        return [];
      }

      const allJobs = await storage.listPrintJobs();
      const readyJobs = allJobs.filter(job => 
        job.printerId === printer.id && 
        job.status === 'ready_for_client'
      );

      return readyJobs.map(job => ({
        id: job.id,
        documentName: job.documentName,
        qzTrayData: job.qzTrayData ? JSON.parse(job.qzTrayData) : null,
        createdAt: job.createdAt
      }));

    } catch (error) {
      console.error("Error obteniendo trabajos listos para cliente:", error);
      return [];
    }
  }

  /**
   * Actualizar estado de trabajo desde el cliente
   */
  async updateJobStatusFromClient(jobId: number, status: 'processing' | 'completed' | 'failed', error?: string) {
    try {
      const updateData: any = { status };
      if (error) {
        updateData.error = error;
      }

      await storage.updatePrintJob(jobId, updateData);

      if (status === 'completed') {
        console.log(`✅ Trabajo ${jobId} completado por el cliente`);
      } else if (status === 'failed') {
        console.log(`❌ Trabajo ${jobId} falló en el cliente: ${error || 'Error desconocido'}`);
      }

    } catch (error) {
      console.error(`Error actualizando estado del trabajo ${jobId}:`, error);
    }
  }

  /**
   * Obtener estadísticas del procesador
   */
  async getStats() {
    const allJobs = await storage.listPrintJobs();
    const pending = allJobs.filter(j => j.status === 'pending').length;
    const readyForClient = allJobs.filter(j => j.status === 'ready_for_client').length;
    const processing = allJobs.filter(j => j.status === 'processing').length;
    const completed = allJobs.filter(j => j.status === 'completed').length;
    const failed = allJobs.filter(j => j.status === 'failed').length;

    return {
      isRunning: this.isRunning,
      automaticProcessing: false, // DESHABILITADO
      mode: 'manual_only',
      pendingJobs: pending,
      readyForClientJobs: readyForClient,
      processingJobs: processing,
      completedJobs: completed,
      failedJobs: failed,
      pollInterval: this.POLL_INTERVAL,
      note: 'Procesamiento automático DESHABILITADO - solo procesamiento inmediato y polling reactivo del cliente'
    };
  }
}

// Instancia singleton
export const printProcessor = new PrintProcessor();

// Iniciar automáticamente cuando se carga el módulo
printProcessor.start();

export default printProcessor;