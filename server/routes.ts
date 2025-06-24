import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

// ✅ IMPORTACIONES DE BASE DE DATOS - TODAS JUNTAS
import { db } from "./db";
import { companies, locations, users, printers, printJobs } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ✅ OTRAS IMPORTACIONES
import { storage } from "./storage";
import { 
  apiKeyHeaderSchema, 
  printJobRequestSchema,
  simplePrintJobRequestSchema,
  numericPrinterJobRequestSchema,
  base64PrintJobRequestSchema,
  insertUserSchema, 
  insertPrinterSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { printProcessor } from "./print-processor";
import type { Server as SocketIOServer } from "socket.io";
import { getActiveUsersCount, getActiveUsers } from './websocket.js';

// ✅ FUNCIONES HELPER (DESPUÉS DE TODAS LAS IMPORTACIONES)
function setupHealthCheck(app: Express) {
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
}

// Variable global para el socket server
let socketServer: SocketIOServer | null = null;

export function setSocketServer(io: SocketIOServer) {
  socketServer = io;
}

// Helper to extract API key from Authorization header
function extractApiKey(authHeader: string): string {
  console.log("Extracting API key from:", authHeader);
  if (!authHeader) {
    console.log("Authorization header is empty");
    return '';
  }

  // Intentamos extraer la parte después de "Bearer "
  const match = authHeader.match(/^bearer\s+(.+)$/i);
  if (match && match[1]) {
    // console.log("API key extracted from Bearer token"); // Comentado para reducir logs
    return match[1];
  }

  // Si no tiene el formato "Bearer XXX", devolvemos el valor completo
  console.log("No Bearer format found, using complete header value");
  return authHeader;
}

// Helper para validar API key y devolver usuario
async function validateApiKey(req: Request, res: Response) {
  try {
    // console.log("Headers recibidos:", req.headers); // Comentado para reducir logs

    // Verificamos si hay un header de Authorization
    if (!req.headers.authorization) {
      console.log("No se recibió header de Authorization");
      res.status(401).json({ message: "Falta encabezado de autorización" });
      return null;
    }

    // Usamos validación zod
    const { authorization } = apiKeyHeaderSchema.parse(req.headers);
    console.log("Authorization header validado:", authorization);

    // Extraemos la API key
    const apiKey = extractApiKey(authorization);
    // console.log("API key extraída:", apiKey ? `${apiKey.substring(0, 5)}...` : "Vacía"); // Comentado para reducir logs

    if (!apiKey) {
      console.log("API key extraída está vacía");
      res.status(401).json({ message: "Formato de autorización inválido" });
      return null;
    }

    // Buscamos el usuario por API key
    // console.log("Buscando usuario con API key:", apiKey.substring(0, 5) + "..."); // Comentado para reducir logs
    const user = await storage.getUserByApiKey(apiKey);

    if (!user) {
      console.log("No se encontró usuario con la API key proporcionada");
      res.status(401).json({ message: "Clave API inválida" });
      return null;
    }

    console.log("Usuario encontrado:", user.username);
    return user;
  } catch (error) {
    console.error("Error al validar API key:", error);
    res.status(401).json({ message: "Clave API faltante o inválida" });
    return null;
  }
}

// Helper para manejar errores de validación
function handleValidationError(error: unknown, res: Response) {
  // Asegurar que el Content-Type sea application/json
  res.setHeader('Content-Type', 'application/json');

  if (error instanceof ZodError) {
    const validationError = fromZodError(error);
    res.status(400).json({ message: validationError.message });
  } else if (error instanceof Error) {
    res.status(500).json({ message: error.message });
  } else {
    res.status(500).json({ message: "Ocurrió un error desconocido" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Login route
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`Intento de login - Email: ${email}`);

      if (!email || !password) {
        console.log("Error: Faltan email o password");
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      console.log(`Usuario encontrado en BD: ${user ? 'Sí' : 'No'}`);

      if (!user) {
        console.log(`Usuario con email '${email}' no existe en la base de datos`);
        return res.status(401).json({ message: "Email o contraseña inválidos" });
      }

      console.log(`Password almacenado: ${user.password}`);
      console.log(`Password proporcionado: ${password}`);
      console.log(`Passwords coinciden: ${user.password === password}`);

      if (user.password !== password) {
        console.log("Error: Contraseña incorrecta");
        return res.status(401).json({ message: "Email o contraseña inválidos" });
      }

      console.log(`Login exitoso para usuario: ${user.username} (${email})`);
      // Return the API key for the client to use in future requests
      res.json({ apiKey: user.apiKey, username: user.username, name: user.name });
    } catch (error) {
      console.error("Error en login:", error);
      handleValidationError(error, res);
    }
  });

  // Dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const allPrinters = await storage.listPrinters();
      const allUsers = await storage.listUsers();
      const allJobs = await storage.listPrintJobs();

      // Calculate statistics
      const activePrinters = allPrinters.filter(p => p.status === 'online' || p.status === 'busy').length;
      const pendingJobs = allJobs.filter(j => j.status === 'pending').length;
      const failedJobs = allJobs.filter(j => j.status === 'failed').length;

      // Count jobs created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const jobsToday = allJobs.filter(j => j.createdAt !== null && j.createdAt >= today).length;

      // MODIFICACIÓN: Obtener usuarios activos del WebSocket con detalles
      const activeUsersFromWS = getActiveUsers();
      const activeUsersCount = activeUsersFromWS.length;

      // NUEVO: Crear lista de usernames/IDs de usuarios activos para el frontend
      const activeUsersList = activeUsersFromWS.map(activeUser => ({
        userId: activeUser.userId,
        username: activeUser.username,
        joinTime: activeUser.joinTime,
        lastActivity: activeUser.lastActivity
      }));

      console.log(`📊 [STATS] Estadísticas solicitadas por ${user.username}`);
      console.log(`📊 [STATS] Usuarios activos (WebSocket): ${activeUsersCount}`);
      console.log(`📊 [STATS] Lista usuarios activos: [${activeUsersList.map(u => u.username).join(', ')}]`);
      console.log(`📊 [STATS] Impresoras activas: ${activePrinters}/${allPrinters.length}`);
      console.log(`📊 [STATS] Trabajos hoy: ${jobsToday}`);

      res.json({
        activePrinters,
        jobsToday,
        pendingJobs,
        failedJobs,
        activeUsers: activeUsersCount, // CAMBIO: Usar conteo de WebSocket
        totalPrinters: allPrinters.length,
        totalUsers: allUsers.length,
        totalJobs: allJobs.length,
        // NUEVO: Lista detallada de usuarios activos
        activeUsersList: activeUsersList
      });
    } catch (error) {
      console.error("❌ [STATS] Error calculando estadísticas:", error);
      res.status(500).json({ error: "Error fetching statistics" });
    }
  });


  // Recent activity for dashboard
  app.get("/api/recent-activity", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const recentJobs = await storage.getRecentPrintJobs(5);

      const activity = await Promise.all(recentJobs.map(async (job) => {
        const printer = await storage.getPrinter(job.printerId);
        const user = await storage.getUser(job.userId);

        return {
          id: job.id,
          documentName: job.documentName,
          printerName: printer?.name || 'Unknown Printer',
          userName: user?.name || 'Unknown User',
          createdAt: job.createdAt,
          status: job.status
        };
      }));

      res.json(activity);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const users = await storage.listUsers();
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const authenticatedUser = await validateApiKey(req, res);
      if (!authenticatedUser) return;
      if (!authenticatedUser.isAdmin) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.status(409).json({ message: "El nombre de usuario ya existe" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const authenticatedUser = await validateApiKey(req, res);
      if (!authenticatedUser) return;
      if (!authenticatedUser.isAdmin && authenticatedUser.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const userId = parseInt(req.params.id);
      const userData = req.body;

      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const authenticatedUser = await validateApiKey(req, res);
      if (!authenticatedUser) return;
      if (!authenticatedUser.isAdmin) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const userId = parseInt(req.params.id);
      if (authenticatedUser.id === userId) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.status(204).end();
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Get current user info
  app.get("/api/users/me", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        location: user.location,
        floor: user.floor
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Get current user's API key
  app.get("/api/users/me/apikey", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return; // validateApiKey handles the response if user is not valid

      const apiKey = await storage.getUserApiKey(user.id);

      if (apiKey) {
        res.json({ apiKey });
      } else {
        // This case should ideally not happen if user is validated and exists
        res.status(404).json({ message: "API key no encontrada para el usuario." });
      }
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Rotate current user's API key
  app.post("/api/users/me/apikey/rotate", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return; // validateApiKey handles the response if user is not valid

      const newApiKey = await storage.rotateUserApiKey(user.id);

      if (newApiKey) {
        res.json({ apiKey: newApiKey });
      } else {
        // This case implies user was not found during rotation, which is unexpected
        res.status(500).json({ message: "Error al rotar la API key." });
      }
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Printer routes
  app.get("/api/printers", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      let printers = await storage.listPrinters();

      // Si no es admin, filtrar por sede y empresa del usuario
      if (!user.isAdmin && (user.location || user.floor)) {
        printers = printers.filter(printer => {
          const matchLocation = !user.location || printer.location === user.location;
          const matchFloor = !user.floor || printer.floor === user.floor;
          return matchLocation && matchFloor;
        });
      }

      res.json(printers);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.post("/api/printers", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const printerData = insertPrinterSchema.parse(req.body);
      const existingPrinter = await storage.getPrinterByUniqueId(printerData.uniqueId);

      if (existingPrinter) {
        return res.status(409).json({ message: "Ya existe una impresora con este ID" });
      }

      const printer = await storage.createPrinter(printerData);
      res.status(201).json(printer);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.put("/api/printers/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const printerId = parseInt(req.params.id);
      const printerData = req.body;

      const updatedPrinter = await storage.updatePrinter(printerId, printerData);
      if (!updatedPrinter) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      res.json(updatedPrinter);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  app.delete("/api/printers/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Permiso denegado" });
      }

      const printerId = parseInt(req.params.id);
      const deleted = await storage.deletePrinter(printerId);
      if (!deleted) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      res.status(204).end();
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Get printer status
  app.get("/api/printers/:id/status", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const printerId = parseInt(req.params.id);
      const printer = await storage.getPrinter(printerId);

      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      // Para usuarios no admin, verificar permisos por ubicación
      if (!user.isAdmin) {
        const matchLocation = !user.location || printer.location === user.location;
        const matchFloor = !user.floor || printer.floor === user.floor;
        if (!matchLocation || !matchFloor) {
          return res.status(403).json({ message: "No tienes permisos para acceder a esta impresora" });
        }
      }

      // Get pending jobs for this printer
      const jobs = await storage.getPrintJobsByPrinter(printerId);
      const pendingJobs = jobs.filter(j => j.status === 'pending').length;

      res.json({
        printerId: printer.id,
        uniqueId: printer.uniqueId,
        status: printer.status,
        qzTrayConnected: printer.status !== 'offline',
        lastActivity: printer.lastPrintTime,
        pendingJobs
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Diagnóstico de impresora específica
  app.get("/api/printers/debug/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const printerId = parseInt(req.params.id);
      const printer = await storage.getPrinter(printerId);

      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      // Get all jobs for this printer
      const allJobs = await storage.getPrintJobsByPrinter(printerId);
      const pendingJobs = allJobs.filter(j => j.status === 'pending');
      const processingJobs = allJobs.filter(j => j.status === 'processing');
      const completedJobs = allJobs.filter(j => j.status === 'completed');
      const failedJobs = allJobs.filter(j => j.status === 'failed');

      res.json({
        printer: {
          id: printer.id,
          name: printer.name,
          uniqueId: printer.uniqueId,
          status: printer.status,
          location: printer.location,
          model: printer.model,
          isActive: printer.isActive,
          lastPrintTime: printer.lastPrintTime
        },
        jobs: {
          total: allJobs.length,
          pending: pendingJobs.length,
          processing: processingJobs.length,
          completed: completedJobs.length,
          failed: failedJobs.length,
          pendingJobs: pendingJobs.map(j => ({
            id: j.id,
            documentName: j.documentName,
            documentUrl: j.documentUrl,
            createdAt: j.createdAt,
            copies: j.copies,
            duplex: j.duplex,
            orientation: j.orientation
          }))
        }
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Print job routes
  app.get("/api/print-jobs", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      let jobs;
      if (user.isAdmin) {
        jobs = await storage.listPrintJobs();
      } else {
        // Para usuarios normales, obtener trabajos filtrados por sede y empresa
        const allJobs = await storage.listPrintJobs();
        const filteredJobs = [];

        for (const job of allJobs) {
          const printer = await storage.getPrinter(job.printerId);
          if (printer) {
            const matchLocation = !user.location || printer.location === printer.location;
            const matchFloor = !user.floor || printer.floor === printer.floor;
            if (matchLocation && matchFloor) {
              filteredJobs.push(job);
            }
          }
        }
        jobs = filteredJobs;
      }

      const jobsWithDetails = await Promise.all(jobs.map(async (job) => {
        const printer = await storage.getPrinter(job.printerId);
        return {
          ...job,
          printerName: printer?.name || 'Unknown Printer'
        };
      }));

      res.json(jobsWithDetails);
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Print endpoint (this is the main functionality)
  app.post("/api/print", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { printerId, documentUrl, options } = printJobRequestSchema.parse(req.body);

      // Find printer by uniqueId
      const printer = await storage.getPrinterByUniqueId(printerId);
      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      if (printer.status === 'offline') {
        return res.status(400).json({ message: "Impresora está desconectada" });
      }

      // Extract document name from URL
      const urlParts = documentUrl.split('/');
      const documentName = urlParts[urlParts.length - 1];

      // Create print job
      const printJob = await storage.createPrintJob({
        documentUrl,
        documentName,
        printerId: printer.id,
        userId: user.id,
        copies: options.copies,
        duplex: options.duplex,
        orientation: options.orientation
      });

      res.status(201).json({
        success: true,
        jobId: printJob.id,
        status: printJob.status
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  });

  // Endpoint para imprimir con ID numérico de impresora - PROCESAMIENTO INMEDIATO
  app.post("/api/print-id", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
      // Validar API Key
      const user = await validateApiKey(req, res);
      if (!user) return;

      // Parsear datos
      const printData = numericPrinterJobRequestSchema.parse(req.body);

      // Buscar impresora
      const printer = await storage.getPrinter(printData.printerId);
      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      if (printer.status === 'offline') {
        return res.status(400).json({ message: "Impresora está desconectada" });
      }

      // Nombre del documento
      const documentName = printData.documentName || 
        printData.documentUrl.split('/').pop() || 'documento.pdf';

      // Crear trabajo con estado inicial optimizado
      const printJob = await storage.createPrintJob({
        documentUrl: printData.documentUrl,
        documentName,
        printerId: printer.id,
        userId: user.id,
        copies: printData.copies,
        duplex: printData.duplex,
        orientation: printData.orientation
      });

      // PROCESAMIENTO SÍNCRONO INMEDIATO (sin setTimeout)
      // Preparar datos QZ mínimos sin descargar PDF
      const qzData = {
        printer: printer.name,
        data: [{
          type: 'pixel',
          format: 'pdf',
          flavor: 'file', // URL directa
          data: printData.documentUrl,
          options: {
            orientation: printData.orientation || 'portrait',
            copies: printData.copies || 1,
            duplex: printData.duplex || false,
            ignoreTransparency: printData.options?.ignoreTransparency ?? true,
            altFontRendering: printData.options?.altFontRendering ?? true,
            ...(printData.options?.pageRanges && { pageRanges: printData.options.pageRanges }),
            ...(printData.options?.scaleContent !== undefined && { scaleContent: printData.options.scaleContent }),
            ...(printData.options?.rasterize !== undefined && { rasterize: printData.options.rasterize }),
            ...(printData.options?.interpolation && { interpolation: printData.options.interpolation }),
            ...(printData.options?.colorType && { colorType: printData.options.colorType }),
          }
        }],
        config: {
          jobName: `${documentName} - ID: ${printJob.id}`,
          units: 'mm',
          ...(printData.options?.density !== undefined && { density: printData.options.density }),
          ...(printData.options?.colorType && { colorType: printData.options.colorType }),
          ...(printData.options?.interpolation && { interpolation: printData.options.interpolation }),
          ...(printData.options?.scaleContent !== undefined && { scaleContent: printData.options.scaleContent }),
          ...(printData.options?.rasterize !== undefined && { rasterize: printData.options.rasterize }),
        }
      };

      // Configurar márgenes desde la solicitud JSON o usar valores por defecto
      qzData.config.margins = printData.margins || {
        top: 12.7,   // milímetros por defecto (equivalente a 0.5 pulgadas)
        right: 12.7,
        bottom: 12.7,
        left: 12.7
      };

      // Actualizar inmediatamente a listo
      await storage.updatePrintJob(printJob.id, { 
        status: 'ready_for_client',
        qzTrayData: JSON.stringify(qzData)
      });

      // Notificar vía WebSocket SOLO AL USUARIO DUEÑO
      if (socketServer) {
        const jobData = {
          id: printJob.id,
          documentName,
          documentUrl: printData.documentUrl,
          printerName: printer.name,
          printerUniqueId: printer.uniqueId,
          status: 'ready_for_client',
          copies: printData.copies,
          duplex: printData.duplex,
          orientation: printData.orientation,
          qzTrayData: qzData,
          timestamp: Date.now()
        };

        // Obtener el socket específico del usuario
        const userSocketId = (global as any).getUserSocket?.(user.id.toString());

      console.log(`🔍 [NOTIF] ========== VERIFICANDO NOTIFICACIÓN ==========`);
      console.log(`👤 [NOTIF] Usuario: ${user.username} (ID: ${user.id})`);
      console.log(`🔌 [NOTIF] Socket ID obtenido: ${userSocketId || 'NINGUNO'}`);
        // Modificar el siguiente log
        console.log(`✅ [NOTIF] Socket existe según getUserSocket: ${userSocketId ? 'SÍ' : 'NO'}`);

        // Modificar la condición del if
        if (userSocketId) {
        socketServer.to(userSocketId).emit('new-print-job', jobData);
        console.log(`📡 [NOTIF] ✅ Trabajo ${printJob.id} notificado EXITOSAMENTE al usuario ${user.username}`);
      } else {
          console.log(`⚠️ [NOTIF] ❌ Usuario ${user.username} NO CONECTADO VIA WEBSOCKET (según getUserSocket)`);
        console.log(`🔄 [NOTIF] Trabajo ${printJob.id} se procesará por polling (modo fallback)`);

        // Debug adicional
        const allSockets = Array.from(socketServer.sockets.sockets.keys());
          console.log(`🔧 [DEBUG] Sockets activos (momento del fallback): [${allSockets.join(', ')}]`);
        console.log(`🔧 [DEBUG] Función getUserSocket disponible: ${typeof (global as any).getUserSocket}`);
      }
      }

      // Respuesta inmediata
      res.status(201).json({
        success: true,
        jobId: printJob.id,
        status: 'ready_for_client',
        immediate_processing: true,
        message: 'Documento listo para impresión inmediata',
        printer: {
          id: printer.id,
          name: printer.name,
          status: printer.status
        }
      });

    } catch (error) {
      console.error("❌ Error en /api/print-id:", error);
      handleValidationError(error, res);
    }
  });

  // Endpoint para imprimir con datos Base64 - PROCESAMIENTO INMEDIATO
  app.post("/api/print-base64", async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
      // Validar API Key
      const user = await validateApiKey(req, res);
      if (!user) return;

      // Parsear datos usando el nuevo schema
      const printData = base64PrintJobRequestSchema.parse(req.body);

      console.log(`📄 [BASE64] ========== PROCESANDO DOCUMENTO BASE64 ==========`);
      console.log(`👤 [BASE64] Usuario: ${user.username} (ID: ${user.id})`);
      console.log(`🖨️ [BASE64] Impresora ID: ${printData.printerId}`);
      console.log(`📋 [BASE64] Documento: ${printData.documentName}`);
      //console.log(`📊 [BASE64] Tamaño Base64: ${printData.documentBase64.length} caracteres`);

      // Buscar impresora
      const printer = await storage.getPrinter(printData.printerId);
      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      if (printer.status === 'offline') {
        return res.status(400).json({ message: "Impresora está desconectada" });
      }

      console.log(`✅ [BASE64] Impresora encontrada: ${printer.name} (${printer.uniqueId})`);

      // Validar que el Base64 sea válido (opcional pero recomendado)
      try {
        // Verificar que sea un Base64 válido
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Pattern.test(printData.documentBase64)) {
          return res.status(400).json({ message: "Formato Base64 inválido" });
        }

        // Verificar que tenga un tamaño mínimo razonable
        if (printData.documentBase64.length < 100) {
          return res.status(400).json({ message: "El documento Base64 parece ser demasiado pequeño" });
        }

        console.log(`✅ [BASE64] Validación de formato completada`);
      } catch (validationError) {
        console.error(`❌ [BASE64] Error validando Base64:`, validationError);
        return res.status(400).json({ message: "Documento Base64 inválido" });
      }

      // Crear trabajo con estado inicial optimizado
      const printJob = await storage.createPrintJob({
        documentUrl: `data:application/pdf;base64,${printData.documentBase64}`, // Guardar como data URL para referencia
        documentName: printData.documentName,
        printerId: printer.id,
        userId: user.id,
        copies: printData.copies,
        duplex: printData.duplex,
        orientation: printData.orientation
      });

      console.log(`📝 [BASE64] Trabajo creado con ID: ${printJob.id}`);

      // PROCESAMIENTO SÍNCRONO INMEDIATO
      // Preparar datos QZ para Base64
      const qzData = {
        printer: printer.name,
        data: [{
          type: 'pixel',
          format: 'image',
          flavor: 'base64', // Usar base64 en lugar de file
          data: printData.documentBase64, // Datos Base64 directos
          options: {
            orientation: printData.orientation || 'portrait',
            copies: printData.copies || 1,
            duplex: printData.duplex || false,
            ignoreTransparency: printData.options?.ignoreTransparency ?? true,
            altFontRendering: printData.options?.altFontRendering ?? true,
            ...(printData.options?.pageRanges && { pageRanges: printData.options.pageRanges }),
            ...(printData.options?.scaleContent !== undefined && { scaleContent: printData.options.scaleContent }),
            ...(printData.options?.rasterize !== undefined && { rasterize: printData.options.rasterize }),
            ...(printData.options?.interpolation && { interpolation: printData.options.interpolation }),
            ...(printData.options?.colorType && { colorType: printData.options.colorType }),
          }
        }],
        config: {
          jobName: `${printData.documentName} - ID: ${printJob.id}`,
          units: printData.size?.units || 'mm',
          ...(printData.size && { 
            size: { 
              width: printData.size.width, 
              height: printData.size.height 
            } 
          }),
          ...(printData.options?.density !== undefined && { density: printData.options.density }),
          ...(printData.options?.colorType && { colorType: printData.options.colorType }),
          ...(printData.options?.interpolation && { interpolation: printData.options.interpolation }),
          ...(printData.options?.scaleContent !== undefined && { scaleContent: printData.options.scaleContent }),
          ...(printData.options?.rasterize !== undefined && { rasterize: printData.options.rasterize }),
        }
      };

      // Configurar márgenes desde la solicitud JSON o usar valores por defecto
      qzData.config.margins = printData.margins || {
        top: 12.7,   // milímetros por defecto (equivalente a 0.5 pulgadas)
        right: 12.7,
        bottom: 12.7,
        left: 12.7
      };

      console.log(`🔧 [BASE64] Configuración QZ preparada para impresora: ${printer.name}`);

      // Actualizar inmediatamente a listo
      await storage.updatePrintJob(printJob.id, { 
        status: 'ready_for_client',
        qzTrayData: JSON.stringify(qzData)
      });

      console.log(`✅ [BASE64] Trabajo ${printJob.id} marcado como ready_for_client`);

      // Notificar vía WebSocket SOLO AL USUARIO DUEÑO
      if (socketServer) {
        const jobData = {
          id: printJob.id,
          documentName: printData.documentName,
          documentUrl: `[BASE64-${printData.documentBase64.length}chars]`, // No enviar Base64 completo en notificación
          printerName: printer.name,
          printerUniqueId: printer.uniqueId,
          status: 'ready_for_client',
          copies: printData.copies,
          duplex: printData.duplex,
          orientation: printData.orientation,
          qzTrayData: qzData,
          timestamp: Date.now(),
          isBase64: true // Flag para identificar trabajos Base64
        };

        // Obtener el socket específico del usuario
        const userSocketId = (global as any).getUserSocket?.(user.id.toString());

        console.log(`🔍 [BASE64-NOTIF] ========== VERIFICANDO NOTIFICACIÓN ==========`);
        console.log(`👤 [BASE64-NOTIF] Usuario: ${user.username} (ID: ${user.id})`);
        console.log(`🔌 [BASE64-NOTIF] Socket ID obtenido: ${userSocketId || 'NINGUNO'}`);

        if (userSocketId) {
          // DEBUG CRÍTICO: Examinar todos los sockets activos
          console.log(`🔍 [CRITICAL-DEBUG] ========== ANÁLISIS COMPLETO DE SOCKETS ==========`);
          console.log(`🎯 [CRITICAL-DEBUG] Socket objetivo: ${userSocketId}`);
          console.log(`📊 [CRITICAL-DEBUG] Total sockets en servidor: ${socketServer.sockets.sockets.size}`);

          // Listar TODOS los sockets activos
          console.log(`📋 [CRITICAL-DEBUG] Sockets activos:`);
          socketServer.sockets.sockets.forEach((socket, id) => {
            console.log(`   - ${id}: conectado=${socket.connected}, salas=[${Array.from(socket.rooms).join(', ')}]`);
          });

          // Verificar salas del servidor
          console.log(`🏠 [CRITICAL-DEBUG] Salas activas:`);
          socketServer.sockets.adapter.rooms.forEach((sockets, roomName) => {
            console.log(`   - ${roomName}: ${sockets.size} socket(s) [${Array.from(sockets).join(', ')}]`);
          });

          console.log(`🚀 [BASE64-NOTIF] Enviando evento 'new-print-job' a socket ${userSocketId}`);
          // Crear versión simplificada para logging (sin Base64 completo)
          const jobDataForLogging = {
            ...jobData,
            qzTrayData: {
              ...jobData.qzTrayData,
              data: jobData.qzTrayData.data.map((item: any) => ({
                ...item,
                data: item.data ? `${item.data.substring(0, 10)}...` : item.data
              }))
            }
          };
          console.log(`📦 [BASE64-NOTIF] Evento simplificado:`, JSON.stringify(jobDataForLogging, null, 2));

          // ========== ANÁLISIS DETALLADO DE WEBSOCKET ==========
          console.log(`🔍 [WEBSOCKET-ANALYSIS] ========== ESTADO COMPLETO DEL WEBSOCKET ==========`);

          // Estado global
          const allSockets = socketServer.sockets.sockets;
          const allRooms = socketServer.sockets.adapter.rooms;

          console.log(`📊 [WEBSOCKET-ANALYSIS] Resumen global:`);
          console.log(`   🔌 Total sockets conectados: ${allSockets.size}`);
          console.log(`   🏠 Total salas activas: ${allRooms.size}`);
          console.log(`   👤 Usuario objetivo: ${user.username} (ID: ${user.id})`);
          console.log(`   📄 Trabajo: ${printJob.documentName} (ID: ${printJob.id})`);

          // Mostrar todos los sockets activos
          if (allSockets.size > 0) {
            console.log(`🔌 [WEBSOCKET-ANALYSIS] Sockets activos:`);
            allSockets.forEach((socket, socketId) => {
              const socketRooms = Array.from(socket.rooms);
              const isUserSocket = socketId === userSocketId;
              console.log(`   ${isUserSocket ? '👤' : '🔌'} Socket ${socketId}: conectado=${socket.connected}, salas=[${socketRooms.join(', ')}]${isUserSocket ? ' ⭐ USUARIO OBJETIVO' : ''}`);
            });
          } else {
            console.log(`❌ [WEBSOCKET-ANALYSIS] NO HAY SOCKETS CONECTADOS`);
          }

          // Mostrar todas las salas activas
          if (allRooms.size > 0) {
            console.log(`🏠 [WEBSOCKET-ANALYSIS] Salas activas:`);
            allRooms.forEach((socketSet, roomName) => {
              const socketIds = Array.from(socketSet);
              const isUserRoom = roomName === `user-${user.id}`;
              const isPrintJobsRoom = roomName === 'print-jobs';
              let roomType = '';
              if (isUserRoom) roomType = ' ⭐ SALA USUARIO OBJETIVO';
              else if (isPrintJobsRoom) roomType = ' 📋 SALA GENERAL';

              console.log(`   🏠 Sala "${roomName}": ${socketSet.size} socket(s) [${socketIds.join(', ')}]${roomType}`);
            });
          } else {
            console.log(`❌ [WEBSOCKET-ANALYSIS] NO HAY SALAS ACTIVAS`);
          }

          // NUEVA ESTRATEGIA: Enviar SIEMPRE a la sala del usuario (más confiable)
          const userRoomName = `user-${user.id}`;
          console.log(`🎯 [BASE64-NOTIF] ========== ESTRATEGIA DE ENVÍO ==========`);
          console.log(`🎯 [BASE64-NOTIF] Enviando a sala ${userRoomName} (estrategia de sala)`);

          // Verificar que la sala existe
          const userRoom = socketServer.sockets.adapter.rooms.get(userRoomName);

          if (userRoom && userRoom.size > 0) {
            const socketIds = Array.from(userRoom);
            console.log(`✅ [BASE64-NOTIF] Sala ${userRoomName} encontrada con ${userRoom.size} socket(s)`);
            console.log(`🔍 [BASE64-NOTIF] Sockets en sala: [${socketIds.join(', ')}]`);

            // Verificar estado de cada socket en la sala
            socketIds.forEach(socketId => {
              const socket = allSockets.get(socketId);
              if (socket) {
                console.log(`   ✅ Socket ${socketId}: EXISTE, conectado=${socket.connected}`);
                if (!socket.connected) {
                  console.log(`   ⚠️ Socket ${socketId}: ESTÁ DESCONECTADO - puede causar problemas`);
                }
              } else {
                console.log(`   ❌ Socket ${socketId}: NO EXISTE en sockets activos - sala obsoleta`);
              }
            });

            socketServer.to(userRoomName).emit('new-print-job', jobData);
            console.log(`📡 [BASE64-NOTIF] ✅ Trabajo ${printJob.id} enviado EXITOSAMENTE a sala ${userRoomName}`);

          } else {
            console.log(`❌ [BASE64-NOTIF] Sala ${userRoomName} no existe o está vacía`);

            // Buscar salas relacionadas con el usuario
            console.log(`🔍 [BASE64-NOTIF] Buscando salas relacionadas con usuario ${user.id}...`);
            const relatedRooms = [];
            allRooms.forEach((socketSet, roomName) => {
              if (roomName.includes(user.id.toString()) || roomName.includes(user.username)) {
                relatedRooms.push({ name: roomName, size: socketSet.size, sockets: Array.from(socketSet) });
              }
            });

            if (relatedRooms.length > 0) {
              console.log(`🔍 [BASE64-NOTIF] Salas relacionadas encontradas:`, relatedRooms);
            } else {
              console.log(`❌ [BASE64-NOTIF] NO se encontraron salas relacionadas con usuario ${user.id}`);
            }

            console.log(`🔄 [BASE64-NOTIF] Intentando envío directo al socket ${userSocketId} como fallback`);

            // Fallback: envío directo (método original)
            const socket = socketServer.sockets.sockets.get(userSocketId);
            if (socket && socket.connected) {
              console.log(`✅ [BASE64-NOTIF] Socket ${userSocketId} encontrado y conectado - enviando directo`);
              socketServer.to(userSocketId).emit('new-print-job', jobData);
              console.log(`📡 [BASE64-NOTIF] ✅ Trabajo ${printJob.id} enviado como fallback directo`);
            } else {
              console.log(`❌ [BASE64-NOTIF] Socket ${userSocketId} no existe o está desconectado`);

              // Último recurso: broadcast a sala general
              const printJobsRoom = allRooms.get('print-jobs');
              if (printJobsRoom && printJobsRoom.size > 0) {
                console.log(`🔄 [BASE64-NOTIF] Enviando a sala 'print-jobs' como último recurso`);
                socketServer.to('print-jobs').emit('new-print-job', jobData);
                console.log(`📡 [BASE64-NOTIF] ⚠️ Trabajo ${printJob.id} enviado a sala general 'print-jobs'`);
              } else {
                console.log(`💀 [BASE64-NOTIF] FATAL: Ningún método de envío funcionó. Trabajo procesado por polling.`);
              }
            }
          }
        } else {
          console.log(`⚠️ [BASE64-NOTIF] ❌ Usuario ${user.username} NO CONECTADO VIA WEBSOCKET`);
          console.log(`🔄 [BASE64-NOTIF] Trabajo ${printJob.id} se procesará por polling (modo fallback)`);
        }
      }

      // Respuesta inmediata
      res.status(201).json({
        success: true,
        jobId: printJob.id,
        status: 'ready_for_client',
        immediate_processing: true,
        message: 'Documento Base64 listo para impresión inmediata',
        printer: {
          id: printer.id,
          name: printer.name,
          status: printer.status
        },
        document: {
          name: printData.documentName,
          type: 'base64',
          size: `${printData.documentBase64.length} caracteres`
        }
      });

      console.log(`🎉 [BASE64] ========== PROCESAMIENTO BASE64 COMPLETADO ==========`);

    } catch (error) {
      console.error("❌ Error en /api/print-base64:", error);
      handleValidationError(error, res);
    }
  });
  // Endpoint para sincronizar impresoras desde QZ Tray
  app.post("/api/printers/sync", async (req, res) => {
    try {
      console.log("==== SINCRONIZACIÓN DE IMPRESORAS (/api/printers/sync) ====");
      console.log("Fecha y hora:", new Date().toISOString());
      console.log("IP solicitante:", req.ip);
      console.log("User-Agent:", req.headers['user-agent']);
      console.log("Content-Type:", req.headers['content-type']);

      // Log completo de los headers para diagnóstico
      console.log("Headers completos:", JSON.stringify(req.headers, null, 2));

      // Revisar el cuerpo de la solicitud
      console.log("Tipo de cuerpo:", typeof req.body);
      console.log("Body es array:", Array.isArray(req.body));
      console.log("Body recibido:", JSON.stringify(req.body, null, 2));

      // Validar usuario por API key
      console.log("Validando API key para sincronización de impresoras...");
      const user = await validateApiKey(req, res);
      if (!user) {
        console.error("Error: API key inválida o usuario no encontrado");
        return; // validateApiKey ya envía la respuesta de error
      }

      console.log("Usuario autenticado:", user.username);

      // Verificar si los datos son un array o un objeto individual
      const printerDataArray = Array.isArray(req.body) ? req.body : [req.body];
      console.log("Datos de impresora recibidos:", JSON.stringify(printerDataArray));

      if (!printerDataArray || printerDataArray.length === 0) {
        console.error("Error: No se recibieron datos de impresoras");
        return res.status(400).json({
          success: false,
          message: "No se recibieron datos de impresoras"
        });
      }

      const results = [];

      // Procesar cada impresora en el array
      for (const printerData of printerDataArray) {
        if (!printerData.uniqueId) {
          console.error("Error: Falta uniqueId en los datos de la impresora", printerData);
          results.push({
            success: false,
            name: printerData.name || "Desconocido",
            error: "Falta uniqueId en los datos de la impresora"
          });
          continue;
        }

        try {
          console.log(`Procesando impresora: ${printerData.name} (${printerData.uniqueId})`);

          // Buscar si la impresora ya existe por uniqueId
          const existingPrinter = await storage.getPrinterByUniqueId(printerData.uniqueId);

          let printer;
          if (existingPrinter) {
            console.log(`Actualizando impresora existente: ${existingPrinter.name} (ID: ${existingPrinter.id})`);
            // Actualizar impresora existente
            printer = await storage.updatePrinter(existingPrinter.id, {
              ...printerData,
              status: 'online',
              lastPrintTime: existingPrinter.lastPrintTime // Mantener el último tiempo de impresión
            });
          } else {
            console.log(`Creando nueva impresora: ${printerData.name}`);
            // Crear nueva impresora
            printer = await storage.createPrinter({
              ...printerData,
              status: 'online'
            });
          }

          console.log(`Impresora ${printer?.name || 'Desconocida'} procesada con éxito (ID: ${printer?.id || 'Desconocido'})`);
          results.push({
            success: true,
            printer
          });
        } catch (err) {
          console.error(`Error al procesar impresora ${printerData.name}:`, err);
          results.push({
            success: false,
            name: printerData.name || "Desconocido",
            error: err instanceof Error ? err.message : "Error desconocido"
          });
        }
      }

      // Estadísticas de resultados
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      console.log(`Sincronización completada: ${successCount} exitosas, ${failCount} fallidas`);

      // Devolver todos los resultados
      res.status(200).json({
        success: results.some(r => r.success),
        results
      });
    } catch (error) {
      console.error("Error general en sincronización:", error);
      handleValidationError(error, res);
    }
  });

// QZ Tray connection status update endpoint
  app.post("/api/printers/:uniqueId/connect", async (req, res) => {
    try {
      const { uniqueId } = req.params;
      const printer = await storage.getPrinterByUniqueId(uniqueId);

      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      // Actualizar estado de la impresora a online
          const updatedPrinter = await storage.updatePrinter(printer.id, { status: 'online' });

          res.json({
            success: true,
            printer: updatedPrinter
          });
        } catch (error) {
          handleValidationError(error, res);
        }
      });



  // QZ Tray disconnection endpoint
  app.post("/api/printers/:uniqueId/disconnect", async (req, res) => {
    try {
      const { uniqueId } = req.params;
      const printer = await storage.getPrinterByUniqueId(uniqueId);

      if (!printer) {
        return res.status(404).json({ message: "Impresora no encontrada" });
      }

      // Update printer status to offline
      const updatedPrinter = await storage.updatePrinter(printer.id, { status: 'offline' });

      res.json({
        success: true,
        printer: updatedPrinter
      });
    } catch (error) {
      handleValidationError(error, res);
    }
  });  // Get pending jobs for a specific printer by uniqueId - ENDPOINT FALTANTE CRÍTICO
  app.get("/api/printers/:uniqueId/jobs", async (req, res) => {
    try {
      const { uniqueId } = req.params;

      console.log(`[JOBS_ENDPOINT] ========== CONSULTA DE TRABAJOS PENDIENTES ==========`);
      console.log(`[JOBS_ENDPOINT] Timestamp: ${new Date().toISOString()}`);
      console.log(`[JOBS_ENDPOINT] Printer uniqueId solicitado: ${uniqueId}`);
      console.log(`[JOBS_ENDPOINT] IP del cliente: ${req.ip}`);
      console.log(`[JOBS_ENDPOINT] User-Agent: ${req.headers['user-agent']}`);
      console.log(`[JOBS_ENDPOINT] Headers completos:`, JSON.stringify(req.headers, null, 2));

      // Find printer by uniqueId
      console.log(`[JOBS_ENDPOINT] Buscando impresora con uniqueId: ${uniqueId}`);
      const printer = await storage.getPrinterByUniqueId(uniqueId);

      if (!printer) {
        console.log(`[JOBS_ENDPOINT] Impresora no encontrada con uniqueId: ${uniqueId}`);
        console.log(`[JOBS_ENDPOINT] Todas las impresoras disponibles:`);

        const allPrinters = await storage.listPrinters();
        allPrinters.forEach((p, index) => {
          console.log(`   ${index + 1}. ID: ${p.id}, Name: ${p.name}, UniqueId: ${p.uniqueId}, Status: ${p.status}`);
        });

        return res.status(404).json({ 
          success: false,
          message: "Impresora no encontrada",
          requestedUniqueId: uniqueId,
          availablePrinters: allPrinters.map(p => ({
            id: p.id,
            name: p.name,
            uniqueId: p.uniqueId,
            status: p.status
          }))
        });
      }

      console.log(`[JOBS_ENDPOINT] Impresora encontrada:`);
      console.log(`   ID: ${printer.id}`);
      console.log(`   Name: ${printer.name}`);
      console.log(`   UniqueId: ${printer.uniqueId}`);
      console.log(`   Status: ${printer.status}`);
      console.log(`   Location: ${printer.location}`);

      // Get all jobs for this printer
      console.log(`[JOBS_ENDPOINT] Buscando trabajos para printer ID: ${printer.id}`);
      const allJobs = await storage.getPrintJobsByPrinter(printer.id);
      console.log(`[JOBS_ENDPOINT] Total trabajos encontrados para esta impresora: ${allJobs.length}`);

// Log all jobs for debugging
      if (allJobs.length > 0) {
        console.log("[JOBS_ENDPOINT] TODOS LOS TRABAJOS DE ESTA IMPRESORA");
        allJobs.forEach((job, index) => {
          console.log(`   ${index + 1}. ID: ${job.id}, Status: ${job.status}, Document: ${job.documentName}, Created: ${job.createdAt}`);
        });
      }

      // Filter jobs that need processing (pending or ready_for_client)
      const pendingJobs = allJobs.filter(job => 
        job.status === 'pending' || job.status === 'ready_for_client'
      );

      console.log(`[JOBS_ENDPOINT] Trabajos pendientes/listos para cliente: ${pendingJobs.length}`);

      if (pendingJobs.length > 0) {
        console.log("[JOBS_ENDPOINT] TRABAJOS A DEVOLVER AL CLIENTE");
        pendingJobs.forEach((job, index) => {
          console.log(`   ${index + 1}. ID: ${job.id}`);
          console.log(`      Documento: ${job.documentName}`);
          console.log(`      Estado: ${job.status}`);
          console.log(`      URL: ${job.documentUrl}`);
          console.log(`      Creado: ${job.createdAt}`);
          console.log(`      Tiene QZ Data: ${job.qzTrayData ? 'SÍ' : 'NO'}`);
          if (job.qzTrayData) {
            console.log(`      Tamaño QZ Data: ${job.qzTrayData.length} caracteres`);
          }
        });
      } else {
        console.log(`[JOBS_ENDPOINT] No hay trabajos pendientes para devolver`);
      }

      // Prepare response with job details and QZ Tray data
      const jobsWithDetails = pendingJobs.map(job => ({
        id: job.id,
        documentName: job.documentName,
        documentUrl: job.documentUrl,
        printerName: printer.name,
        status: job.status,
        createdAt: job.createdAt,
        copies: job.copies,
        duplex: job.duplex,
        orientation: job.orientation,
        qzTrayData: job.qzTrayData ? JSON.parse(job.qzTrayData) : null
      }));

      const response = {
        success: true,
        printer: {
          id: printer.id,
          name: printer.name,
          uniqueId: printer.uniqueId,
          status: printer.status
        },
        jobs: jobsWithDetails,
        totalJobs: allJobs.length,
        pendingJobs: pendingJobs.length,
        timestamp: new Date().toISOString()
      };

      console.log(`[JOBS_ENDPOINT] Enviando respuesta al cliente:`);
      console.log(`   Impresora: ${printer.name}`);
      console.log(`   Jobs devueltos: ${jobsWithDetails.length}`);
      console.log(`   Response completa:`, JSON.stringify(response, null, 2));
      console.log(`[JOBS_ENDPOINT] ========== CONSULTA COMPLETADA EXITOSAMENTE ==========`);

      res.json(response);

    } catch (error) {
      console.error(`[JOBS_ENDPOINT] ========== ERROR EN CONSULTA DE TRABAJOS ==========`);
      console.error(`[JOBS_ENDPOINT] UniqueId solicitado: ${req.params.uniqueId}`);
      console.error(`[JOBS_ENDPOINT] Tipo de error: ${error.constructor.name}`);
      console.error(`[JOBS_ENDPOINT] Mensaje: ${error.message}`);
      console.error(`[JOBS_ENDPOINT] Stack:`, error.stack);
      console.error(`[JOBS_ENDPOINT] ========== FIN ERROR CONSULTA ==========`);

      res.status(500).json({ 
        success: false,
        message: "Error interno del servidor al consultar trabajos",
        error: error.message 
      });
    }
  });

  // Update print job status from QZ Tray client
  app.put("/api/print-jobs/:id/status", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { status, error: jobError } = req.body;

      console.log(`🔄 [DEBUG] ========== ACTUALIZANDO ESTADO TRABAJO ==========`);
      console.log(`📝 [DEBUG] Job ID: ${jobId}`);
      console.log(`📊 [DEBUG] Nuevo estado: ${status}`);
      console.log(`❌ [DEBUG] Error (si hay): ${jobError || 'NINGUNO'}`);
      console.log(`⏰ [DEBUG] Timestamp: ${new Date().toISOString()}`);

      if (!['processing', 'completed', 'failed'].includes(status)) {
        console.log(`❌ [DEBUG] Estado inválido: ${status}`);
        return res.status(400).json({ 
          success: false, 
          message: "Estado inválido. Debe ser: processing, completed, o failed" 
        });
      }

      // Verify job exists
      const job = await storage.getPrintJob(jobId);
      if (!job) {
        console.log(`❌ [DEBUG] Trabajo ${jobId} no encontrado en BD`);
        return res.status(404).json({ 
          success: false, 
          message: "Trabajo de impresión no encontrado" 
        });
      }

      console.log(`✅ [DEBUG] Trabajo encontrado: ${job.documentName} (estado actual: ${job.status})`);

      // Update job status
      const updateData: any = { status };
      if (jobError) {
        updateData.error = jobError;
      }

      // Set completion time if completed
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      console.log(`💾 [DEBUG] Datos de actualización:`, updateData);

      const updatedJob = await storage.updatePrintJob(jobId, updateData);

      if (updatedJob) {
        console.log(`✅ [DEBUG] Trabajo ${jobId} actualizado exitosamente a estado '${status}'`);

        if (status === 'completed') {
          console.log(`🎉 [DEBUG] Trabajo ${jobId} completado exitosamente`);
        } else if (status === 'failed') {
          console.log(`❌ [DEBUG] Trabajo ${jobId} marcado como fallido: ${jobError || 'Sin detalles'}`);
        }

        console.log("✅ [DEBUG] ========== ACTUALIZACIÓN EXITOSA ==========");

        res.json({
          success: true,
          job: updatedJob,
          message: `Estado actualizado a ${status}`
        });
      } else {
        console.log(`❌ [DEBUG] No se pudo actualizar el trabajo ${jobId}`);
        res.status(500).json({ 
          success: false, 
          message: "Error al actualizar el trabajo" 
        });
      }
    } catch (error) {
      console.error(`❌ [DEBUG] Error actualizando estado del trabajo:`, error);
      handleValidationError(error, res);
    }
  });

  app.delete("/api/print-jobs/:id", async (req, res) => {
    console.log(`🗑️ [DELETE] ========== ELIMINANDO TRABAJO DE IMPRESIÓN ==========`);
    console.log(`📝 [DELETE] Job ID: ${req.params.id}`);
    console.log(`🌐 [DELETE] IP: ${req.ip}`);
    console.log(`📋 [DELETE] Headers:`, JSON.stringify(req.headers, null, 2));

    try {
      const authenticatedUser = await validateApiKey(req, res);
      if (!authenticatedUser) {
        console.log(`❌ [DELETE] Usuario no autenticado`);
        return;
      }

      console.log(`✅ [DELETE] Usuario autenticado: ${authenticatedUser.username}`);

      const printJobId = parseInt(req.params.id);
      if (isNaN(printJobId)) {
        console.log(`❌ [DELETE] ID inválido: ${req.params.id}`);
        return res.status(400).json({ 
          success: false, 
          message: "ID de trabajo inválido" 
        });
      }

      console.log(`🔍 [DELETE] Verificando si existe trabajo ${printJobId}...`);
      const existingJob = await storage.getPrintJob(printJobId);
      if (!existingJob) {
        console.log(`❌ [DELETE] Trabajo ${printJobId} no encontrado`);
        return res.status(404).json({ 
          success: false, 
          message: "Trabajo de impresión no encontrado" 
        });
      }

      console.log(`✅ [DELETE] Trabajo encontrado: ${existingJob.documentName}`);
      console.log(`🗑️ [DELETE] Procediendo a eliminar trabajo ${printJobId}...`);

      const deleted = await storage.deletePrintJob(printJobId);
      if (!deleted) {
        console.log(`❌ [DELETE] Error al eliminar trabajo ${printJobId}`);
        return res.status(500).json({ 
          success: false, 
          message: "Error al eliminar el trabajo de impresión" 
        });
      }

      console.log(`✅ [DELETE] Trabajo ${printJobId} eliminado exitosamente`);
      console.log("✅ [DELETE] ========== ELIMINACIÓN EXITOSA ==========");

      res.json({ 
        success: true, 
        message: "Trabajo eliminado exitosamente" 
      });
    } catch (error) {
      console.error(`❌ [DELETE] Error eliminando trabajo:`, error);
      console.error("❌ [DELETE] ========== ERROR EN ELIMINACIÓN ==========");
      handleValidationError(error, res);
    }
  });

  // ========== ENDPOINTS DE DEBUG - SOLUCIÓN RÁPIDA ==========
  // Agregar al final de routes.ts, antes del export

  app.post("/api/debug/resend-jobs", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      console.log(`🚨 [DEBUG-RESEND] ========== REENVÍO MANUAL INICIADO ==========`);
      console.log(`👤 [DEBUG-RESEND] Usuario: ${user.username} (ID: ${user.id})`);

      // Verificar estado actual del mapping
      const userSocketId = (global as any).getUserSocket?.(user.id.toString());
      console.log(`🔌 [DEBUG-RESEND] Socket mapeado: ${userSocketId || 'NINGUNO'}`);

      // Buscar TODOS los trabajos pendientes del usuario
      const allJobs = await storage.listPrintJobs();
      const userJobs = allJobs.filter(job => job.userId === user.id);
      const readyJobs = userJobs.filter(job => job.status === 'ready_for_client');

      console.log(`📋 [DEBUG-RESEND] Total trabajos del usuario: ${userJobs.length}`);
      console.log(`📋 [DEBUG-RESEND] Trabajos listos para cliente: ${readyJobs.length}`);

      let successfulResends = 0;

      for (const job of readyJobs) {
        try {
          // FIX: Usar storage.getPrinter en lugar de storage.getPrinterById
          const printer = await storage.getPrinter(job.printerId);
          if (!printer) {
            console.log(`⚠️ [DEBUG-RESEND] Impresora no encontrada para trabajo ${job.id}`);
            continue;
          }

          const jobData = {
            id: job.id,
            documentName: job.documentName,
            documentUrl: job.documentUrl,
            printerName: printer.name,
            printerUniqueId: printer.uniqueId,
            status: job.status,
            copies: job.copies,
            duplex: job.duplex,
            orientation: job.orientation,
            qzTrayData: job.qzTrayData ? JSON.parse(job.qzTrayData) : null,
            timestamp: Date.now(),
            targetUserId: user.id,
            targetUsername: user.username
          };

          console.log(`📤 [DEBUG-RESEND] Reenviando trabajo ${job.id}: ${job.documentName}`);

          if (socketServer) {
            // Múltiples métodos de envío
            if (userSocketId) {
              socketServer.to(userSocketId).emit('new-print-job', jobData);
              console.log(`   ✅ Enviado a socket directo: ${userSocketId}`);
            }

            socketServer.to(`user-${user.id}`).emit('new-print-job', jobData);
            console.log(`   ✅ Enviado a sala user-${user.id}`);

            socketServer.to('print-jobs').emit('new-print-job', jobData);
            console.log(`   ✅ Enviado a sala print-jobs (broadcast)`);

            successfulResends++;
          }

        } catch (jobError) {
          console.error(`❌ [DEBUG-RESEND] Error procesando trabajo ${job.id}:`, jobError);
        }
      }

      console.log(`✅ [DEBUG-RESEND] Reenvío completado: ${successfulResends}/${readyJobs.length} trabajos`);

      res.json({
        success: true,
        message: "Trabajos reenviados vía WebSocket",
        user: { id: user.id, username: user.username },
        jobs: { total: userJobs.length, ready: readyJobs.length, resent: successfulResends },
        jobDetails: readyJobs.map(j => ({ id: j.id, name: j.documentName, status: j.status }))
      });

    } catch (error) {
      console.error("❌ [DEBUG-RESEND] Error en reenvío manual:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Endpoint para limpiar mappings obsoletos
  app.post("/api/debug/clean-mappings", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      console.log(`🧹 [DEBUG-CLEAN] Iniciando limpieza de mappings obsoletos...`);

      if (socketServer && (global as any).globalUserSockets) {
        const mappings = (global as any).globalUserSockets;
        const activeSockets = Array.from(socketServer.sockets.sockets.keys());

        console.log(`🔍 [DEBUG-CLEAN] Sockets activos en servidor: ${activeSockets.length}`);
        console.log(`🔍 [DEBUG-CLEAN] Mappings existentes: ${mappings.size}`);

        let cleaned = 0;
        const cleanedMappings = [];

        mappings.forEach((socketId, userId) => {
          if (!activeSockets.includes(socketId)) {
            console.log(`🗑️ [DEBUG-CLEAN] Removiendo mapping obsoleto: Usuario ${userId} -> Socket ${socketId}`);
            cleanedMappings.push({ userId, socketId });
            mappings.delete(userId);
            cleaned++;
          } else {
            console.log(`✅ [DEBUG-CLEAN] Mapping válido: Usuario ${userId} -> Socket ${socketId}`);
          }
        });

        console.log(`✅ [DEBUG-CLEAN] Limpieza completada: ${cleaned} mappings obsoletos removidos`);

        res.json({
          success: true,
          message: `${cleaned} mappings obsoletos eliminados`,
          details: {
            totalMappingsBefore: mappings.size + cleaned,
            totalMappingsAfter: mappings.size,
            activeSockets: activeSockets.length,
            cleanedMappings: cleanedMappings
          }
        });

      } else {
        res.json({
          success: false,
          message: "Sistema de mappings no disponible"
        });
      }

    } catch (error) {
      console.error("❌ [DEBUG-CLEAN] Error limpiando mappings:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  // Get pending print jobs for current user  
  app.get("/api/print-jobs/pending", async (req, res) => {
    try {
      console.log(`🔍 [PENDING] ========== CONSULTA DE TRABAJOS PENDIENTES ==========`);

      const user = await validateApiKey(req, res);
      if (!user) return;

      console.log(`👤 [PENDING] Usuario: ${user.username} (ID: ${user.id})`);

      // Get all jobs for this user
      const allJobs = await storage.listPrintJobs();
      const userJobs = allJobs.filter(job => job.userId === user.id);

      console.log(`📋 [PENDING] Total trabajos del usuario: ${userJobs.length}`);

      // Filter jobs that are ready for client
      const pendingJobs = userJobs.filter(job => job.status === 'ready_for_client');

      console.log(`✅ [PENDING] Trabajos listos para cliente: ${pendingJobs.length}`);

      // Add printer info to each job
      const jobsWithPrinterInfo = await Promise.all(pendingJobs.map(async (job) => {
        const printer = await storage.getPrinter(job.printerId);
        return {
          id: job.id,
          documentName: job.documentName,
          documentUrl: job.documentUrl,
          printerName: printer?.name || 'Unknown Printer',
          printerUniqueId: printer?.uniqueId || 'unknown',
          status: job.status,
          copies: job.copies,
          duplex: job.duplex,
          orientation: job.orientation,
          qzTrayData: job.qzTrayData ? JSON.parse(job.qzTrayData) : null,
          createdAt: job.createdAt
        };
      }));

      if (jobsWithPrinterInfo.length > 0) {
        console.log(`📤 [PENDING] Devolviendo ${jobsWithPrinterInfo.length} trabajos:`);
        jobsWithPrinterInfo.forEach(job => {
          console.log(`   - ${job.id}: ${job.documentName} (${job.printerName})`);
        });
      } else {
        console.log(`📭 [PENDING] No hay trabajos pendientes para el usuario`);
      }

      res.json(jobsWithPrinterInfo);
    } catch (error) {
      console.error(`❌ [PENDING] Error:`, error);
      handleValidationError(error, res);
    }
  });
  // Endpoint para estado detallado del WebSocket
  app.get("/api/debug/websocket-status", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      console.log(`🔍 [DEBUG-STATUS] Consultando estado WebSocket para usuario ${user.username}`);

      const status = {
        serverInitialized: !!socketServer,
        totalConnections: socketServer ? socketServer.sockets.sockets.size : 0,
        rooms: {},
        userMapping: null,
        userSocket: null
      };

      if (socketServer) {
        // Información de salas
        const rooms = socketServer.sockets.adapter.rooms;
        status.rooms = {
          'print-jobs': rooms.get('print-jobs')?.size || 0,
          [`user-${user.id}`]: rooms.get(`user-${user.id}`)?.size || 0
        };

        // Mapping del usuario
        const userSocketId = (global as any).getUserSocket?.(user.id.toString());
        status.userMapping = userSocketId;

        // Estado del socket del usuario
        if (userSocketId) {
          const socket = socketServer.sockets.sockets.get(userSocketId);
          status.userSocket = {
            exists: !!socket,
            connected: socket?.connected || false,
            rooms: socket ? Array.from(socket.rooms) : []
          };
        }
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username
        },
        websocket: status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("❌ [DEBUG-STATUS] Error consultando estado:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  // Endpoint específico para debug de usuarios activos
  app.get("/api/debug/active-users", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { getActiveUsers } = await import('./websocket.js');
      const activeUsers = getActiveUsers();

      res.json({
        success: true,
        totalActive: activeUsers.length,
        users: activeUsers.map(u => ({
          username: u.username,
          duration: Math.floor((Date.now() - u.joinTime.getTime()) / 1000),
          lastActivity: u.lastActivity.toISOString()
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("❌ [DEBUG] Error obteniendo usuarios activos:", error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // GET /api/companies - Listar todas las empresas con sus sedes
  app.get("/api/companies", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      console.log(`📋 [COMPANIES] Usuario ${user.username} solicitando lista de empresas`);

      // Obtener todas las empresas activas
      const companiesData = await db
        .select()
        .from(companies)
        .where(eq(companies.isActive, true))
        .orderBy(companies.name);

      // Obtener todas las sedes activas
      const locationsData = await db
        .select()
        .from(locations)
        .where(eq(locations.isActive, true))
        .orderBy(locations.name);

      // Combinar empresas con sus sedes
      const companiesWithLocations = companiesData.map(company => ({
        ...company,
        locations: locationsData.filter(location => location.companyId === company.id)
      }));

      console.log(`✅ [COMPANIES] Devolviendo ${companiesWithLocations.length} empresas`);
      res.json(companiesWithLocations);
    } catch (error) {
      console.error('❌ [COMPANIES] Error fetching companies:', error);
      res.status(500).json({ 
        error: 'Error al obtener empresas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // GET /api/companies/:id - Obtener una empresa específica
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { id } = req.params;
      const companyId = parseInt(id);

      if (isNaN(companyId)) {
        return res.status(400).json({ error: 'ID de empresa inválido' });
      }

      console.log(`📋 [COMPANIES] Obteniendo empresa ${companyId}`);

      // Obtener empresa
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      // Obtener sedes de la empresa
      const companyLocations = await db
        .select()
        .from(locations)
        .where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)))
        .orderBy(locations.name);

      const companyWithLocations = {
        ...company,
        locations: companyLocations
      };

      res.json(companyWithLocations);
    } catch (error) {
      console.error('❌ [COMPANIES] Error fetching company:', error);
      res.status(500).json({ 
        error: 'Error al obtener empresa',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // POST /api/companies - Crear nueva empresa
  app.post("/api/companies", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'El nombre de la empresa es requerido' });
      }

      const trimmedName = name.trim();

      console.log(`➕ [COMPANIES] Usuario ${user.username} creando empresa: ${trimmedName}`);

      // Verificar si ya existe una empresa con ese nombre
      const existingCompany = await db
        .select()
        .from(companies)
        .where(eq(companies.name, trimmedName))
        .limit(1);

      if (existingCompany.length > 0) {
        return res.status(409).json({ error: 'Ya existe una empresa con ese nombre' });
      }

      // Crear nueva empresa
      const [newCompany] = await db
        .insert(companies)
        .values({ 
          name: trimmedName,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      const companyWithLocations = {
        ...newCompany,
        locations: []
      };

      console.log(`✅ [COMPANIES] Empresa creada con ID: ${newCompany.id}`);
      res.status(201).json(companyWithLocations);
    } catch (error) {
      console.error('❌ [COMPANIES] Error creating company:', error);
      if (error instanceof Error && error.message.includes('unique constraint')) {
        res.status(409).json({ error: 'Ya existe una empresa con ese nombre' });
      } else {
        res.status(500).json({ 
          error: 'Error al crear empresa',
          details: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  });

  // PUT /api/companies/:id - Actualizar empresa
  app.put("/api/companies/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { id } = req.params;
      const { name } = req.body;
      const companyId = parseInt(id);

      if (isNaN(companyId)) {
        return res.status(400).json({ error: 'ID de empresa inválido' });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'El nombre de la empresa es requerido' });
      }

      const trimmedName = name.trim();

      console.log(`✏️ [COMPANIES] Actualizando empresa ${companyId}: ${trimmedName}`);

      // Verificar que la empresa existe
      const [existingCompany] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

      if (!existingCompany) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      // Actualizar empresa
      const [updatedCompany] = await db
        .update(companies)
        .set({ 
          name: trimmedName, 
          updatedAt: new Date() 
        })
        .where(eq(companies.id, companyId))
        .returning();

      // Obtener sedes actualizadas
      const companyLocations = await db
        .select()
        .from(locations)
        .where(and(eq(locations.companyId, companyId), eq(locations.isActive, true)))
        .orderBy(locations.name);

      const companyWithLocations = {
        ...updatedCompany,
        locations: companyLocations
      };

      console.log(`✅ [COMPANIES] Empresa ${companyId} actualizada`);
      res.json(companyWithLocations);
    } catch (error) {
      console.error('❌ [COMPANIES] Error updating company:', error);
      res.status(500).json({ 
        error: 'Error al actualizar empresa',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // DELETE /api/companies/:id - Eliminar empresa (soft delete)
  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { id } = req.params;
      const companyId = parseInt(id);

      if (isNaN(companyId)) {
        return res.status(400).json({ error: 'ID de empresa inválido' });
      }

      console.log(`🗑️ [COMPANIES] Eliminando empresa ${companyId}`);

      // Verificar que la empresa existe
      const [existingCompany] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, companyId), eq(companies.isActive, true)));

      if (!existingCompany) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }

      // Realizar soft delete de la empresa y sus sedes
      await db.transaction(async (tx) => {
        // Desactivar todas las sedes de la empresa
        await tx
          .update(locations)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(locations.companyId, companyId));

        // Desactivar la empresa
        await tx
          .update(companies)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(companies.id, companyId));
      });

      console.log(`✅ [COMPANIES] Empresa ${companyId} eliminada (soft delete)`);
      res.json({ 
        message: 'Empresa eliminada exitosamente',
        companyName: existingCompany.name
      });
    } catch (error) {
      console.error('❌ [COMPANIES] Error deleting company:', error);
      res.status(500).json({ 
        error: 'Error al eliminar empresa',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // ================================
  // LOCATIONS ROUTES
  // ================================

  // GET /api/locations - Listar todas las sedes
  app.get("/api/locations", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { companyId } = req.query;

      console.log(`📍 [LOCATIONS] Usuario ${user.username} solicitando sedes`);

      let query = db
        .select({
          id: locations.id,
          name: locations.name,
          companyId: locations.companyId,
          isActive: locations.isActive,
          createdAt: locations.createdAt,
          updatedAt: locations.updatedAt,
          companyName: companies.name
        })
        .from(locations)
        .leftJoin(companies, eq(locations.companyId, companies.id))
        .where(eq(locations.isActive, true));

      // Filtrar por empresa si se proporciona
      if (companyId) {
        const companyIdNum = parseInt(companyId as string);
        if (!isNaN(companyIdNum)) {
          query = query.where(and(
            eq(locations.isActive, true),
            eq(locations.companyId, companyIdNum)
          ));
        }
      }

      const locationsData = await query.orderBy(companies.name, locations.name);

      console.log(`✅ [LOCATIONS] Devolviendo ${locationsData.length} sedes`);
      res.json(locationsData);
    } catch (error) {
      console.error('❌ [LOCATIONS] Error fetching locations:', error);
      res.status(500).json({ 
        error: 'Error al obtener sedes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // POST /api/locations - Crear nueva sede
  app.post("/api/locations", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { name, companyId } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'El nombre de la sede es requerido' });
      }

      if (!companyId || isNaN(parseInt(companyId))) {
        return res.status(400).json({ error: 'ID de empresa válido es requerido' });
      }

      const trimmedName = name.trim();
      const companyIdNum = parseInt(companyId);

      console.log(`➕ [LOCATIONS] Creando sede: ${trimmedName} en empresa ${companyIdNum}`);

      // Verificar que la empresa existe y está activa
      const [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, companyIdNum), eq(companies.isActive, true)));

      if (!company) {
        return res.status(404).json({ error: 'Empresa no encontrada o inactiva' });
      }

      // Verificar que no existe una sede con el mismo nombre en esa empresa
      const existingLocation = await db
        .select()
        .from(locations)
        .where(and(
          eq(locations.name, trimmedName),
          eq(locations.companyId, companyIdNum),
          eq(locations.isActive, true)
        ))
        .limit(1);

      if (existingLocation.length > 0) {
        return res.status(409).json({ 
          error: 'Ya existe una sede con ese nombre en esta empresa' 
        });
      }

      // Crear nueva sede
      const [newLocation] = await db
        .insert(locations)
        .values({ 
          name: trimmedName,
          companyId: companyIdNum,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      const locationWithCompany = {
        ...newLocation,
        companyName: company.name
      };

      console.log(`✅ [LOCATIONS] Sede creada con ID: ${newLocation.id}`);
      res.status(201).json(locationWithCompany);
    } catch (error) {
      console.error('❌ [LOCATIONS] Error creating location:', error);
      res.status(500).json({ 
        error: 'Error al crear sede',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // PUT /api/locations/:id - Actualizar sede
  app.put("/api/locations/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { id } = req.params;
      const { name } = req.body;
      const locationId = parseInt(id);

      if (isNaN(locationId)) {
        return res.status(400).json({ error: 'ID de sede inválido' });
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'El nombre de la sede es requerido' });
      }

      const trimmedName = name.trim();

      console.log(`✏️ [LOCATIONS] Actualizando sede ${locationId}: ${trimmedName}`);

      // Verificar que la sede existe
      const [existingLocation] = await db
        .select()
        .from(locations)
        .where(and(eq(locations.id, locationId), eq(locations.isActive, true)));

      if (!existingLocation) {
        return res.status(404).json({ error: 'Sede no encontrada' });
      }

      // Actualizar sede
      const [updatedLocation] = await db
        .update(locations)
        .set({ 
          name: trimmedName,
          updatedAt: new Date() 
        })
        .where(eq(locations.id, locationId))
        .returning();

      // Obtener información de la empresa
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, existingLocation.companyId));

      const locationWithCompany = {
        ...updatedLocation,
        companyName: company?.name || ''
      };

      console.log(`✅ [LOCATIONS] Sede ${locationId} actualizada`);
      res.json(locationWithCompany);
    } catch (error) {
      console.error('❌ [LOCATIONS] Error updating location:', error);
      res.status(500).json({ 
        error: 'Error al actualizar sede',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });

  // DELETE /api/locations/:id - Eliminar sede (soft delete)
  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const user = await validateApiKey(req, res);
      if (!user) return;

      const { id } = req.params;
      const locationId = parseInt(id);

      if (isNaN(locationId)) {
        return res.status(400).json({ error: 'ID de sede inválido' });
      }

      console.log(`🗑️ [LOCATIONS] Eliminando sede ${locationId}`);

      // Verificar que la sede existe
      const [existingLocation] = await db
        .select({
          id: locations.id,
          name: locations.name,
          companyName: companies.name
        })
        .from(locations)
        .leftJoin(companies, eq(locations.companyId, companies.id))
        .where(and(eq(locations.id, locationId), eq(locations.isActive, true)));

      if (!existingLocation) {
        return res.status(404).json({ error: 'Sede no encontrada' });
      }

      // Realizar soft delete
      await db
        .update(locations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(locations.id, locationId));

      console.log(`✅ [LOCATIONS] Sede ${locationId} eliminada (soft delete)`);
      res.json({ 
        message: 'Sede eliminada exitosamente',
        locationName: existingLocation.name,
        companyName: existingLocation.companyName
      });
    } catch (error) {
      console.error('❌ [LOCATIONS] Error deleting location:', error);
      res.status(500).json({ 
        error: 'Error al eliminar sede',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });


  return httpServer;
}

// Esta función debe ser llamada después de crear el socket server
export function setupSocketIntegration(io: SocketIOServer) {
  setSocketServer(io);
}