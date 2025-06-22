// server/websocket.ts - WebSocket mejorado con reconexión y garantías

import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface PrintJobEvent {
  id: number;
  documentName: string;
  documentUrl: string;
  printerName: string;
  printerUniqueId: string;
  status: string;
  timestamp: number;
}

// Cola de eventos para garantizar entrega
class EventQueue {
  private queue: Map<string, PrintJobEvent[]> = new Map();

  addEvent(clientId: string, event: PrintJobEvent) {
    if (!this.queue.has(clientId)) {
      this.queue.set(clientId, []);
    }
    this.queue.get(clientId)!.push(event);
  }

  getAndClearEvents(clientId: string): PrintJobEvent[] {
    const events = this.queue.get(clientId) || [];
    this.queue.delete(clientId);
    return events;
  }
}

// Variables globales inicializadas ANTES de cualquier función
let socketServer: Server | null = null;
let globalUserSockets: Map<string, string> = new Map();
// Tracking de usuarios activos con información detallada
let activeUsers = new Map<string, {
  socketId: string;
  username: string;
  userId: string;
  joinTime: Date;
  lastActivity: Date;
}>();

// Función para broadcastear estadísticas de usuarios
function broadcastUserStats() {
  if (!socketServer) return;

  const stats = {
    totalActive: activeUsers.size,
    users: Array.from(activeUsers.values()).map(user => ({
      username: user.username,
      userId: user.userId,
      joinTime: user.joinTime.toISOString(),
      lastActivity: user.lastActivity.toISOString(),
      duration: Math.floor((Date.now() - user.joinTime.getTime()) / 1000) // segundos conectado
    })),
    timestamp: new Date().toISOString()
  };

  // Emitir a todos los clientes conectados
  socketServer.emit('userStatsUpdate', stats);
  console.log(`📊 [WS] Stats broadcasting: ${stats.totalActive} usuarios activos`);
}

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Configuración para reconexión confiable
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Configurar variables globales INMEDIATAMENTE
  socketServer = io;
  globalUserSockets.clear();

  const eventQueue = new EventQueue();
  const connectedClients = new Map<string, string>(); // socketId -> userId

  console.log(`🌐 [WS] ========== CONFIGURACIÓN GLOBAL INICIAL ==========`);
  console.log(`✅ [WS] socketServer configurado: ${!!socketServer}`);
  console.log(`✅ [WS] globalUserSockets inicializado: ${!!globalUserSockets}`);
  

  io.on('connection', (socket) => {
    console.log(`🔌 [WS] ========== NUEVA CONEXIÓN WEBSOCKET ==========`);
    console.log(`🆔 [WS] Cliente ID: ${socket.id}`);
    console.log(`⚡ [WS] Sistema único de procesamiento activo`);

    // Timeout para autenticación
    const authTimeout = setTimeout(() => {
      console.log(`⏰ [WS] Timeout de autenticación para socket ${socket.id} - desconectando`);
      socket.emit('auth_timeout', { message: 'Tiempo de autenticación agotado' });
      socket.disconnect();
    }, 10000);

    // Autenticación
    socket.on('authenticate', async (data) => {
      clearTimeout(authTimeout);
      const { apiKey } = data;

      console.log(`🔐 [WS] ========== INTENTO DE AUTENTICACIÓN ==========`);
      console.log(`🔑 [WS] API Key recibida: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NINGUNA'}`);
      console.log(`🔌 [WS] Socket ID: ${socket.id}`);

      if (!apiKey) {
        console.log(`❌ [WS] API Key faltante`);
        socket.emit('authenticated', { 
          success: false, 
          error: 'API Key requerida para autenticación' 
        });
        socket.disconnect();
        return;
      }

      try {
        const user = await validateApiKeyWS(apiKey);
        if (user) {
          const userId = user.id.toString();

          // Limpiar conexiones previas del usuario
          const existingSocketId = globalUserSockets.get(userId);
          if (existingSocketId && existingSocketId !== socket.id) {
            console.log(`🔄 [WS] Removiendo conexión previa del usuario ${user.id}: ${existingSocketId}`);
            connectedClients.delete(existingSocketId);

            // Desconectar socket anterior si aún existe
            const oldSocket = io.sockets.sockets.get(existingSocketId);
            if (oldSocket) {
              oldSocket.disconnect(true);
            }
          }

          // Registrar usuario SINCRONIZADO
          connectedClients.set(socket.id, userId);
          globalUserSockets.set(userId, socket.id);

          // Unirse a salas
          socket.join('print-jobs');
          socket.join(`user-${user.id}`);

          console.log(`✅ [WS] ========== AUTENTICACIÓN EXITOSA ==========`);
          console.log(`👤 [WS] Usuario: ${user.username} (ID: ${user.id})`);
          console.log(`🔌 [WS] Socket: ${socket.id}`);
          console.log(`🏠 [WS] Salas: print-jobs, user-${user.id}`);
          console.log(`📊 [WS] Clientes conectados ahora: ${connectedClients.size}`);
          console.log(`🚀 [WS] NOTIFICACIONES DIRIGIDAS HABILITADAS`);
          // NUEVO: Agregar usuario a tracking activo
          activeUsers.set(userId, {
            socketId: socket.id,
            username: user.username,
            userId: userId,
            joinTime: new Date(),
            lastActivity: new Date()
          });

          // NUEVO: Broadcastear estadísticas actualizadas
          broadcastUserStats();
          // Verificación INMEDIATA con logs detallados
          console.log(`🔬 [WS] ========== VERIFICACIÓN POST-AUTH ==========`);
          console.log(`🗺️ [WS] Mapeo globalUserSockets:`);
          globalUserSockets.forEach((socketId, userId) => {
            const socketExists = io.sockets.sockets.get(socketId);
            console.log(`   👤 Usuario ${userId} -> Socket ${socketId} (${socketExists ? 'EXISTE' : 'NO EXISTE'})`);
          });

          const testSocketId = globalUserSockets.get(userId);
          const testSocketExists = io.sockets.sockets.get(testSocketId || '');
          console.log(`✅ [WS] Verificación usuario ${userId}: Socket=${testSocketId}, Existe=${!!testSocketExists}, Conectado=${testSocketExists?.connected}`);

          // Enviar eventos pendientes
          const pendingEvents = eventQueue.getAndClearEvents(userId);
          if (pendingEvents.length > 0) {
            console.log(`📤 [WS] Enviando ${pendingEvents.length} eventos pendientes a ${user.username}`);
            pendingEvents.forEach(event => {
              socket.emit('new-print-job', event);
            });
          }

          // Confirmar autenticación al cliente
          socket.emit('authenticated', { 
            success: true, 
            userId: user.id,
            username: user.username,
            socketId: socket.id,
            rooms: ['print-jobs', `user-${user.id}`]
          });

          // Ping de verificación
          setTimeout(() => {
            console.log(`🧪 [WS] Enviando ping de verificación a usuario ${user.username}`);
            socket.emit('connection-verified', { 
              timestamp: Date.now(), 
              message: 'Conexión WebSocket verificada correctamente' 
            });
          }, 1000);

        } else {
          console.log(`❌ [WS] Autenticación fallida: Usuario no encontrado con API key`);
          socket.emit('authenticated', { 
            success: false, 
            error: 'Usuario no encontrado con la API key proporcionada' 
          });
          socket.disconnect();
        }
      } catch (error) {
        console.error('❌ [WS] Error de autenticación:', error);
        socket.emit('authenticated', { 
          success: false, 
          error: 'Error interno del servidor durante autenticación' 
        });
        socket.disconnect();
      }
    });

    // Heartbeat para verificar conexión
    socket.on('heartbeat', () => {
      const userId = connectedClients.get(socket.id);
      if (userId && activeUsers.has(userId)) {
        const userInfo = activeUsers.get(userId)!;
        userInfo.lastActivity = new Date();
        activeUsers.set(userId, userInfo);
      }
      socket.emit('heartbeat-ack', { timestamp: Date.now() });
    });

    // Desconexión con limpieza completa
    socket.on('disconnect', (reason) => {
      const userId = connectedClients.get(socket.id);
      if (userId) {
        connectedClients.delete(socket.id);
        globalUserSockets.delete(userId);
        console.log(`🔌 [WS] Cliente desconectado: ${socket.id} - Usuario: ${userId} (${reason})`);
        console.log(`🧹 [WS] Mapeos limpiados para usuario ${userId}`);
        activeUsers.delete(userId);

        // NUEVO: Broadcastear estadísticas actualizadas
        broadcastUserStats();
      }
    });
  });

  // Función SIMPLIFICADA y ROBUSTA para obtener socket de usuario
  const getUserSocketRobust = (userId: string): string | undefined => {
    if (!globalUserSockets || !socketServer) {
      console.log(`❌ [getUserSocket] Variables globales no disponibles`);
      return undefined;
    }

    const socketId = globalUserSockets.get(userId);
    if (!socketId) {
      console.log(`❌ [getUserSocket] No hay socket mapeado para usuario ${userId}`);
      return undefined;
    }

    const socket = socketServer.sockets.sockets.get(socketId);
    if (!socket || !socket.connected) {
      console.log(`❌ [getUserSocket] Socket ${socketId} no existe o no está conectado - limpiando mapeo`);
      globalUserSockets.delete(userId);
      return undefined;
    }

    console.log(`✅ [getUserSocket] Socket ${socketId} VÁLIDO para usuario ${userId}`);
    return socketId;
  };

  // Función para emitir eventos solo al usuario dueño del trabajo
  const emitPrintJobToUser = (job: PrintJobEvent, userId: number) => {
    console.log(`📡 [WS] ========== NOTIFICACIÓN DIRIGIDA ==========`);
    console.log(`📄 [WS] Trabajo ${job.id}: ${job.documentName}`);
    console.log(`👤 [WS] Usuario destinatario: ${userId}`);

    const userSocketId = getUserSocketRobust(userId.toString());

    if (userSocketId) {
      io.to(userSocketId).emit('new-print-job', job);
      console.log(`✅ [WS] Notificación enviada al usuario ${userId} (socket: ${userSocketId})`);
    } else {
      console.log(`⚠️ [WS] Usuario ${userId} no está conectado, agregando a cola`);
      eventQueue.addEvent(userId.toString(), job);
    }
  };

  // Función legacy para compatibilidad
  const emitPrintJob = (job: PrintJobEvent, userId?: number) => {
    if (userId) {
      emitPrintJobToUser(job, userId);
    } else {
      console.log(`⚠️ [WS] emitPrintJob llamado sin userId - usando broadcast`);
      io.to('print-jobs').emit('new-print-job', job);
    }
  };

  // Monitoreo de salud del WebSocket
  setInterval(() => {
    const rooms = io.sockets.adapter.rooms;
    const printJobsRoom = rooms.get('print-jobs');
    const clientCount = printJobsRoom?.size || 0;

    console.log(`💚 [WS] ========== ESTADO DEL WEBSOCKET ==========`);
    console.log(`👥 [WS] Clientes en sala 'print-jobs': ${clientCount}`);
    console.log(`🔌 [WS] Total conexiones: ${connectedClients.size}`);
    console.log(`👤 [WS] Usuarios mapeados: ${globalUserSockets.size}`);

    if (globalUserSockets.size > 0) {
      console.log(`📋 [WS] Usuarios conectados:`);
      globalUserSockets.forEach((socketId, userId) => {
        const socketExists = io.sockets.sockets.get(socketId) ? 'ACTIVO' : 'INACTIVO';
        console.log(`   - Usuario ${userId}: Socket ${socketId} (${socketExists})`);
      });
    } else {
      console.log(`⚠️ [WS] NO HAY USUARIOS CONECTADOS - Los trabajos se procesarán por polling`);
      if (activeUsers.size > 0) {
        broadcastUserStats();
      }
    }
  }, 30000);

  // Configurar función global con la función robusta
  (global as any).getUserSocket = getUserSocketRobust;

  console.log(`🔧 [WS] Función getUserSocket configurada con manejo robusto`);

  return {
    io,
    emitPrintJob,
    emitPrintJobToUser,
    getConnectedClients: () => connectedClients.size,
    getUserSocket: getUserSocketRobust
  };
}

export function setSocketServer(io: Server) {
  socketServer = io;
}

// Función auxiliar para validar API key
async function validateApiKeyWS(apiKey: string) {
  const { storage } = await import('./storage.js');
  return await storage.getUserByApiKey(apiKey);
}

import { User } from '../models/user.js';
import { PrintJob } from '../models/printJob.js';

export function getActiveUsersCount(): number {
  return activeUsers.size;
}

export function getActiveUsers() {
  return Array.from(activeUsers.values());
}

export async function notifyUser(user: User, printJob: PrintJob) {
  if (!socketServer) {
    console.warn('Socket server no inicializado. Notificaciones vía WebSocket deshabilitadas.');
    return;
  }

  const jobData: PrintJobEvent = {
    id: printJob.id,
    documentName: printJob.documentName,
    documentUrl: printJob.documentUrl,
    printerName: printJob.printerName,
    printerUniqueId: printJob.printerUniqueId,
    status: printJob.status,
    timestamp: printJob.createdAt.getTime()
  };

  console.log(`🔍 [NOTIF] ========== VERIFICANDO NOTIFICACIÓN ==========`);
  console.log(`👤 [NOTIF] Usuario: ${user.username} (ID: ${user.id})`);
  console.log(`📄 [NOTIF] Trabajo: ${printJob.documentName} (ID: ${printJob.id})`);

  // Usar la función global robusta
  const userSocketId = (global as any).getUserSocket?.(user.id.toString());
  console.log(`🔌 [NOTIF] Socket ID obtenido: ${userSocketId || 'NINGUNO'}`);

  if (userSocketId) {
    // Enviar notificación directa
    socketServer.to(userSocketId).emit('new-print-job', jobData);
    console.log(`📡 [NOTIF] ✅ Trabajo ${printJob.id} notificado EXITOSAMENTE al usuario ${user.username}`);

    // Verificación final
    const socket = socketServer.sockets.sockets.get(userSocketId);
    if (socket) {
      console.log(`🔍 [NOTIF] Confirmación: Socket conectado=${socket.connected}, salas=${Array.from(socket.rooms)}`);
    }
    return;
  }

  // Intento de fallback: buscar por salas
  console.log(`🔄 [NOTIF] Intentando notificación por sala user-${user.id}`);
  const roomSockets = socketServer.sockets.adapter.rooms.get(`user-${user.id}`);

  if (roomSockets && roomSockets.size > 0) {
    console.log(`✅ [NOTIF] Encontrada sala user-${user.id} con ${roomSockets.size} socket(s)`);
    socketServer.to(`user-${user.id}`).emit('new-print-job', jobData);
    console.log(`📡 [NOTIF] ✅ Trabajo ${printJob.id} notificado por SALA al usuario ${user.username}`);
    return;
  }

  console.log(`⚠️ [NOTIF] ❌ Usuario ${user.username} NO CONECTADO VIA WEBSOCKET`);
  console.log(`🔄 [NOTIF] Trabajo ${printJob.id} se procesará por polling (modo fallback)`);

  // Debug para entender el problema
  const allSockets = Array.from(socketServer.sockets.sockets.keys());
  const allUserMappings = Array.from(globalUserSockets?.entries() || []);
  console.log(`🔧 [DEBUG] Total sockets: ${allSockets.length}, Usuarios mapeados: ${allUserMappings.length}`);
  console.log(`🔧 [DEBUG] Sockets activos: [${allSockets.slice(0, 3).join(', ')}]`);
  console.log(`🔧 [DEBUG] Buscando usuario: ${user.id.toString()}`);
}