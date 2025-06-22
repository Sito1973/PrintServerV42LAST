import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

const ApiDocs: React.FC = () => {
  // Sample Postman collection data as JSON string
  const postmanCollection = JSON.stringify({
    "info": {
      "name": "PrinterHub API",
      "description": "API for managing printers and print jobs with QZ Tray integration",
      "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
      {
        "key": "base_url",
        "value": "https://your-domain.com",
        "type": "string"
      },
      {
        "key": "api_key",
        "value": "YOUR_API_KEY",
        "type": "string"
      },
      {
        "key": "printerId",
        "value": "14",
        "type": "string"
      }
    ],
    "item": [
      {
        "name": "Authentication",
        "item": [
          {
            "name": "Login",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json",
                  "type": "text"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}"
              },
              "url": {
                "raw": "{{base_url}}/api/login",
                "host": ["{{base_url}}"],
                "path": ["api", "login"]
              }
            }
          }
        ]
      },
      {
        "name": "Print Jobs",
        "item": [
          {
            "name": "Print PDF (Simple)",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                },
                {
                  "key": "Content-Type",
                  "value": "application/json",
                  "type": "text"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": "{\n  \"printerId\": \"printer123\",\n  \"documentUrl\": \"https://example.com/path/to/document.pdf\"\n}"
              },
              "url": {
                "raw": "{{base_url}}/api/print-simple",
                "host": ["{{base_url}}"],
                "path": ["api", "print-simple"]
              }
            }
          },
          {
            "name": "Print PDF (Advanced)",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                },
                {
                  "key": "Content-Type",
                  "value": "application/json",
                  "type": "text"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": "{\n  \"printerId\": \"printer123\",\n  \"documentUrl\": \"https://example.com/document.pdf\",\n  \"options\": {\n    \"copies\": 1,\n    \"duplex\": false,\n    \"orientation\": \"portrait\"\n  }\n}"
              },
              "url": {
                "raw": "{{base_url}}/api/print",
                "host": ["{{base_url}}"],
                "path": ["api", "print"]
              }
            }
          },
          {
            "name": "Print PDF (Numeric ID)",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                },
                {
                  "key": "Content-Type",
                  "value": "application/json",
                  "type": "text"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": "{\n  \"printerId\": {{printerId}},\n  \"documentUrl\": \"https://www.plasforte.com.ar/wp-content/uploads/2018/01/muestra-1.pdf\",\n  \"documentName\": \"Documento de prueba\",\n  \"copies\": 1,\n  \"duplex\": false,\n  \"orientation\": \"portrait\"\n}"
              },
              "url": {
                "raw": "{{base_url}}/api/print-id",
                "host": ["{{base_url}}"],
                "path": ["api", "print-id"]
              }
            }
          },
          {
            "name": "Get Print Jobs",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/print-jobs",
                "host": ["{{base_url}}"],
                "path": ["api", "print-jobs"]
              }
            }
          }
        ]
      },
      {
        "name": "Printers",
        "item": [
          {
            "name": "Get All Printers",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/printers",
                "host": ["{{base_url}}"],
                "path": ["api", "printers"]
              }
            }
          },
          {
            "name": "Get Printer Status",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/printers/{{printerId}}/status",
                "host": ["{{base_url}}"],
                "path": ["api", "printers", "{{printerId}}", "status"]
              }
            }
          },
          {
            "name": "Sync Printers (QZ Tray)",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                },
                {
                  "key": "Content-Type",
                  "value": "application/json",
                  "type": "text"
                }
              ],
              "body": {
                "mode": "raw",
                "raw": "[\n  {\n    \"name\": \"Microsoft Print to PDF\",\n    \"uniqueId\": \"microsoft_print_to_pdf_14\",\n    \"location\": \"Local\",\n    \"description\": \"Microsoft Print to PDF\"\n  }\n]"
              },
              "url": {
                "raw": "{{base_url}}/api/printers/sync",
                "host": ["{{base_url}}"],
                "path": ["api", "printers", "sync"]
              }
            }
          }
        ]
      },
      {
        "name": "Users",
        "item": [
          {
            "name": "Get All Users (Admin only)",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/users",
                "host": ["{{base_url}}"],
                "path": ["api", "users"]
              }
            }
          },
          {
            "name": "Get My API Key",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/users/me/apikey",
                "host": ["{{base_url}}"],
                "path": ["api", "users", "me", "apikey"]
              }
            }
          },
          {
            "name": "Rotate API Key",
            "request": {
              "method": "POST",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                },
                {
                  "key": "Content-Type",
                  "value": "application/json",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/users/me/apikey/rotate",
                "host": ["{{base_url}}"],
                "path": ["api", "users", "me", "apikey", "rotate"]
              }
            }
          }
        ]
      },
      {
        "name": "Dashboard",
        "item": [
          {
            "name": "Get Statistics",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/stats",
                "host": ["{{base_url}}"],
                "path": ["api", "stats"]
              }
            }
          },
          {
            "name": "Get Recent Activity",
            "request": {
              "method": "GET",
              "header": [
                {
                  "key": "Authorization",
                  "value": "Bearer {{api_key}}",
                  "type": "text"
                }
              ],
              "url": {
                "raw": "{{base_url}}/api/recent-activity",
                "host": ["{{base_url}}"],
                "path": ["api", "recent-activity"]
              }
            }
          }
        ]
      }
    ]
  }, null, 2);

  const downloadPostmanCollection = () => {
    const blob = new Blob([postmanCollection], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PrinterHub_API.postman_collection.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Ejemplo con comentarios separados para mejor legibilidad
  const printJobExample = `{
  "printerId": 1,
  "documentUrl": "https://example.com/document.pdf",
  "documentName": "Documento de prueba",
  "copies": 2,
  "duplex": true,
  "orientation": "portrait",
  "margins": {
    "top": 15,
    "right": 15,
    "bottom": 15,
    "left": 15
  },
  "options": {
    "ignoreTransparency": false,
    "altFontRendering": true,
    "rasterize": false,
    "pageRanges": "1-5",
    "scaleContent": true,
    "colorType": "grayscale",
    "density": 600,
    "interpolation": "bicubic"
  }
}`;

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">API Documentation</h2>
      <p className="mt-1 text-sm text-gray-500">
        Complete REST API documentation for PrinterHub with QZ Tray integration.
      </p>

      {/* Authentication Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            🔐 Authentication
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            All API requests require authentication except login.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">POST /api/login</h4>
          <div className="mt-2 bg-gray-50 p-4 rounded-md">
            <pre className="text-xs overflow-auto text-gray-700">
{`{
  "username": "admin",
  "password": "admin123"
}`}
            </pre>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Response</h4>
            <div className="mt-2 bg-gray-50 p-4 rounded-md">
              <pre className="text-xs overflow-auto text-gray-700">
{`{
  "apiKey": "f91f59875cc7ee7f4b39238763279875faf525192a756412a309e672204aae69",
  "username": "admin",
  "name": "Admin User"
}`}
              </pre>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Using the API Key</h4>
            <p className="mt-1 text-sm text-gray-500">
              Include the API key in all subsequent requests:
            </p>
            <div className="mt-2 bg-gray-50 p-4 rounded-md">
              <pre className="text-xs overflow-auto text-gray-700">
                Authorization: Bearer f91f59875cc7ee7f4b39238763279875faf525192a756412a309e672204aae69
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Print Jobs Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            🖨️ Print Jobs
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Send documents to printers and manage print jobs.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-6">
            {/* Simple Print */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  POST
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/print-simple"
                  readOnly
                />
              </div>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto text-gray-700">
{`{
  "printerId": "printer_unique_id",
  "documentUrl": "https://example.com/document.pdf"
}`}
                </pre>
              </div>
            </div>

            {/* Advanced Print */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  POST
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/print"
                  readOnly
                />
              </div>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto text-gray-700">
{`{
  "printerId": "printer_unique_id",
  "documentUrl": "https://example.com/document.pdf",
  "options": {
    "copies": 1,
    "duplex": false,
    "orientation": "portrait"
  }
}`}
                </pre>
              </div>
            </div>

            {/* Numeric ID Print */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  POST
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/print-id"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Imprime documentos desde URL pública</p>
            </div>

            {/* Base64 Print */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-purple-50 text-purple-700 text-sm">
                  POST
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/print-base64"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Imprime documentos desde datos Base64</p>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Envía un documento para imprimir en la impresora especificada. Acepta todas las opciones de configuración de QZ Tray.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-3">📋 Guía Completa de Configuraciones QZ Tray</h4>

              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>
                  <h5 className="font-semibold mb-1">🔄 Orientación del Papel</h5>
                  <ul className="text-xs space-y-0.5 pl-2">
                    <li>• <code>"portrait"</code> - Vertical (predeterminado)</li>
                    <li>• <code>"landscape"</code> - Horizontal</li>
                    <li>• <code>"reverse-portrait"</code> - Vertical invertido</li>
                    <li>• <code>"reverse-landscape"</code> - Horizontal invertido</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-1">🎨 Tipos de Color</h5>
                  <ul className="text-xs space-y-0.5 pl-2">
                    <li>• <code>"color"</code> - Impresión a color completo</li>
                    <li>• <code>"grayscale"</code> - Escala de grises</li>
                    <li>• <code>"blackwhite"</code> - Solo blanco y negro</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-1">📄 Selección de Páginas</h5>
                  <ul className="text-xs space-y-0.5 pl-2">
                    <li>• <code>"all"</code> - Todas las páginas</li>
                    <li>• <code>"1-5"</code> - Páginas del 1 al 5</li>
                    <li>• <code>"1,3,5"</code> - Páginas específicas</li>
                    <li>• <code>"2-"</code> - Desde la página 2 hasta el final</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-1">⚙️ Calidad de Impresión</h5>
                  <ul className="text-xs space-y-0.5 pl-2">
                    <li>• <code>density: 300</code> - Calidad estándar</li>
                    <li>• <code>density: 600</code> - Alta calidad</li>
                    <li>• <code>density: 1200</code> - Máxima calidad</li>
                    <li>• Rango: 72-1200 DPI</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-1">📏 Márgenes</h5>
                  <ul className="text-xs space-y-0.5 pl-2">
                    <li>• Valores en <strong>milímetros</strong></li>
                    <li>• Default: 6.35mm (≈ 0.25 pulgadas)</li>
                    <li>• Mínimo recomendado: 5mm</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-1">🔧 Opciones Avanzadas</h5>
                  <ul className="text-xs space-y-0.5 pl-2">
                    <li>• <code>rasterize: false</code> - Mantener vectores PDF</li>
                    <li>• <code>scaleContent: true</code> - Ajustar al papel</li>
                    <li>• <code>altFontRendering</code> - Fuentes problemáticas</li>
                    <li>• <code>ignoreTransparency</code> - Control de transparencias</li>
                  </ul>
                </div>
              </div>

              <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                <strong>💡 Tip:</strong> Para documentos complejos usa <code>rasterize: true</code> y <code>density: 300</code>. 
                Para texto simple mantén <code>rasterize: false</code> para mejor calidad.
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">📖 Ejemplo Completo con Comentarios:</h4>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{printJobExample}</code>
                </pre>
                {/* Comentarios del ejemplo aquí */}
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Configuración básica:</strong> copies (1-999), duplex (true/false), orientation</p>
                  <p><strong>Márgenes:</strong> en milímetros - Default: 6.35mm (0.25")</p>
                  <p><strong>Opciones avanzadas QZ Tray:</strong> Control de transparencias, renderizado, escalado</p>
                  <p><strong>Selección de páginas:</strong> "1-5", "1,3,5", "2-", "all"</p>
                  <p><strong>Calidad y color:</strong> density (72-1200 DPI), colorType (color/grayscale/blackwhite)</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-amber-800 mb-3">🔧 Manejo de Valores Faltantes</h4>
                <div className="text-sm text-amber-700 space-y-2">
                  <p><strong>✅ Valores Opcionales:</strong> Si no se incluyen, se usan valores predeterminados seguros</p>
                  <p><strong>❌ Valores Requeridos:</strong> <code>printerId</code> y <code>documentUrl</code> - Error 400 si faltan</p>
                  <p><strong>🔄 Compatibilidad:</strong> JSON mínimo o completo - ambos funcionan perfectamente</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">⚡ JSON Mínimo</h4>
                  <p className="text-xs text-gray-600 mb-2">Solo valores esenciales</p>
                  <pre className="bg-blue-50 border border-blue-200 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{`{
  "printerId": 1,
  "documentUrl": "https://example.com/doc.pdf"
}`}</code>
                  </pre>
                  <div className="mt-2 text-xs text-blue-600">
                    <p>✅ Funciona perfectamente</p>
                    <p>📄 copies: 1 (default)</p>
                    <p>🔄 orientation: "portrait"</p>
                    <p>📏 márgenes: 6.35mm c/lado</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-green-700">✅ Uso Básico</h4>
                  <p className="text-xs text-gray-600 mb-2">Configuración común</p>
                  <pre className="bg-green-50 border border-green-200 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{`{
  "printerId": 1,
  "documentUrl": "https://example.com/factura.pdf",
  "documentName": "Factura #001",
  "copies": 2,
  "orientation": "portrait"
}`}</code>
                  </pre>
                  <div className="mt-2 text-xs text-green-600">
                    <p>✅ Configuración estándar</p>
                    <p>🔧 Usa defaults seguros</p>
                    <p>⚡ Procesamiento rápido</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-purple-700">🎯 Configuración Completa</h4>
                  <p className="text-xs text-gray-600 mb-2">Todas las opciones</p>
                  <pre className="bg-purple-50 border border-purple-200 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{`{
  "printerId": 1,
  "documentUrl": "https://example.com/planos.pdf",
  "documentName": "Planos Arquitectónicos",
  "copies": 3,
  "duplex": true,
  "orientation": "landscape",
  "margins": {
    "top": 10,
    "right": 10,
    "bottom": 10,
    "left": 10
  },
  "options": {
    "pageRanges": "1-10",
    "colorType": "color",
    "density": 600,
    "scaleContent": false,
    "rasterize": true
  }
}`}</code>
                  </pre>
                  <div className="mt-2 text-xs text-purple-600">
                    <p>⚙️ Control total</p>
                    <p>🎯 Máxima precisión</p>
                    <p>🔧 Para casos especiales</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-purple-700">📊 Reportes - Alta Calidad</h4>
                  <pre className="bg-purple-50 border border-purple-200 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{`{
  "printerId": 1,
  "documentUrl": "https://example.com/reporte.pdf",
  "documentName": "Reporte Mensual",
  "copies": 2,
  "duplex": true,
  "options": {
    "colorType": "grayscale",
    "density": 600,
    "altFontRendering": true,
    "scaleContent": true,
    "interpolation": "bicubic"
  }
}`}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-orange-700">⚡ Impresión Rápida - Borrador</h4>
                  <pre className="bg-orange-50 border border-orange-200 p-3 rounded-lg overflow-x-auto text-xs">
                    <code>{`{
  "printerId": 1,
  "documentUrl": "https://example.com/borrador.pdf",
  "documentName": "Borrador de Trabajo",
  "copies": 1,
  "options": {
    "colorType": "blackwhite",
    "density": 150,
    "rasterize": false,
    "scaleContent": true
  }
}`}</code>
                  </pre>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">❌ JSON Inválido</h4>
                  <pre className="bg-red-100 p-2 rounded text-xs mb-2">
                    <code>{`{
  "documentUrl": "https://example.com/doc.pdf"
}`}</code>
                  </pre>
                  <p className="text-xs text-red-600">❌ Falta printerId - Error 400</p>
                  <ul className="text-sm text-red-700 space-y-1 list-disc pl-4">
                    <li><strong>printerId</strong> es obligatorio</li>
                    <li><strong>documentUrl</strong> es obligatorio</li>
                    <li>La API retorna error 400 Bad Request</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Defaults Aplicados</h4>
                  <pre className="bg-green-100 p-2 rounded text-xs mb-2">
                    <code>{`{
  "printerId": 1,
  "documentUrl": "https://example.com/doc.pdf"
}`}</code>
                  </pre>
                  <p className="text-xs text-green-600">✅ Todo lo demás usa defaults</p>
                  <ul className="text-sm text-green-700 space-y-1 list-disc pl-4">
                    <li><strong>copies:</strong> 1</li>
                    <li><strong>duplex:</strong> false</li>
                    <li><strong>orientation:</strong> "portrait"</li>
                    <li><strong>margins:</strong> 6.35mm todos los lados</li>
                    <li><strong>colorType:</strong> "color"</li>
                    <li><strong>density:</strong> 300 DPI</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Consideraciones Importantes</h4>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-4">
                  <li><strong>URLs:</strong> Deben ser accesibles públicamente (no localhost)</li>
                  <li><strong>Tamaño:</strong> Archivos grandes pueden tardar más en procesarse</li>
                  <li><strong>Formatos:</strong> Principalmente PDF, también soporta imágenes comunes</li>
                  <li><strong>Transparencias:</strong> Si el PDF tiene problemas, usar <code>"rasterize": true</code></li>
                  <li><strong>Fuentes:</strong> Para fuentes especiales usar <code>"altFontRendering": true</code></li>
                  <li><strong>Defaults:</strong> Los valores por defecto están optimizados para la mayoría de casos</li>
                </ul>
              </div>
            </div>

            {/* Base64 Endpoint Documentation */}
            <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-purple-800 mb-4">🆕 Nuevo Endpoint: Impresión con Base64</h4>

              <div className="bg-purple-100 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-700 text-white">
                    POST
                  </span>
                  <code className="text-sm font-mono">/api/print-base64</code>
                </div>
                <p className="text-sm text-purple-700">
                  <strong>✨ Novedad:</strong> Imprime documentos PDF directamente desde datos Base64, 
                  sin necesidad de URLs públicas.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-purple-800 mb-2">📋 Ejemplo Completo Base64</h5>
                  <pre className="bg-purple-100 p-3 rounded text-xs overflow-x-auto">
                    <code>{`{
  "printerId": 1,
  "documentBase64": "JVBERi0xLjMKJeHp69ICMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovT3V0bGluZXMgMiAwIFIKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iago...",
  "documentName": "Factura_2024_001.pdf",
  "copies": 2,
  "duplex": true,
  "orientation": "portrait",
  "size": {
    "width": 2.25,
    "height": 1.25,
    "units": "in"
  },
  "margins": {
    "top": 15,
    "right": 15,
    "bottom": 15,
    "left": 15
  },
  "options": {
    "colorType": "color",
    "density": 300,
    "scaleContent": true,
    "rasterize": false
  }
}`}</code>
                  </pre>
                </div>

                <div>
                  <h5 className="font-semibold text-purple-800 mb-2">📤 Respuesta del Servidor</h5>
                  <pre className="bg-green-50 border border-green-200 p-3 rounded text-xs overflow-x-auto">
                    <code>{`{
  "success": true,
  "jobId": 42,
  "status": "ready_for_client",
  "immediate_processing": true,
  "message": "Documento Base64 listo para impresión inmediata",
  "printer": {
    "id": 1,
    "name": "HP LaserJet Pro",
    "status": "online"
  },
  "document": {
    "name": "Factura_2024_001.pdf",
    "type": "base64",
    "size": "2048 caracteres"
  }
}`}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h5 className="font-semibold text-green-800 mb-2">✅ Ventajas del Base64</h5>
                  <ul className="text-sm text-green-700 space-y-1 list-disc pl-4">
                    <li>No requiere URLs públicas</li>
                    <li>Documentos privados y seguros</li>
                    <li>Procesamiento inmediato</li>
                    <li>Compatible con todas las opciones QZ Tray</li>
                    <li>Ideal para formularios web</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-4">
                  <h5 className="font-semibold text-amber-800 mb-2">⚠️ Consideraciones</h5>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc pl-4">
                    <li>Tamaño máximo del JSON aumenta ~33%</li>
                    <li>Validación automática del Base64</li>
                    <li><code>documentName</code> es obligatorio</li>
                    <li>Usar <code>flavor: "base64"</code> en QZ Tray</li>
                    <li>Perfecto para documentos generados dinámicamente</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h5 className="font-semibold text-blue-800 mb-2">📏 Parámetro Size (Nuevo)</h5>
                  <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                    <li><strong>width/height:</strong> Dimensiones del papel</li>
                    <li><strong>units:</strong> "in" (pulgadas), "mm" (milímetros), "cm" (centímetros)</li>
                    <li><strong>Ejemplo Dymo:</strong> {"{ width: 2.25, height: 1.25, units: \"in\" }"}</li>
                    <li><strong>Ejemplo A4:</strong> {"{ width: 210, height: 297, units: \"mm\" }"}</li>
                    <li><strong>Ejemplo Ticket:</strong> {"{ width: 80, height: 200, units: \"mm\" }"}</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
                <h5 className="font-semibold text-blue-800 mb-2">💡 Ejemplo de Uso en JavaScript</h5>
                <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
                  <code>{`// Convertir archivo a Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remover prefijo "data:application/pdf;base64,"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Enviar a impresión
const printFile = async (file, printerId) => {
  const documentBase64 = await fileToBase64(file);

  const response = await fetch('/api/print-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      printerId: printerId,
      documentBase64: documentBase64,
      documentName: file.name,
      copies: 1,
      orientation: "portrait"
    })
  });

  return response.json();
};`}</code>
                </pre>
              </div>
            </div>

            {/* Get Print Jobs */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/print-jobs"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Obtiene todos los trabajos de impresión del usuario autenticado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Printers Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            🖨️ Printers Management
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage printers and check their status.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            {/* Get All Printers */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/printers"
                  readOnly
                />
              </div>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto text-gray-700">
{`[
  {
    "id": 14,
    "name": "Microsoft Print to PDF",
    "uniqueId": "microsoft_print_to_pdf_14",
    "location": "Local",
    "description": "Microsoft Print to PDF",
    "status": "online",
    "lastPrintTime": null
  }
]`}
                </pre>
              </div>
            </div>

            {/* Get Printer Status */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/printers/{id}/status"
                  readOnly
                />
              </div>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto text-gray-700">
{`{
  "printerId": 14,
  "uniqueId": "microsoft_print_to_pdf_14",
  "status": "online",
  "qzTrayConnected": true,
  "lastActivity": null,
  "pendingJobs": 0
}`}
                </pre>
              </div>
            </div>

            {/* Sync Printers */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-purple-50 text-purple-700 text-sm">
                  POST
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/printers/sync"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Usado internamente por QZ Tray para sincronizar impresoras</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            📊 Dashboard & Statistics
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Get system statistics and recent activity.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            {/* Statistics */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/stats"
                  readOnly
                />
              </div>
              <div className="mt-2 bg-gray-50 p-4 rounded-md">
                <pre className="text-xs overflow-auto text-gray-700">
{`{
  "activePrinters": 1,
  "jobsToday": 5,
  "pendingJobs": 0,
  "activeUsers": 1,
  "totalPrinters": 1,
  "totalUsers": 2,
  "totalJobs": 5
}`}
                </pre>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/recent-activity"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Obtiene los últimos 10 trabajos de impresión con detalles</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            👥 User Management
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage users and API keys (admin access required for most operations).
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            {/* Get Users */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/users"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-red-600">🔒 Requiere permisos de administrador</p>
            </div>

            {/* Get My API Key */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-blue-50 text-blue-700 text-sm">
                  GET
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/users/me/apikey"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Obtiene la API key del usuario autenticado</p>
            </div>

            {/* Rotate API Key */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-yellow-50 text-yellow-700 text-sm">
                  POST
                </span>
                <Input
                  className="flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                  value="/api/users/me/apikey/rotate"
                  readOnly
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Genera una nueva API key para el usuario autenticado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Codes Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            ⚠️ Error Codes & Troubleshooting
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-red-800">400 Bad Request</h4>
              <p className="text-sm text-red-600">Datos de entrada inválidos o faltantes</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-red-800">401 Unauthorized</h4>
              <p className="text-sm text-red-600">API key inválida o faltante</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-red-800">403 Forbidden</h4>
              <p className="text-sm text-red-600">Permisos insuficientes (se requiere admin)</p>
            </div>
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-red-800">404 Not Found</h4>
              <p className="text-sm text-red-600">Recurso no encontrado (impresora, usuario, etc.)</p>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-amber-800">💡 Tips para Postman</h4>
            <ul className="mt-2 text-sm text-amber-700 space-y-1 list-disc pl-4">
              <li>Siempre incluye <code>Content-Type: application/json</code></li>
              <li>El header Authorization debe tener el formato exacto: <code>Bearer tu-api-key</code></li>
              <li>Para printerId numérico, usa números sin comillas: <code>"printerId": 14</code></li>
              <li>Si recibes HTML en lugar de JSON, verifica los headers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            📥 Postman Collection
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Download the complete Postman collection with all endpoints configured.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <Button
            onClick={downloadPostmanCollection}
            className="inline-flex items-center"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Complete Postman Collection
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            La colección incluye variables para base_url, api_key y printerId. 
            Configúralas en Postman para usar todos los endpoints fácilmente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;