console.log("Initial NODE_ENV:", process.env.NODE_ENV);
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { printProcessor } from "./print-processor";
import { Server as SocketIOServer } from "socket.io";
import { createServer, type Server } from "http";
import cors from 'cors';

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(cors({
  origin: true, // Permitir todos los orígenes en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ CONFIGURAR MIDDLEWARE DE PARSING
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// ✅ ASEGURAR HEADERS CORRECTOS PARA API
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});
const port = parseInt(process.env.PORT || "5000");

// Read NODE_ENV directly in this file
const nodeEnv = process.env.NODE_ENV;
console.log("Initial NODE_ENV:", nodeEnv);

// Configurar función global para activar polling reactivo
(global as any).activateReactivePolling = (printerUniqueId: string) => {
  console.log(`📡 SEÑAL GLOBAL: Nuevo trabajo para impresora ${printerUniqueId} - Activando polling reactivo`);
  // Esta función será llamada desde las rutas cuando lleguen trabajos nuevos
};
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(process.cwd(), 'public')));

// Asegurar que todas las respuestas de API tengan el Content-Type correcto
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Verificar conexión a la base de datos
    const dbVersion = await db.execute(sql`SELECT version()`);
    log(`Connected to PostgreSQL: ${dbVersion.rows[0].version}`);

    // Inicializar datos de ejemplo
    await (storage as any).seedInitialData();
    log("Initial data seeded successfully");

    // Iniciar el procesador automático de impresión
    printProcessor.start();
    log("Print Processor started successfully");
  } catch (error) {
    log(`Database initialization error: ${error}`, "error");
  }

  const server = await registerRoutes(app);

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  // Setup WebSocket with user mapping
  const { setupWebSocket } = await import("./websocket");
  const { emitPrintJobToUser, getUserSocket } = setupWebSocket(server);

  // Exponer función para acceder a sockets de usuarios
  (global as any).getUserSocket = getUserSocket;
  (global as any).emitPrintJobToUser = emitPrintJobToUser;

  // Import and setup socket integration with routes
  const { setupSocketIntegration } = await import("./routes");
  setupSocketIntegration(io);

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log(`🔗 Cliente WebSocket conectado: ${socket.id}`);

    socket.on('subscribe-print-jobs', () => {
      console.log(`📋 Cliente ${socket.id} suscrito a trabajos de impresión`);
      socket.join('print-jobs');
    });

    socket.on('job-completed', (jobId) => {
      console.log(`✅ Cliente reportó trabajo ${jobId} completado`);
    });

    socket.on('job-failed', (data) => {
      console.log(`❌ Cliente reportó trabajo ${data.id} fallido: ${data.error}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔗 Cliente WebSocket desconectado: ${socket.id}`);
    });
  });

  console.log('🚀 WebSocket server configurado para notificaciones inmediatas');

  // Export io for use in routes
  (global as any).io = io;

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    log(`Error: ${err.message}`, "error");
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    // Dynamic import with try-catch to avoid bundling vite.ts in production
    try {
      // Use eval to prevent bundlers from following this import
      const viteModule = await eval('import("./vite.js")');
      await viteModule.setupVite(app, server);
    } catch (error) {
      log("Vite not available, serving static files", "warning");
      // Fall back to static serving if vite is not available
      const distPath = path.resolve(process.cwd(), "dist/public");
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.use("*", (_req, res) => {
          res.sendFile(path.resolve(distPath, "index.html"));
        });
      }
    }
  } else {
    // Serve static files in production
    const distPath = path.resolve(process.cwd(), "dist/public");

    if (!fs.existsSync(distPath)) {
      log(`Could not find the build directory: ${distPath}`, "error");
      // Try alternative paths
      const altPath1 = path.resolve(process.cwd(), "dist");
      const altPath2 = path.resolve(process.cwd(), "public");

      if (fs.existsSync(altPath1)) {
        log(`Using alternative path: ${altPath1}`, "warning");
        app.use(express.static(altPath1));
        app.use("*", (_req, res) => {
          const indexPath = path.resolve(altPath1, "index.html");
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send("Application not built correctly");
          }
        });
      } else if (fs.existsSync(altPath2)) {
        log(`Using alternative path: ${altPath2}`, "warning");
        app.use(express.static(altPath2));
        app.use("*", (_req, res) => {
          const indexPath = path.resolve(altPath2, "index.html");
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).send("Application not built correctly");
          }
        });
      } else {
        log("No static files found, serving basic response", "error");
        app.use("*", (_req, res) => {
          res.status(404).send("Application not built correctly - no static files found");
        });
      }
    } else {
      app.use(express.static(distPath));

      // fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  // Use the port variable we set earlier
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();