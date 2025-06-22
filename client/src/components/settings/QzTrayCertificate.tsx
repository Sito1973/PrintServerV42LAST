
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, AlertTriangle, Key, FileText, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export const QzTrayCertificate: React.FC = () => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  // Función para probar la conexión con QZ Tray
  const testConnection = async () => {
    setGenerating(true);

    try {
      // Intentar inicializar QZ Tray
      const { initQzTray } = await import('@/lib/qz-tray');
      const result = await initQzTray();

      if (result) {
        toast({
          title: "Conexión exitosa",
          description: "Se ha establecido conexión con QZ Tray correctamente. La autorización fue aceptada.",
          variant: "default"
        });
      } else {
        toast({
          title: "Conexión fallida",
          description: "No se pudo conectar con QZ Tray. Verifique que esté ejecutándose e intente nuevamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error al conectar con QZ Tray:", error);
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "Ocurrió un error inesperado al intentar conectar con QZ Tray.",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Configuración de Certificados QZ Tray
        </CardTitle>
        <CardDescription>
          Instala los certificados generados para eliminar los diálogos de autorización.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Para eliminar el diálogo "Action Required", debes instalar tus certificados personalizados 
            tanto en Windows como en esta aplicación.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paso 1: Instalar certificados en Windows
            </h4>
            <div className="text-sm text-muted-foreground space-y-1 ml-6">
              <p>1. Ve a la carpeta: <code>C:\Users\manag\Downloads\QZ Tray Demo Cert</code></p>
              <p>2. Haz doble clic en el archivo <strong>digital-certificate</strong></p>
              <p>3. Haz clic en "Instalar certificado..."</p>
              <p>4. Selecciona "Máquina local" y luego "Siguiente"</p>
              <p>5. Selecciona "Colocar todos los certificados en el siguiente almacén"</p>
              <p>6. Haz clic en "Examinar" y selecciona "Entidades de certificación raíz de confianza"</p>
              <p>7. Completa la instalación</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Paso 2: Configurar certificados en la aplicación
            </h4>
            <div className="text-sm text-muted-foreground space-y-1 ml-6">
              <p>1. Abre el archivo <code>client/src/lib/qz-certificate.ts</code></p>
              <p>2. Reemplaza <code>AQUÍ_PEGA_EL_CONTENIDO_DEL_ARCHIVO_digital-certificate</code> con el contenido completo del archivo <strong>digital-certificate</strong></p>
              <p>3. Reemplaza <code>AQUÍ_PEGA_EL_CONTENIDO_DEL_ARCHIVO_private-key</code> con el contenido completo del archivo <strong>private-key</strong></p>
              <p>4. Guarda el archivo y recarga la aplicación</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Estado actual:</h4>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Certificados personalizados pendientes de configuración
            </div>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Una vez instalados correctamente, QZ Tray recordará tu decisión y no mostrará más diálogos de autorización.
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testConnection} 
          disabled={generating}
          className="w-full"
        >
          {generating ? "Probando conexión..." : "Probar Conexión"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QzTrayCertificate;
