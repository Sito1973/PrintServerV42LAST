// Biblioteca para integración con QZ Tray
// Basada en QZ Tray JavaScript API v2.2.5
import { DIGITAL_CERTIFICATE, PRIVATE_KEY, configureCertificate } from './qz-certificate'

interface QzTrayConfig {
  host?: string[];
  port?: {
    secure: number[];
    insecure: number[];
  };
  usingSecure?: boolean;
  keepAlive?: number;
  retries?: number;
  delay?: number;
}

interface PrinterInfo {
  name: string;
  uniqueId: string;
  location?: string;
  description?: string;
  status?: string;
}

interface QzPrintData {
  type: 'raw' | 'pixel';
  format: 'command' | 'html' | 'image' | 'pdf';
  flavor?: 'base64' | 'file' | 'hex' | 'plain' | 'xml';
  data: string | Uint8Array;
  options?: {
    language?: string;
    x?: number;
    y?: number;
    dotDensity?: string | number;
    pageWidth?: number;
    pageHeight?: number;
  };
}

// Declaración global para QZ Tray
declare global {
  interface Window {
    qz: any;
  }
}

// Variables globales para el estado de QZ Tray
let qzInstance: any = null;
let isConnected = false;
let connectionPromise: Promise<boolean> | null = null;

// Estado del polling reactivo
interface ReactivePollingState {
  isActive: boolean;
  intervalId: number | null;
  printerNames: string[];
  fastMode: boolean;
  consecutiveEmptyChecks: number;
  lastPollTime: number;
}


// Configuración por defecto
const DEFAULT_CONFIG: QzTrayConfig = {
  host: ["localhost", "localhost.qz.io"],
  port: {
    secure: [8181, 8282, 8383, 8484],
    insecure: [8182, 8283, 8384, 8485]
  },
  usingSecure: false, // Usar puertos inseguros por defecto
  keepAlive: 30,
  retries: 3,
  delay: 1
};

/**
 * Certificado auto-firmado para desarrollo
 */
const QZ_DEMO_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIFAzCCAuugAwIBAgICEAIwDQYJKoZIhvcNAQEFBQAwgZgxCzAJBgNVBAYTAlVT
MQswCQYDVQQIDAJOWTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExDMRswGQYD
VQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxGTAXBgNVBAMMEHF6aW5kdXN0cmllcy5j
b20xJzAlBgkqhkiG9w0BCQEWGHN1cHBvcnRAcXppbmR1c3RyaWVzLmNvbTAeFw0x
NTAzMTkwMjM4NDVaFw0yNTAzMTkwMjM4NDVaMHMxCzAJBgNVBAYTAkFBMRMwEQYD
VQQIDApTb21lIFN0YXRlMQ0wCwYDVQQKDAREZW1vMQ0wCwYDVQQQLDAREZW1vMRIw
EAYDVQQDDAlsb2NhbGhvc3QxHTAbBgkqhkiG9w0BCQEWDnJvb3RAbG9jYWxob3N0
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtFzbBDRTDHHmlSVQLqjY
aoGax7ql3XgRGdhZlNEJPZDs5482ty34J4sI2ZK2yC8YkZ/x+WCSveUgDQIVJ8oK
D4jtAPxqHnfSr9RAbvB1GQoiYLxhfxEp/+zfB9dBKDTRZR2nJm/mMsavY2DnSzLp
t7PJOjt3BdtISRtGMRsWmRHRfy882msBxsYug22odnT1OdaJQ5LzMJz1SZ5mYYpj
GgJ8W8SfnkaDaXCuiOINcHZ15r1SdFgKkNdgHbLyqhqJwwJ45xB6qWYtf2uYp5U7
GCKRyHEd7KLMkc36k9F5C5EZk8Cj9Q+HhWBGOqhY35O/TqJLqZHONf/C8eJRX3k8
jQIDAQABo1AwTjAdBgNVHQ4EFgQU6eUaIKBr4iQ1vZmQ/QHR9SqzHvowHwYDVR0j
BBgwFoAUJ9vDr6H6hkVCOSMjIlT0m1oqW1EwDAYDVR0TBAUwAwEB/zANBgkqhkiG
9w0BAQUFAAOCAgEAjZN/v7jYx2Ij/xTTZP1bWWWxDHvhm+gm5/1Qc3LRIV4F/YPG
aWdLRsGHAQABi4aDNJ1QzUe4MfUq13WnAh6G6vMCR1o1VTM1k3Lj7fhwQ6E3IHfj
y8xVQ3I8Y1E5VvJ8QzC5V2h7YQe2G+Y2k6rKQgYzxrWL7e9XhH7C+Q3q2KmPl7qQ
7c9xJ2wU5r3Y9JxCq7jXGx5+Qq6mQl2R2j7k3S+7aLZdH8TQe6GQr8B2Q1A0x8g8
Q5F8A3v3k2HqKjYz8X3wWZj8L8M8+sV8gAYGE+U7Y6XvL2ZLxJ+r2w7QGFZ2XxGF
xPZqVJj3nY8QSrF5z+q8Vr2GgXkE4G2RhS1xR8p9RwQJLbvMJE3QqLvlQ=
-----END CERTIFICATE-----`;

/**
 * Carga el script de QZ Tray desde CDN
 */
async function loadQzTrayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.qz) {
      resolve(true);
      return;
    }

    // Crear el script tag
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ QZ Tray script cargado correctamente');
      resolve(true);
    };

    script.onerror = () => {
      console.error('❌ Error al cargar el script de QZ Tray');
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

/**
 * Configura el certificado y las firmas para QZ Tray
 */
function setupQzSecurity(): void {
  if (!window.qz) return;

  console.log("🔐 Configurando seguridad QZ Tray...");

  try {
    // Usar los certificados personalizados si están disponibles
    window.qz.security.setCertificatePromise(function(resolve: (cert: string) => void) {
      console.log("📋 Usando certificado personalizado QZ Tray Demo");
      resolve(DIGITAL_CERTIFICATE);
    });

    // Configurar la firma con JSEncrypt si está disponible
    window.qz.security.setSignaturePromise(function(toSign: string) {
      return function(resolve: (signature: string) => void) {
        try {
          // Verificar si JSEncrypt está disponible
          if (typeof (window as any).JSEncrypt !== 'undefined') {
            console.log("🔑 Firmando con JSEncrypt y clave privada personalizada");
            const sign = new (window as any).JSEncrypt();
            sign.setPrivateKey(PRIVATE_KEY);
            const signature = sign.sign(toSign, (window as any).CryptoJS?.SHA1, "sha1");
            console.log("✅ Firma generada exitosamente");
            resolve(signature);
          } else {
            console.warn("⚠️ JSEncrypt no disponible, usando firma vacía para desarrollo");
            resolve(""); // Firma vacía para desarrollo
          }
        } catch (signError) {
          console.error("❌ Error al firmar:", signError);
          resolve(""); // Fallback a firma vacía
        }
      };
    });

    // Configurar algoritmo de firma
    window.qz.security.setSignatureAlgorithm("SHA1");
    console.log("✅ Seguridad QZ Tray configurada correctamente");
  } catch (error) {
    console.error("❌ Error configurando seguridad QZ Tray:", error);
  }
}

/**
 * Inicializa la conexión con QZ Tray
 */
export async function initQzTray(config: Partial<QzTrayConfig> = {}): Promise<boolean> {
  // Si ya hay una conexión en progreso, esperar
  if (connectionPromise) {
    return connectionPromise;
  }

  // Si ya está conectado, retornar true
  if (isConnected && window.qz?.websocket?.isActive()) {
    return true;
  }

  connectionPromise = (async () => {
    try {
      console.log('🔄 Iniciando conexión con QZ Tray...');

      // Cargar el script si no está disponible
      const scriptLoaded = await loadQzTrayScript();
      if (!scriptLoaded) {
        throw new Error('No se pudo cargar el script de QZ Tray');
      }

      // Esperar un momento para que el script se inicialice
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!window.qz) {
        throw new Error('QZ Tray no está disponible');
      }

      qzInstance = window.qz;

      // Configurar certificados y firmas
      setupQzSecurity();

      // Configuración de conexión
      const connectionConfig = { ...DEFAULT_CONFIG, ...config };

      console.log('🔐 Configurando seguridad...');
      console.log('🌐 Intentando conectar con configuración:', connectionConfig);

      // Intentar conectar
      await qzInstance.websocket.connect(connectionConfig);

      console.log('✅ Conectado exitosamente a QZ Tray');

      // Verificar versión
      try {
        const version = await qzInstance.api.getVersion();
        console.log('📋 Versión de QZ Tray:', version);
      } catch (versionError) {
        console.warn('⚠️ No se pudo obtener la versión:', versionError);
      }

      isConnected = true;
      return true;

    } catch (error) {
      console.error('❌ Error al conectar con QZ Tray:', error);
      isConnected = false;
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * Verifica si QZ Tray está conectado
 */
export function isQzTrayConnected(): boolean {
  return isConnected && qzInstance?.websocket?.isActive();
}

/**
 * Obtiene la lista de impresoras disponibles
 */
export async function getPrinters(): Promise<string[]> {
  if (!isQzTrayConnected()) {
    const connected = await initQzTray();
    if (!connected) {
      throw new Error('No se pudo conectar con QZ Tray');
    }
  }

  try {
    console.log('🔍 Buscando impresoras...');
    const printers = await qzInstance.printers.find();
    console.log('🖨️ Impresoras encontradas:', printers);
    return Array.isArray(printers) ? printers : [];
  } catch (error) {
    console.error('❌ Error al obtener impresoras:', error);
    throw error;
  }
}

/**
 * Obtiene información detallada de las impresoras
 */
export async function getPrintersDetails(): Promise<any[]> {
  if (!isQzTrayConnected()) {
    const connected = await initQzTray();
    if (!connected) {
      throw new Error('No se pudo conectar con QZ Tray');
    }
  }

  try {
    console.log('🔍 Obteniendo detalles de impresoras...');
    const details = await qzInstance.printers.details();
    console.log('📋 Detalles de impresoras:', details);
    return Array.isArray(details) ? details : [];
  } catch (error) {
    console.error('❌ Error al obtener detalles de impresoras:', error);
    throw error;
  }
}

/**
 * Envía datos a imprimir
 */
export async function printData(printerName: string, data: QzPrintData[]): Promise<void> {
  console.log("🖨️ [DEBUG] ========== INICIANDO PRINTDATA ==========");
  console.log(`🎯 [DEBUG] Impresora objetivo: ${printerName}`);
  console.log(`📊 [DEBUG] Cantidad de elementos de datos: ${data.length}`);

  // Verificar conexión
  console.log("🔍 [DEBUG] Verificando conexión con QZ Tray...");
  const connected = isQzTrayConnected();
  console.log(`📊 [DEBUG] Estado inicial conexión: ${connected}`);

  if (!connected) {
    console.log("🔄 [DEBUG] Intentando reconectar...");
    const reconnected = await initQzTray();
    console.log(`📊 [DEBUG] Reconexión: ${reconnected ? 'ÉXITO' : 'FALLO'}`);
    if (!reconnected) {
      throw new Error('No se pudo conectar con QZ Tray');
    }
  }

  try {
    console.log("📋 [DEBUG] === DETALLES DE DATOS DE IMPRESIÓN ===");
    data.forEach((item, index) => {
      console.log(`   ${index + 1}. Type: ${item.type}`);
      console.log(`      Format: ${item.format}`);
      console.log(`      Flavor: ${item.flavor}`);
      console.log(`      Data: ${typeof item.data === 'string' ? item.data.substring(0, 100) + '...' : '[Binary Data]'}`);
      console.log(`      Options:`, item.options);
    });

    console.log("🔧 [DEBUG] === CREANDO CONFIGURACIÓN DE IMPRESORA ===");
    console.log(`🖨️ [DEBUG] Nombre de impresora: ${printerName}`);

    if (!qzInstance) {
      throw new Error("qzInstance no está disponible");
    }

    console.log("📊 [DEBUG] Verificando qzInstance...");
    console.log(`   📋 qzInstance existe: ${!!qzInstance}`);
    console.log(`   📋 configs existe: ${!!qzInstance.configs}`);
    console.log(`   📋 print existe: ${!!qzInstance.print}`);

    const config = qzInstance.configs.create(printerName);
    console.log("✅ [DEBUG] Configuración de impresora creada");
    console.log("📊 [DEBUG] Tipo de config:", typeof config);

    console.log("🚀 [DEBUG] === ENVIANDO A IMPRIMIR ===");
    const printStartTime = Date.now();

    await qzInstance.print(config, data);

    const printEndTime = Date.now();
    const printDuration = printEndTime - printStartTime;

    console.log(`⏱️ [DEBUG] Impresión completada en ${printDuration}ms`);
    console.log('✅ [DEBUG] Trabajo de impresión enviado exitosamente');
    console.log("✅ [DEBUG] ========== PRINTDATA EXITOSO ==========");

  } catch (error) {
    console.error("❌ [DEBUG] ========== ERROR EN PRINTDATA ==========");
    console.error(`❌ [DEBUG] Impresora: ${printerName}`);
    console.error(`❌ [DEBUG] Tipo de error: ${error.constructor.name}`);
    console.error(`❌ [DEBUG] Mensaje: ${error.message}`);

    // Logs adicionales específicos de QZ Tray
    if (error.message) {
      console.error(`❌ [DEBUG] Mensaje detallado: ${error.message}`);
    }

    if (error.stack) {
      console.error(`❌ [DEBUG] Stack trace:`, error.stack);
    }

    // Verificar estado de QZ después del error
    console.error(`❌ [DEBUG] Estado post-error:`);
    console.error(`   📊 qzInstance existe: ${!!qzInstance}`);
    console.error(`   📊 websocket activo: ${qzInstance?.websocket?.isActive?.() || false}`);
    console.error(`   📊 conexión reportada: ${isQzTrayConnected()}`);

    console.error("❌ [DEBUG] ========== FIN ERROR PRINTDATA ==========");
    throw error;
  }
}

/**
 * Desconecta de QZ Tray
 */
export async function disconnectQzTray(): Promise<void> {
  if (qzInstance?.websocket?.isActive()) {
    try {
      await qzInstance.websocket.disconnect();
      console.log('🔌 Desconectado de QZ Tray');
    } catch (error) {
      console.error('❌ Error al desconectar:', error);
    }
  }

  isConnected = false;
  qzInstance = null;
  stopReactivePolling();
}

/**
 * Verifica si la biblioteca QZ Tray está disponible en el navegador
 */
export function isQzAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.qz !== 'undefined';
}

/**
 * Verifica si QZ Tray está activo (alias para isQzTrayConnected)
 */
export function isQzTrayActive(): boolean {
  return isQzTrayConnected();
}

/**
 * Sincroniza impresoras con el servidor
 */
export async function syncPrintersWithServer(printers: string[], apiKey: string): Promise<boolean> {
  try {
    const printerData = printers.map(printerName => {
      const uniqueId = `local-${printerName.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}`;
      return {
        name: printerName,
        location: "Cliente local",
        model: "Modelo no disponible",
        uniqueId,
        isActive: true,
        floor: "1"
      };
    });

    const response = await fetch('/api/printers/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(printerData)
    });

    if (!response.ok) {
      throw new Error(`Error en sincronización: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result && result.success === true;
  } catch (error) {
    console.error('Error al sincronizar impresoras:', error);
    throw error;
  }
}


// Actualizar la interfaz pública
export const qzTray = {
  // Métodos principales
  initQzTray,
  isQzTrayConnected,
  isQzTrayActive,
  isQzAvailable,
  getPrinters,
  getPrintersDetails,
  printData,
  disconnectQzTray,
  syncPrintersWithServer,

  // Métodos de polling DEPRECADOS
  activateReactivePolling: () => console.warn("Polling desactivado - usar WebSocket"),
  startReactivePolling: () => console.warn("Polling desactivado - usar WebSocket"),
  stopReactivePolling: () => {}, // No-op

  // Estado
  get isConnected() {
    return isConnected;
  },
};

/**
 * Imprime un PDF desde una URL usando QZ Tray
 */
export async function printPdfFromUrl(
  printerName: string, 
  pdfUrl: string, 
  options: {
    copies?: number;
    duplex?: boolean;
    orientation?: 'portrait' | 'landscape';
  } = {}
): Promise<boolean> {
  console.log("🖨️ [DEBUG] ========== INICIANDO PRINTPDFFROMURL ==========");
  console.log(`🎯 [DEBUG] Impresora: ${printerName}`);
  console.log(`🔗 [DEBUG] PDF URL: ${pdfUrl}`);
  console.log(`⚙️ [DEBUG] Opciones recibidas:`, options);

  try {
    // Verificar estado inicial
    console.log("🔍 [DEBUG] Verificando estado inicial de QZ Tray...");
    const isConnected = isQzTrayConnected();
    console.log(`📊 [DEBUG] QZ Tray conectado: ${isConnected}`);

    if (!isConnected) {
      console.error("❌ [DEBUG] QZ Tray no está conectado - intentando reconectar...");
      const reconnected = await initQzTray();
      console.log(`🔄 [DEBUG] Reconexión: ${reconnected ? 'ÉXITO' : 'FALLO'}`);
      if (!reconnected) {
        throw new Error("No se pudo conectar con QZ Tray");
      }
    }

    console.log("🔧 [DEBUG] === PREPARANDO DATOS DE IMPRESIÓN ===");
    const printData: QzPrintData[] = [{
      type: 'pixel',
      format: 'pdf',
      flavor: 'base64',
      data: pdfUrl,
      options: {
        orientation: options.orientation || 'portrait',
        copies: options.copies || 1,
        duplex: options.duplex || false,
        ignoreTransparency: true,
        altFontRendering: true,
         rasterize: true  
      }
    }];

    console.log("📋 [DEBUG] Datos de impresión preparados:");
    console.log(`   📑 Type: ${printData[0].type}`);
    console.log(`   📄 Format: ${printData[0].format}`);
    console.log(`   🔗 Flavor: ${printData[0].flavor}`);
    console.log(`   📊 Data: ${printData[0].data}`);
    console.log(`   ⚙️ Options:`, printData[0].options);

    console.log("🚀 [DEBUG] === LLAMANDO A PRINTDATA ===");
    const printStartTime = Date.now();

    try {
      console.log("🔍 [DEBUG] Verificando conexión QZ antes de printData...");
      if (!qzInstance) {
        throw new Error("qzInstance no está disponible");
      }

      if (!qzInstance.websocket?.isActive()) {
        throw new Error("WebSocket de QZ Tray no está activo");
      }

      console.log("✅ [DEBUG] QZ Tray verificado, procediendo con printData...");
      await printData(printerName, printData);
      const printEndTime = Date.now();

      console.log(`⏱️ [DEBUG] PrintData completado en ${printEndTime - printStartTime}ms`);
      console.log(`✅ [DEBUG] PDF enviado correctamente a ${printerName}`);
      console.log("✅ [DEBUG] ========== PRINTPDFFROMURL EXITOSO ==========");
      return true;
    } catch (printError) {
      const printEndTime = Date.now();
      console.error(`❌ [DEBUG] Error en printData después de ${printEndTime - printStartTime}ms:`, printError);

      // Información adicional de diagnóstico
      console.error(`❌ [DEBUG] Diagnóstico adicional:`);
      console.error(`   📊 qzInstance existe: ${!!qzInstance}`);
      console.error(`   📊 websocket existe: ${!!qzInstance?.websocket}`);
      console.error(`   📊 websocket activo: ${qzInstance?.websocket?.isActive?.() || false}`);
      console.error(`   🖨️ nombre impresora: ${printerName}`);
      console.error(`   🔗 URL: ${pdfUrl}`);

      throw printError;
    }
  } catch (error) {
    console.error("❌ [DEBUG] ========== ERROR EN PRINTPDFFROMURL ==========");
    console.error(`❌ [DEBUG] Impresora: ${printerName}`);
    console.error(`❌ [DEBUG] URL: ${pdfUrl}`);
    console.error(`❌ [DEBUG] Tipo de error: ${error.constructor.name}`);
    console.error(`❌ [DEBUG] Mensaje: ${error.message}`);
    console.error(`❌ [DEBUG] Stack:`, error.stack);
    console.error("❌ [DEBUG] ========== FIN ERROR PRINTPDFFROMURL ==========");
    return false;
  }
}

/**
 * Actualiza el estado de un trabajo de impresión en el servidor
 */
export async function updateJobStatus(jobId: number, status: 'processing' | 'completed' | 'failed', error?: string): Promise<void> {
  try {
    console.log(`📊 [UPDATE_STATUS] Actualizando trabajo ${jobId} a estado: ${status}`);

    const response = await fetch(`/api/print-jobs/${jobId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        error
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${errorData.message || 'Error desconocido'}`);
    }

    const result = await response.json();
    console.log(`✅ [UPDATE_STATUS] Trabajo ${jobId} actualizado exitosamente:`, result);

    // Log especial para trabajos completados via WebSocket
    if (status === 'completed') {
      console.log(`🎉 [WEBSOCKET_SUCCESS] Trabajo ${jobId} completado via procesamiento en tiempo real`);
    }

  } catch (error) {
    console.error(`❌ [UPDATE_STATUS] Error actualizando estado del trabajo ${jobId}:`, error);
    throw error;
  }
}

// Alias para compatibilidad con imports existentes
export const initializeQzTray = initQzTray;

// Exportaciones por defecto
export default qzTray;

// Auto-cleanup cuando se descarga la página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    disconnectQzTray();
  });
}