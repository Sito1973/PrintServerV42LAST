import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv'; // Importar dotenv
import path from 'path';     // Importar path

// --- INICIO CARGA DOTENV ---
// Determinar la ruta al archivo .env relativo a este script
// Esto asume que db.ts está en server/ y .env está en el directorio padre (printer-hub/code/.env)
import { fileURLToPath } from 'url';
const __filename_db = fileURLToPath(import.meta.url);
const __dirname_db = path.dirname(__filename_db);
const envPath_db = path.resolve(__dirname_db, '../.env'); // Subir un nivel desde server/ a printer-hub/code/

const dotenvResult_db = dotenv.config({ path: envPath_db });

if (dotenvResult_db.error) {
  console.warn(`[db.ts] Advertencia: No se pudo cargar el archivo .env desde ${envPath_db}:`, dotenvResult_db.error.message);
  // No lanzar error aquí, permitir que los Secrets de Replit (si existen) tomen precedencia.
} else {
  if (process.env.DATABASE_URL) {
    console.log(`[db.ts] DATABASE_URL cargada desde .env en db.ts: ${process.env.DATABASE_URL.substring(0,30)}...`);
  } else {
    console.log('[db.ts] DATABASE_URL NO fue cargada desde .env en db.ts.');
  }
}
// --- FIN CARGA DOTENV ---

const { Pool } = pg;

// Verificamos que DATABASE_URL exista (después de intentar cargar dotenv)
if (!process.env.DATABASE_URL) {
  console.error("[db.ts] ERROR CRÍTICO: DATABASE_URL no está configurada.");
  console.error("[db.ts] Por favor, asegúrese de que la variable DATABASE_URL esté definida en los Secrets de Replit o en el archivo printer-hub/code/.env.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database or set it in Replit Secrets?",
  );
}

// Configuración de opciones para el pool de conexiones
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 10,
  idleTimeoutMillis: 30000,
  query_timeout: 10000,
  connectionRetryAttempts: 5,
  ssl: process.env.DATABASE_URL.includes('amazonaws.com') || 
       process.env.DATABASE_URL.includes('neon.tech') ? 
       { rejectUnauthorized: false } : false
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.log(`[db.ts] Unexpected error on idle client: ${err.message}`);
});

pool.query('SELECT version()', (err, res) => {
  if (err) {
    console.log(`[db.ts] Error al conectar a PostgreSQL: ${err.message}`);
  } else {
    if (res && res.rows && res.rows[0]) {
      console.log(`[db.ts] Connected to PostgreSQL: ${res.rows[0].version}`);
    } else {
      console.log(`[db.ts] Conectado a PostgreSQL, pero no se pudo obtener la versión.`);
    }
  }
});

export const db = drizzle(pool, { schema });
