/**
 * Módulo simplificado de API para el servidor
 * Este archivo está diseñado para proveer compatibilidad con la versión del cliente
 */

/**
 * Versión simplificada de la función apiRequest para uso en el servidor
 * @param options Opciones de la petición
 * @returns Promesa vacía, función stub
 */
export async function apiRequest({
  url,
  method = 'GET',
  body,
  headers = {},
}: {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}) {
  console.log(`[SERVER] API Request stub: ${method} ${url}`);
  return {};
}

export default {
  apiRequest
};