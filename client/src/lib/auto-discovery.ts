/**
 * Utilidad para verificar si QZ Tray está realmente ejecutándose en el sistema
 * y proporcionar una mejor asistencia para la conexión
 */

/**
 * Verifica si QZ Tray está ejecutándose comprobando la conexión directamente con fetch
 * @returns Promise<boolean> - true si se puede conectar, false en caso contrario
 */
export async function checkQzTrayRunning(): Promise<boolean> {
  try {
    // Intentar conectar directamente al puerto WebSocket de QZ Tray
    // como verificación simple si está ejecutándose
    const response = await fetch('http://localhost:8181', { 
      method: 'GET',
      mode: 'no-cors', // Es necesario para evitar errores CORS
      cache: 'no-cache'
    });
    
    console.log("Respuesta de conexión directa QZ Tray:", response.status);
    
    // Cualquier respuesta (incluso error) indica que algo está escuchando en ese puerto
    return true;
  } catch (error) {
    console.error("Error al verificar si QZ Tray está ejecutándose:", error);
    return false;
  }
}

/**
 * Comprueba todos los puertos típicos donde QZ Tray podría estar escuchando
 */
export async function checkAllQzPorts(): Promise<{ port: number, available: boolean }[]> {
  const ports = [8181, 8182, 8183, 9100];
  const results = [];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}`, { 
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        // Establecer un timeout para no esperar demasiado
        signal: AbortSignal.timeout(500)
      });
      
      results.push({
        port,
        available: true
      });
    } catch (error) {
      results.push({
        port,
        available: false
      });
    }
  }
  
  return results;
}

/**
 * Verifica si se puede acceder a los puertos relevantes y genera un informe de diagnóstico
 */
export async function generateDiagnosticReport(): Promise<string> {
  try {
    const qzRunning = await checkQzTrayRunning();
    const portResults = await checkAllQzPorts();
    
    // Versión de QZ Tray
    const qzVersion = (window as any).qz?.version || "No detectada";
    
    // WebSocket activo
    const wsActive = (window as any).qz?.websocket?.isActive?.() || false;
    
    let report = `INFORME DE DIAGNÓSTICO QZ TRAY\n`;
    report += `----------------------------------------\n`;
    report += `Fecha: ${new Date().toLocaleString()}\n`;
    report += `Versión QZ Tray: ${qzVersion}\n`;
    report += `WebSocket activo: ${wsActive ? "SÍ ✅" : "NO ❌"}\n`;
    report += `QZ Tray en ejecución: ${qzRunning ? "Probablemente SÍ ✅" : "NO ❌"}\n\n`;
    
    report += `VERIFICACIÓN DE PUERTOS:\n`;
    for (const result of portResults) {
      report += `- Puerto ${result.port}: ${result.available ? "DISPONIBLE ✅" : "NO DISPONIBLE ❌"}\n`;
    }
    
    report += `\nRECOMENDACIONES:\n`;
    if (!qzRunning) {
      report += `- Asegúrese de que QZ Tray esté instalado y en ejecución\n`;
      report += `- Reinicie QZ Tray y luego recargue esta página\n`;
    } else if (!wsActive) {
      report += `- QZ Tray parece estar en ejecución, pero no acepta conexiones\n`;
      report += `- Verifique que no esté bloqueado por el firewall\n`;
      report += `- Pruebe a ejecutar QZ Tray como administrador\n`;
    }
    
    report += `- Asegúrese de tener la versión 2.2.x de QZ Tray instalada\n`;
    report += `- Verifique que no hay otras instancias de QZ Tray en ejecución\n`;
    
    return report;
  } catch (error) {
    console.error("Error al generar informe diagnóstico:", error);
    return `Error al generar informe diagnóstico: ${error}`;
  }
}

// Exportamos como default y named exports para compatibilidad
export default {
  checkQzTrayRunning,
  checkAllQzPorts,
  generateDiagnosticReport
};
