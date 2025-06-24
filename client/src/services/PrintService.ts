import { io, Socket } from 'socket.io-client';
import { initQzTray, isQzTrayConnected, printData, updateJobStatus } from '@/lib/qz-tray';

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
  createdAt: string;
}

class PrintService {
  private socket: Socket | null = null;
  private isInitialized = false;
  private processedJobs = new Set<number>();
  private processingJobs = new Set<number>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private currentUserId: number | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPollingActive = false;

  async initialize() {
    if (this.isInitialized) {
      console.log('🔄 PrintService ya está inicializado');
      return;
    }

    console.log('🚀 ========== INICIALIZANDO PRINTSERVICE (SISTEMA ÚNICO) ==========');
    console.log('⚡ Este es el ÚNICO sistema de procesamiento automático activo');
    console.log('🚫 Todos los demás sistemas de polling están DESHABILITADOS');

    try {
      // Buscar API key en múltiples ubicaciones posibles
      console.log('🔑 Verificando disponibilidad de API key...');
      let apiKey = localStorage.getItem('apiKey') || 
                   localStorage.getItem('api_key') || 
                   sessionStorage.getItem('apiKey') ||
                   sessionStorage.getItem('api_key');

      // Si no encontramos la API key, intentar obtenerla del contexto de autenticación
      if (!apiKey) {
        console.log('🔍 API key no encontrada en storage, verificando contexto...');
        // Intentar extraer de headers de peticiones previas
        const authHeaders = document.querySelector('meta[name="api-key"]')?.getAttribute('content');
        if (authHeaders) {
          apiKey = authHeaders;
        }
      }

      if (!apiKey) {
        console.log('⚠️ API key no disponible aún, reintentando en 3 segundos...');
        console.log('📋 Ubicaciones verificadas: localStorage.apiKey, localStorage.api_key, sessionStorage.apiKey, sessionStorage.api_key');
        setTimeout(() => this.initialize(), 3000);
        return;
      }
      console.log(`✅ API key encontrada: ${apiKey.substring(0, 8)}...`);

      // Conectar QZ Tray primero
      console.log('🔗 Conectando con QZ Tray...');
      const qzConnected = await initQzTray();
      if (!qzConnected) {
        console.error('❌ No se pudo conectar con QZ Tray');
        // Reintentamos en 5 segundos
        setTimeout(() => this.initialize(), 5000);
        return;
      }
      console.log('✅ QZ Tray conectado exitosamente');

      // Desconectar socket existente si hay
      if (this.socket) {
        console.log('🔄 Desconectando socket existente...');
        this.socket.disconnect();
        this.socket = null;
      }

      // Conectar WebSocket SOLO cuando ya tenemos API key
      console.log('🔗 Conectando WebSocket con API key disponible...');
      this.socket = io(window.location.origin, {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
        transports: ['websocket', 'polling'], // Permitir websocket y polling
        upgrade: true, // Permitir upgrade a websocket
        rememberUpgrade: true, // Recordar el upgrade para siguientes conexiones
        closeOnBeforeunload: false // Mantener conexión activa al cambiar ventanas
      });

      this.setupEventListeners();
      this.isInitialized = true;
      this.reconnectAttempts = 0;

      // Exponer socket globalmente para debugging
      (window as any).printService = this;
      console.log('🔧 [DEBUG] PrintService expuesto globalmente como window.printService');

      console.log('✅ SERVICIO DE IMPRESIÓN INICIALIZADO CORRECTAMENTE');

      // Debug periódico del estado del socket
      setInterval(() => {
        console.log(`🔍 [SOCKET-STATUS] Socket ID: ${this.socket?.id}, Conectado: ${this.socket?.connected}, Usuario: ${this.currentUserId}`);
      }, 30000);

      // Iniciar sistema de polling automático
      this.startPolling();
    } catch (error) {
      console.error('❌ Error inicializando PrintService:', error);
      // Reintentar en 5 segundos
      setTimeout(() => this.initialize(), 5000);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Conexión establecida
    this.socket.on('connect', async () => {
      console.log('✅ ========== WEBSOCKET CONECTADO (PRINTSERVICE) ==========');
      console.log('🆔 Socket ID:', this.socket?.id);
      console.log('🚀 ÚNICO sistema de procesamiento activo');
      this.reconnectAttempts = 0;

      // Intentar autenticación inmediatamente
      this.authenticateSocket();

      console.log('📋 ✅ Esperando confirmación de registro de usuario');
      console.log('⚡ Procesamiento inmediato habilitado');

      // Enviar heartbeat cada 30 segundos para mantener conexión activa
      setInterval(() => {
        if (this.socket?.connected) {
          this.socket.emit('heartbeat');
        }
      }, 30000);
    });

    this.socket.on('authenticated', (response) => {
      if (response.success) {
        console.log(`✅ ========== USUARIO AUTENTICADO EN WEBSOCKET (PrintService) ==========`);
        console.log(`👤 Usuario ID: ${response.userId}`);
        console.log(`👤 Username: ${response.username}`);
        console.log(`🔌 Socket ID: ${this.socket?.id}`);
        console.log(`🚀 NOTIFICACIONES DIRIGIDAS HABILITADAS`);

        this.currentUserId = response.userId;

        this.socket?.emit('ready-for-jobs', { 
          userId: response.userId, 
          timestamp: Date.now() 
        });

        console.log(`🎉 ========== PRINTSERVICE OPERATIVO POST-AUTENTICACIÓN ==========`);
      } else {
        console.error(`❌ ========== ERROR EN AUTENTICACIÓN WEBSOCKET (PrintService) ==========`);
        console.error(`💥 Respuesta del servidor:`, response);
        console.warn(`🔄 Reintentando autenticación en 5 segundos...`);
        setTimeout(() => {
          this.authenticateSocket();
        }, 5000);
      }
    });

    // Debug temporal - agregar ANTES del listener new-print-job
    console.log('🔧 [DEBUG] Configurando listener new-print-job...');
    this.socket.onAny((eventName, ...args) => {
      console.log(`📡 [DEBUG] Evento recibido: ${eventName}`, args);
    });

    // Listener para nuevos trabajos de impresión - FUNCIONAL COMPLETO
    this.socket.off('new-print-job'); 
    this.socket.on('new-print-job', async (job: PrintJob) => {
      console.log(`🎯 [WEBSOCKET] ========== NUEVO TRABAJO RECIBIDO VIA WEBSOCKET ==========`);
      console.log(`⏰ [WEBSOCKET] Timestamp: ${new Date().toISOString()}`);
      console.log(`🔌 [WEBSOCKET] Socket ID: ${this.socket?.id}`);
      console.log(`👤 [WEBSOCKET] Usuario actual: ${this.currentUserId}`);
      console.log(`📋 [WEBSOCKET] ID: ${job.id}`);
      console.log(`📄 [WEBSOCKET] Documento: ${job.documentName}`);
      console.log(`📊 [WEBSOCKET] Estado: ${job.status}`);
      console.log(`🖨️ [WEBSOCKET] Impresora: ${job.printerName}`);

      // Verificar autenticación
      if (!this.currentUserId) {
        console.warn(`⚠️ [WEBSOCKET] Usuario no autenticado - reintentando autenticación`);
        this.authenticateSocket();
        return;
      }

      // Verificar QZ Tray
      if (!isQzTrayConnected()) {
        console.log(`⚠️ [WEBSOCKET] QZ Tray no conectado - intentando reconectar`);
        try {
          const reconnected = await initQzTray();
          if (!reconnected) {
            console.error(`❌ [WEBSOCKET] No se pudo reconectar QZ Tray para trabajo ${job.id}`);
            return;
          }
          console.log(`✅ [WEBSOCKET] QZ Tray reconectado exitosamente`);
        } catch (error) {
          console.error(`❌ [WEBSOCKET] Error reconectando QZ Tray:`, error);
          return;
        }
      }

      // Confirmar recepción del job
      this.socket?.emit('job-received', {
        jobId: job.id, 
        status: 'received_by_client', 
        timestamp: Date.now()
      });

      // Procesar si está listo
      if (job.status === 'ready_for_client') {
        console.log(`🚀 [WEBSOCKET] Trabajo ${job.id} listo - procesando inmediatamente`);
        await this.processJobImmediately(job);
      } else {
        console.log(`⏭️ [WEBSOCKET] Trabajo ${job.id} no listo (estado: ${job.status}) - esperando`);
      }
    });
    console.log(`✅ [PRINTSERVICE] Listener principal para 'new-print-job' configurado.`);

    // Reconexión
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 WebSocket reconectado después de ${attemptNumber} intentos (PrintService)`);
      // La autenticación se manejará con el evento 'connect' si es necesario.
      // this.socket?.emit('subscribe-print-jobs'); // Esto podría ser específico de una sala, verificar si es necesario
    });

    // Error de conexión
    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error(`❌ ========== ERROR DE CONEXIÓN WEBSOCKET ==========`);
      console.error(`💥 Intento ${this.reconnectAttempts}/${this.maxReconnectAttempts}:`, error);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('💀 Máximo de reintentos alcanzado, reinicializando completamente...');
        this.isInitialized = false;
        this.currentUserId = null;
        setTimeout(() => this.initialize(), 10000);
      }
    });

    // Timeout de autenticación
    this.socket.on('auth_timeout', () => {
      console.error('⏰ ========== TIMEOUT DE AUTENTICACIÓN WEBSOCKET ==========');
      console.error('💥 El servidor cerró la conexión por timeout de autenticación');
      this.isInitialized = false;
      this.currentUserId = null;
      this.socket?.disconnect();

      // Reintentar en 5 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando inicialización después de timeout...');
        this.initialize();
      }, 5000);
    });

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.error('❌ ========== WEBSOCKET DESCONECTADO ==========');
      console.error('💥 Razón:', reason);
      console.error('🔌 Socket ID:', this.socket?.id);
      console.error('👤 Usuario ID perdido:', this.currentUserId);

      // Reset del estado de usuario
      this.currentUserId = null;

      if (reason === 'io server disconnect') {
        // Servidor cerró la conexión, reintentar manualmente
        console.log('🔄 Servidor cerró la conexión, reintentando...');
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.connect();
          }
        }, 2000);
      } else if (reason === 'transport close' || reason === 'transport error') {
        // Problemas de transporte, reinicializar completamente
        console.log('🔄 Problema de transporte, reinicializando en 5 segundos...');
        this.isInitialized = false;
        setTimeout(() => this.initialize(), 5000);
      }
    });

    // Heartbeat para verificar conexión
    this.socket.on('heartbeat-ack', (data) => {
      console.log('💓 Heartbeat ACK recibido:', data.timestamp);
    });

    // Verificación de conexión post-autenticación
    this.socket.on('connection-verified', (data) => {
      console.log('🧪 ========== VERIFICACIÓN DE CONEXIÓN RECIBIDA ==========');
      console.log('📡 [PRINTSERVICE] Datos:', data);
      console.log('✅ [PRINTSERVICE] WebSocket funcionando correctamente para notificaciones');
      console.log('🎯 [PRINTSERVICE] Sistema listo para recibir trabajos de impresión');
    });

    // Listener catch-all para debugging - captura TODOS los eventos
    this.socket.onAny((eventName, ...args) => {
      console.log(`🔍 [SOCKET-DEBUG] ========== EVENTO RECIBIDO ==========`);
      console.log(`📣 [SOCKET-DEBUG] Evento: ${eventName}`);
      console.log(`🕐 [SOCKET-DEBUG] Timestamp: ${new Date().toISOString()}`);
      console.log(`🔌 [SOCKET-DEBUG] Socket ID: ${this.socket?.id}`);
      console.log(`👤 [SOCKET-DEBUG] Usuario actual: ${this.currentUserId}`);
      console.log(`🔗 [SOCKET-DEBUG] Socket conectado: ${this.socket?.connected}`);

      // Log detallado de argumentos
      if (args.length > 0) {
        console.log(`📦 [SOCKET-DEBUG] Argumentos (${args.length}):`);
        args.forEach((arg, index) => {
          if (typeof arg === 'object' && arg !== null) {
            // Para objetos, mostrar propiedades principales
            const keys = Object.keys(arg);
            console.log(`   [${index}] Objeto con ${keys.length} propiedades: {${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}}`);

            // Si es un job, mostrar detalles específicos
            if (arg.id && arg.documentName) {
              console.log(`       📄 Job ID: ${arg.id}, Documento: ${arg.documentName}, Estado: ${arg.status}`);
            }
          } else {
            console.log(`   [${index}] ${typeof arg}: ${arg}`);
          }
        });
      } else {
        console.log(`📦 [SOCKET-DEBUG] Sin argumentos`);
      }

      // Análisis especial para eventos de print jobs
      if (eventName === 'new-print-job') {
        console.log(`🎯 [SOCKET-DEBUG] ========== EVENTO new-print-job DETECTADO ==========`);
        console.log(`⚠️ [SOCKET-DEBUG] Este evento debería ser procesado por el listener específico`);
        console.log(`🔍 [SOCKET-DEBUG] Verificando si hay listener específico registrado...`);

        const job = args[0];
        if (job) {
          console.log(`📋 [SOCKET-DEBUG] Datos del job:`);
          console.log(`   ID: ${job.id}`);
          console.log(`   Documento: ${job.documentName}`);
          console.log(`   Estado: ${job.status}`);
          console.log(`   Impresora: ${job.printerName}`);
          console.log(`   Tiene datos QZ: ${!!job.qzTrayData}`);

          if (job.status === 'ready_for_client') {
            console.log(`🚀 [SOCKET-DEBUG] Job listo para procesar - verificando si se procesó por listener específico`);

            // Dar tiempo al listener específico, luego verificar si se procesó
            setTimeout(() => {
              if (!this.processedJobs.has(job.id) && !this.processingJobs.has(job.id)) {
                console.log(`❌ [SOCKET-DEBUG] Job ${job.id} NO fue procesado por listener específico - FORZANDO`);
                this.processJobImmediately(job).catch(error => {
                  console.error(`❌ [SOCKET-DEBUG] Error en procesamiento forzado:`, error);
                });
              } else {
                console.log(`✅ [SOCKET-DEBUG] Job ${job.id} fue procesado correctamente por listener específico`);
              }
            }, 1000);
          }
        }
      }

      // Log de otros eventos importantes
      if (['authenticated', 'connect', 'disconnect', 'connection-verified'].includes(eventName)) {
        console.log(`🔥 [SOCKET-DEBUG] Evento importante detectado: ${eventName}`);
      }
    });
  }

  async processJobImmediately(jobData: PrintJob): Promise<void> {
    console.log(`🖨️ ========== PROCESANDO TRABAJO INMEDIATO ${jobData.id} ==========`);
    console.log(`📄 Documento: ${jobData.documentName}`);
    console.log(`🖨️ Impresora: ${jobData.printerName}`);
    console.log(`📊 Estado recibido: ${jobData.status}`);

    // Mark as currently processing
    this.processingJobs.add(jobData.id);

    try {
      // Verificar que QZ Tray esté conectado
      console.log('🔍 Verificando estado de QZ Tray...');
      if (!isQzTrayConnected()) {
        throw new Error('QZ Tray no está conectado');
      }

      // Actualizar estado a processing
      console.log(`📊 Actualizando trabajo ${jobData.id} a estado 'processing'...`);
      await updateJobStatus(jobData.id, 'processing');

      // Verificar si el trabajo tiene datos QZ preconfigurados
      if (jobData.qzTrayData && jobData.status === 'ready_for_client') {
        console.log(`🚀 Trabajo ${jobData.id} tiene datos QZ preconfigurados - PROCESAMIENTO DIRECTO`);

        const qzData = typeof jobData.qzTrayData === 'string' ? JSON.parse(jobData.qzTrayData) : jobData.qzTrayData;

        console.log(`📋 Datos QZ a procesar:`, {
          printer: qzData.printer,
          dataCount: qzData.data?.length || 0,
          config: qzData.config
        });

        // IMPRIMIR CON QZ TRAY - IGUAL QUE EL CÓDIGO MANUAL QUE FUNCIONÓ
        const config = qz.configs.create(jobData.printerName, qzData.config);
        const printData = qzData.data;

        console.log(`📤 Enviando trabajo ${jobData.id} a impresora ${jobData.printerName}`);
        await qz.print(config, printData);

        console.log(`✅ Trabajo ${jobData.id} enviado exitosamente a la impresora`);
        await updateJobStatus(jobData.id, 'completed');
        console.log(`✅ Trabajo ${jobData.id} marcado como completado`);

        // Marcar como procesado para evitar duplicados
        this.processedJobs.add(jobData.id);
        this.processingJobs.delete(jobData.id);

        console.log(`🎉 ========== TRABAJO ${jobData.id} COMPLETADO EXITOSAMENTE ==========`);

      } else {
        console.warn(`⚠️ Trabajo ${jobData.id} no tiene datos QZ preconfigurados o estado incorrecto`);
        throw new Error("Datos de impresión no válidos o incompletos");
      }

    } catch (error) {
      console.error(`❌ ========== ERROR PROCESANDO TRABAJO ${jobData.id} ==========`);
      console.error('💥 Error:', error);

      // Remove from processing set on error
      this.processingJobs.delete(jobData.id);

      try {
        await updateJobStatus(jobData.id, 'failed', error.message);
      } catch (updateError) {
        console.error('❌ Error actualizando estado a failed:', updateError);
      }

      throw error;
    }
  }

  // Método para mantener la conexión activa
  startKeepAlive() {
    // Ping cada 30 segundos para mantener conexión SIEMPRE
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000);

    // Verificar visibilidad de la página - SOLO para logging, no para reinicializar
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('👁️ Página oculta - websocket debe seguir funcionando');
      } else {
        console.log('👁️ Página visible - websocket activo');
        // Solo reinicializar si realmente no está inicializado
        if (!this.isInitialized) {
          console.log('📱 Página visible y servicio no inicializado, reinicializando...');
          this.initialize();
        }
      }
    });

    // Verificar conexión periódicamente - INDEPENDIENTE de visibilidad
    setInterval(() => {
      if (this.isInitialized && (!this.socket || !this.socket.connected)) {
        console.log('🔄 Conexión perdida, reintentando...');
        this.isInitialized = false;
        this.initialize();
      }
    }, 10000);
  }

  disconnect() {
    console.log('🛑 Desconectando PrintService...');
    this.socket?.disconnect();
    this.isInitialized = false;
    this.processedJobs.clear();
  }

  // Métodos para obtener estado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getProcessedJobsCount(): number {
    return this.processedJobs.size;
  }

  // Método para autenticar después de que la API key esté disponible
  authenticate() {
    this.authenticateSocket();
  }

  // Método robusto de autenticación
  private authenticateSocket() {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket no conectado, no se puede autenticar');
      return;
    }

    let apiKey = localStorage.getItem('apiKey') || 
                 localStorage.getItem('api_key') || 
                 sessionStorage.getItem('apiKey') ||
                 sessionStorage.getItem('api_key');

    if (apiKey) {
      console.log(`🔐 ========== INICIANDO AUTENTICACIÓN ==========`);
      console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
      console.log(`🔌 Socket ID: ${this.socket?.id}`);
      console.log(`🔗 Socket conectado: ${this.socket?.connected}`);

      this.socket.emit('authenticate', { apiKey });
      console.log('📡 ✅ Evento de autenticación enviado al servidor');

      // Timeout para verificar autenticación
      setTimeout(() => {
        if (this.currentUserId === null) {
          console.warn('⚠️ Autenticación no completada en 10 segundos, reintentando...');
          this.authenticateSocket();
        }
      }, 10000);
    } else {
      console.error('❌ FATAL: API key no disponible para autenticación');
      console.error('📋 Ubicaciones verificadas: localStorage.apiKey, localStorage.api_key, sessionStorage');

      // Reintentar en 3 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando obtener API key para autenticación...');
        this.authenticateSocket();
      }, 3000);
    }
  }

  // Obtener información del usuario desde la API
  private async getUserInfoFromAPI(): Promise<{userId: number} | null> {
    try {
      const apiKey = localStorage.getItem('apiKey')|| localStorage.getItem('api_key');
      if (!apiKey) return null;

      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        return { userId: userData.id };
      }
    } catch (error) {
      console.error('Error obteniendo info de usuario:', error);
    }
    return null;
  }

  // Obtener información del usuario desde localStorage (fallback)
  private getUserInfoFromStorage() {
    try {
      // Intentar obtener del sessionStorage si se guardó ahí
      const userDataStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return { userId: userData.id };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo info de usuario desde storage:', error);
      return null;
    }
  }

  // Sistema de polling para trabajos pendientes
  startPolling() {
    if (this.isPollingActive) {
      console.log('🔄 Polling ya está activo');
      return;
    }

    console.log('🚀 ========== INICIANDO SISTEMA DE POLLING AUTOMÁTICO ==========');
    console.log('⚡ Revisando trabajos pendientes cada 20 segundos (backup del websocket)');

    this.isPollingActive = true;

    this.pollingInterval = setInterval(async () => {
      try {
        await this.checkPendingJobs();
      } catch (error) {
        console.error('❌ Error en polling:', error);
      }
    }, 20000); // 3 segundos para backup rápido del websocket
  }

  private async checkPendingJobs() {
    console.log('🔄 [POLLING] ========== EJECUTANDO POLLING ==========');
    console.log('🕐 [POLLING] Timestamp:', new Date().toISOString());

    if (!isQzTrayConnected()) {
      console.log('❌ [POLLING] QZ Tray no conectado, saltando polling');
      return;
    }

    console.log('✅ [POLLING] QZ Tray conectado, continuando...');

    try {
      const apiKey = localStorage.getItem('apiKey')|| localStorage.getItem('api_key');
      if (!apiKey) {
        console.log('❌ [POLLING] No hay API key, saltando polling');
        return;
      }

      console.log('✅ [POLLING] API key disponible, haciendo request...');

      const response = await fetch('/api/print-jobs/pending', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      console.log(`📊 [POLLING] Response status: ${response.status}`);

      if (!response.ok) {
        console.error(`❌ [POLLING] Error HTTP: ${response.status}`);
        return;
      }

      const jobs = await response.json();
      console.log(`📋 [POLLING] Trabajos obtenidos:`, jobs);

      if (jobs.length > 0) {
        console.log(`🔥 [POLLING] Encontrados ${jobs.length} trabajos pendientes`);

        for (const job of jobs) {
          console.log(`🖨️ [POLLING] Evaluando trabajo ${job.id}: ${job.documentName}`);
          console.log(`📊 [POLLING] Procesado: ${this.processedJobs.has(job.id)}, Procesando: ${this.processingJobs.has(job.id)}`);

          if (!this.processedJobs.has(job.id) && !this.processingJobs.has(job.id)) {
            console.log(`🖨️ [POLLING] Procesando trabajo ${job.id}: ${job.documentName}`);
            await this.processJobImmediately(job);
          } else {
            console.log(`⏭️ [POLLING] Trabajo ${job.id} ya procesado o en proceso`);
          }
        }
      } else {
        console.log('📭 [POLLING] No hay trabajos pendientes');
      }
    } catch (error) {
      console.error('❌ [POLLING] Error:', error);
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPollingActive = false;
      console.log('🛑 Sistema de polling detenido');
    }
  }
}

// Instancia singleton
export const printService = new PrintService();

// NOTA: La inicialización se hace desde App.tsx para evitar duplicaciones

export default printService;