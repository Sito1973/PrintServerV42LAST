import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Printer, AlertTriangle, RefreshCw, CheckCircle, HelpCircle, Download, Loader2 } from "lucide-react";
// Importamos tanto las funciones individuales como el objeto default
import qzTray, { 
  isQzAvailable, 
  isQzTrayActive, 
  initQzTray, 
  getPrinters, 
  syncPrintersWithServer 
} from '@/lib/qz-tray';
// Importamos tanto las funciones individuales como el objeto default
import autoDiscovery, { 
  checkQzTrayRunning, 
  generateDiagnosticReport 
} from '@/lib/auto-discovery';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QzTrayInstallGuide from './QzTrayInstallGuide';

const PrinterDetector: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [qzConnected, setQzConnected] = useState(false);
  const [localPrinters, setLocalPrinters] = useState<string[]>([]);
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const { apiKey } = useAuth();
  const { toast } = useToast();

  // Comprobar si QZ Tray está activo al cargar
  useEffect(() => {
    const checkQzTray = async () => {
      try {
        console.log("PrinterDetector: Iniciando verificación de QZ Tray...");

        // Verificamos primero si la biblioteca está disponible usando la función centralizada
        if (!isQzAvailable()) {
          console.error("PrinterDetector: La biblioteca QZ Tray no está disponible en el navegador");
          setQzConnected(false);
          return;
        }

        // Verificamos si QZ Tray ya está activo primero
        const initialActive = isQzTrayActive();
        console.log("PrinterDetector: Estado inicial de QZ Tray:", initialActive ? "CONECTADO" : "DESCONECTADO");

        if (initialActive) {
          // Si ya está activo, simplemente actualizamos el estado
          setQzConnected(true);

          // Intentamos obtener las impresoras disponibles
          try {
            console.log("PrinterDetector: Obteniendo lista de impresoras...");
            const printers = await qzTray.getPrinters();
            console.log("PrinterDetector: Impresoras detectadas:", printers);
            setLocalPrinters(printers);
            setSelectedPrinters(printers);
          } catch (printerError) {
            console.error("PrinterDetector: Error al obtener lista de impresoras:", printerError);
          }
        } else {
          // Si no está activo, intentamos inicializarlo
          try {
            console.log("PrinterDetector: Intentando inicializar QZ Tray...");
            const success = await qzTray.initQzTray();
            console.log("PrinterDetector: Resultado de inicialización:", success);

            // Actualizamos el estado según el resultado
            setQzConnected(success);

            // Si se pudo inicializar, obtenemos las impresoras
            if (success) {
              try {
                console.log("PrinterDetector: Obteniendo lista de impresoras después de inicializar...");
                const printers = await qzTray.getPrinters();
                console.log("PrinterDetector: Impresoras detectadas:", printers);
                setLocalPrinters(printers);
                setSelectedPrinters(printers);
              } catch (printerError) {
                console.error("PrinterDetector: Error al obtener lista de impresoras después de inicializar:", printerError);
              }
            }
          } catch (initError) {
            console.error("PrinterDetector: Error al inicializar QZ Tray:", initError);
            setQzConnected(false);
          }
        }
      } catch (error) {
        console.error("PrinterDetector: Error al verificar estado de QZ Tray:", error);
        setQzConnected(false);
      }
    };

    // Ejecutamos la verificación al montar el componente
    checkQzTray();

    // Registramos un oyente para cuando QZ Tray se cargue
    const handleQzTrayLoaded = () => {
      console.log("PrinterDetector: Evento 'qz-tray-loaded' detectado");
      checkQzTray();
    };

    window.addEventListener('qz-tray-loaded', handleQzTrayLoaded);

    // Limpiamos el oyente al desmontar
    return () => {
      window.removeEventListener('qz-tray-loaded', handleQzTrayLoaded);
    };
  }, []);

  // Función para escanear impresoras
  const scanForPrinters = async () => {
    if (!qzConnected) {
      toast({
        variant: "destructive",
        title: "QZ Tray no conectado",
        description: "Por favor, conecte QZ Tray para detectar impresoras.",
      });
      return;
    }

    setIsScanning(true);

    try {
      console.log("Escaneando impresoras...");
      const printers = await qzTray.getPrinters();
      console.log("Impresoras detectadas:", printers);
      setLocalPrinters(printers);
      setSelectedPrinters(printers); // Seleccionar todas las impresoras detectadas por defecto

      if (printers.length === 0) {
        toast({
          variant: "destructive",
          title: "Sin impresoras",
          description: "No se detectaron impresoras en este equipo.",
        });
      } else {
        toast({
          title: "Escaneo completado",
          description: `Se detectaron ${printers.length} impresoras.`,
        });
      }
    } catch (error) {
      console.error("Error al escanear impresoras:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al escanear impresoras. Por favor, verifique que QZ Tray está funcionando correctamente.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Manejo de selección de impresoras
  const handleSelectAll = (checked: boolean) => {
    setSelectedPrinters(checked ? [...localPrinters] : []);
  };

  const handlePrinterSelection = (printer: string, checked: boolean) => {
    if (checked) {
      setSelectedPrinters(prev => [...prev, printer]);
    } else {
      setSelectedPrinters(prev => prev.filter(p => p !== printer));
    }
  };

  // Función para sincronizar las impresoras seleccionadas
  const handleSyncPrinters = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "No autorizado",
        description: "Por favor, inicie sesión para sincronizar impresoras.",
      });
      return;
    }

    setIsScanning(true);
    setSyncCompleted(false);

    console.log("Iniciando sincronización con servidor, apiKey disponible:", apiKey ? "Sí" : "No");
    console.log("Impresoras seleccionadas:", selectedPrinters);

    try {
      // Verificamos que podamos obtener la información del sistema
      console.log("Obteniendo información del sistema...");
      if (!isQzTrayActive()) {
        console.log("QZ Tray no está activo, intentando inicializar...");
        await initQzTray();

        if (!isQzTrayActive()) {
          console.log("No se pudo inicializar QZ Tray");
          throw new Error("No se pudo conectar a QZ Tray");
        }
      }

      // Mostrar información de diagnóstico
      console.group("Diagnóstico pre-sincronización");
      console.log("API Key:", apiKey.substring(0, 5) + "...");
      console.log("API Key length:", apiKey.length);
      console.log("Impresoras seleccionadas:", selectedPrinters);
      console.log("localStorage API key:", localStorage.getItem("api_key")?.substring(0, 5) + "...");
      console.groupEnd();

      console.log("Iniciando sincronización directa de impresoras seleccionadas...");

      // Preparar los datos de las impresoras seleccionadas
      const printerData = selectedPrinters.map(printerName => {
        // Generar un ID único para cada impresora basado en su nombre
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

      console.log("Enviando datos de impresoras:", printerData);

      // Realizar la sincronización directamente con fetch
      const syncResponse = await fetch('/api/printers/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(printerData)
      });

      console.log("Respuesta de sincronización:", {
        status: syncResponse.status,
        statusText: syncResponse.statusText,
        ok: syncResponse.ok
      });

      if (!syncResponse.ok) {
        throw new Error(`Error en sincronización: ${syncResponse.status} ${syncResponse.statusText}`);
      }

      const syncResult = await syncResponse.json();
      console.log("Resultado de sincronización:", syncResult);

      // Verificar si al menos una impresora se sincronizó correctamente
      const success = syncResult && syncResult.success === true;
      console.log("Éxito en la sincronización:", success);

      if (success) {
        setSyncCompleted(true);
        toast({
          title: "Sincronización completada",
          description: `${selectedPrinters.length} impresora(s) sincronizadas con el servidor.`,
        });
      } else {
        console.log("La sincronización devolvió falso, mostrando error...");
        toast({
          variant: "destructive",
          title: "Error de sincronización",
          description: "No se pudieron sincronizar algunas impresoras.",
        });
      }
    } catch (error) {
      console.error('Error al sincronizar impresoras:', error);
      // Mostrar información más detallada del error
      let errorMessage = "Ocurrió un error al sincronizar las impresoras con el servidor.";

      if (error instanceof Error) {
        errorMessage += ` Detalles: ${error.message}`;
        console.error('Error detallado:', error.message);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
      }

      // Intentar obtener más información sobre el estado de QZ Tray
      try {
        const qzActive = isQzTrayActive();
        console.log("Estado actual de QZ Tray:", qzActive ? "ACTIVO" : "INACTIVO");
      } catch (e) {
        console.error("Error al verificar estado de QZ Tray:", e);
      }

      // Mostrar notificación de error
      toast({
        variant: "destructive",
        title: "Error de sincronización",
        description: errorMessage,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Función para el diagnóstico avanzado
  const runDiagnostic = async () => {
    try {
      // Mostrar cargando
      toast({
        title: "Verificando estado...",
        description: "Analizando estado de QZ Tray...",
      });

      // Comprobar estado básico
      const isAvailable = typeof (window as any).qz !== 'undefined';
      const qz = (window as any).qz;
      const isActive = isAvailable && qz.websocket && qz.websocket.isActive && qz.websocket.isActive();

      // Obtener diagnóstico simple
      let isRunning = false;
      try {
        isRunning = await autoDiscovery.checkQzTrayRunning();
      } catch (err) {
        console.error("Error verificando si QZ Tray está en ejecución:", err);
      }

      toast({
        title: "Diagnóstico completado",
        description: isAvailable ? 
          `QZ Tray ${isActive ? "CONECTADO ✅" : "NO CONECTADO ❌"}` : 
          "QZ Tray no está disponible",
        duration: 5000
      });

      // Mostrar alerta de diagnóstico
      alert(`DIAGNÓSTICO QZ TRAY:
------------------------------------
- Biblioteca QZ Tray: ${isAvailable ? "CARGADA ✅" : "NO CARGADA ❌"}
- Versión: ${(window as any).qz?.version || "Desconocida"}
- Conexión WebSocket: ${isActive ? "ACTIVA ✅" : "INACTIVA ❌"}
- Aplicación en ejecución: ${isRunning ? "SÍ ✅" : "PROBABLEMENTE NO ❌"}

ACCIONES RECOMENDADAS:
------------------------------------
1. Asegúrese que QZ Tray versión 2.2.4 está instalado correctamente
2. REINICIE QZ Tray completamente (cierre y vuelva a abrirlo)
3. Reinicie su navegador DESPUÉS de que QZ Tray esté en ejecución
4. Compruebe que QZ Tray está ejecutándose en su sistema
5. Acepte cualquier diálogo de seguridad que aparezca en QZ Tray`);
    } catch (error) {
      console.error("Error al verificar estado:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al verificar el estado de QZ Tray.",
      });
    }
  };

const testQzTrayConnection = async () => {
    setTestingConnection(true);
    try {
      console.log("🔄 Iniciando prueba de conexión QZ Tray...");

      // Intentamos conectar a QZ Tray usando nuestra biblioteca actualizada
      const connected = await qzTray.initQzTray({
        usingSecure: false, // Usar puertos inseguros para desarrollo
        retries: 3,
        delay: 1
      });

      if (connected) {
        console.log("✅ Conexión exitosa, obteniendo impresoras...");
        // Obtener lista de impresoras para confirmar que funciona
        const printers = await qzTray.getPrinters();
        console.log("🖨️ Impresoras detectadas:", printers);
        setConnectionStatus("success");
      } else {
        console.log("❌ No se pudo establecer conexión");
        setConnectionStatus("failed");
      }
    } catch (error) {
      console.error("❌ Error al conectar con QZ Tray:", error);
      setConnectionStatus("failed");
    } finally {
      setTestingConnection(false);
    }
  };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Detector de Impresoras
        </CardTitle>
        <CardDescription>
          Detecta impresoras locales manualmente y selecciona cuáles sincronizar con el servidor.
          <br />
          <span className="text-sm text-blue-600 font-medium">
            💡 Tip: Las impresoras se detectan solo mediante escaneo manual para optimizar el rendimiento.
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!qzConnected ? (
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Estado de Conexión</TabsTrigger>
              <TabsTrigger value="install">Instalación QZ Tray</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="mt-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>QZ Tray no está conectado</AlertTitle>
                <AlertDescription>
                  Para detectar impresoras automáticamente, instale y ejecute QZ Tray en este equipo.
                  <div className="mt-3">
                    <div className="flex space-x-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={async () => {
                          try {
                            toast({
                              title: "Conectando...",
                              description: "Intentando conectar con QZ Tray, por favor espere...",
                            });

                            // Verificamos si la biblioteca está disponible después de recargar
                            console.log("Verificando QZ Tray antes de intentar conectar...");
                            const isAvailable = (window as any).qz !== undefined;
                            console.log("QZ Tray disponible:", isAvailable);

                            if (!isAvailable) {
                              // Recargar los scripts de QZ Tray
                              const script = document.createElement('script');
                              script.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.min.js";
                              script.onload = () => {
                                console.log("QZ Tray script recargado correctamente (versión 2.2.4)");
                                window.dispatchEvent(new Event('qz-tray-loaded'));
                              };
                              document.head.appendChild(script);

                              toast({
                                title: "Reiniciando QZ Tray",
                                description: "Se está recargando la biblioteca de QZ Tray 2.2.4...",
                              });

                              // Esperar 2 segundos para que se cargue el script
                              await new Promise(resolve => setTimeout(resolve, 2000));
                            }

                            // Intentar inicializar QZ Tray con el certificado personalizado
                            console.log("Intentando inicializar QZ Tray con certificado personalizado...");
                            const initResult = await qzTray.initQzTray();
                            console.log("Resultado de inicialización:", initResult);
                            setQzConnected(qzTray.isQzTrayActive());

                            if (qzTray.isQzTrayActive()) {
                              toast({
                                title: "Conexión exitosa",
                                description: "Se ha conectado a QZ Tray correctamente con el certificado personalizado.",
                              });
                              const printers = await qzTray.getPrinters();
                              console.log("PrinterDetector: Impresoras detectadas después de reintentar:", printers.length);
                              setLocalPrinters(printers);
                              setSelectedPrinters(printers);
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Error de conexión",
                                description: "No se pudo conectar a QZ Tray. Verifique que esté instalado y en ejecución en su sistema.",
                              });
                            }
                          } catch (error) {
                            console.error('Error al conectar a QZ Tray:', error);
                            toast({
                              variant: "destructive",
                              title: "Error de conexión",
                              description: "Error al intentar conectar con QZ Tray. Verifique que esté instalado y en ejecución.",
                            });
                          }
                        }}
                      >
                        Reintentar Conexión
                      </Button>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={runDiagnostic}
                      >
                        Diagnóstico Avanzado
                      </Button>
                    </div>

                    <p className="mt-4 text-sm text-gray-700">
                      <strong>Nota:</strong> Si la biblioteca QZ Tray está cargada pero no se puede conectar,
                      cambie a la pestaña "Instalación QZ Tray" para instrucciones detalladas de instalación.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="install" className="mt-4">
              <QzTrayInstallGuide />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">QZ Tray conectado correctamente</AlertTitle>
              <AlertDescription className="text-green-600">
                La conexión con QZ Tray está activa. Ahora puede detectar y sincronizar impresoras.
              </AlertDescription>
            </Alert>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Impresoras locales detectadas: <span className="font-medium">{localPrinters.length}</span>
              </p>

              {localPrinters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="select-all" 
                      checked={selectedPrinters.length === localPrinters.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="font-medium">
                      Seleccionar todas ({localPrinters.length})
                    </Label>
                  </div>

                  <div className="border rounded-md p-3 space-y-2">
                    {localPrinters.map((printer, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`printer-${index}`} 
                          checked={selectedPrinters.includes(printer)}
                          onCheckedChange={(checked) => handlePrinterSelection(printer, !!checked)}
                        />
                        <Label htmlFor={`printer-${index}`} className="text-gray-600">
                          {printer}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {syncCompleted && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Sincronización completada</AlertTitle>
                <AlertDescription className="text-green-600">
                  Se han registrado {selectedPrinters.length} impresora(s) correctamente en el servidor.
                </AlertDescription>
                {selectedPrinters.length > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    <p className="font-medium">Impresoras sincronizadas:</p>
                    <ul className="mt-1 list-disc list-inside pl-2">
                      {selectedPrinters.map((printer, index) => (
                        <li key={index}>{printer}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Alert>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={scanForPrinters} 
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Escaneando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Escanear Impresoras
            </>
          )}
        </Button>

        <Button 
          onClick={handleSyncPrinters} 
          disabled={isScanning || selectedPrinters.length === 0 || !qzConnected}
        >
          Sincronizar {selectedPrinters.length > 0 ? `(${selectedPrinters.length})` : ''}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrinterDetector;