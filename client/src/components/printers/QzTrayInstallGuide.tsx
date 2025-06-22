import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, AlertTriangle, HelpCircle, ExternalLink, CheckCircle } from 'lucide-react';

/**
 * Componente que proporciona una guía visual para instalar QZ Tray
 */
const QzTrayInstallGuide: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="mr-2 h-5 w-5 text-blue-500" />
          Guía de Instalación QZ Tray
        </CardTitle>
        <CardDescription>
          QZ Tray es una aplicación de código abierto que conecta su navegador con impresoras locales.
        </CardDescription>
      </CardHeader>
      
      <Alert variant="destructive" className="mx-6 mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Requerido para la detección de impresoras</AlertTitle>
        <AlertDescription>
          Para usar este sistema, debe instalar QZ Tray en su computadora.
        </AlertDescription>
      </Alert>
      
      <Alert className="mx-6 mb-4 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Versión recomendada: 2.2.x</AlertTitle>
        <AlertDescription className="text-green-600">
          La aplicación es compatible con la versión 2.2.4 de QZ Tray que tienes instalada actualmente.
        </AlertDescription>
      </Alert>
      
      <CardContent>
        <Tabs defaultValue="windows" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="windows">Windows</TabsTrigger>
            <TabsTrigger value="mac">Mac</TabsTrigger>
            <TabsTrigger value="linux">Linux</TabsTrigger>
          </TabsList>
          
          <TabsContent value="windows" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 1: Descargar QZ Tray</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Descargue el instalador de QZ Tray para Windows.
                </p>
                <Button className="w-full sm:w-auto" onClick={() => window.open('https://qz.io/download/', '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar para Windows
                </Button>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 2: Instalar QZ Tray</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Ejecute el archivo <code className="bg-gray-100 px-1 rounded">qz-tray-{'{version}'}.exe</code></li>
                  <li>Siga las instrucciones del instalador</li>
                  <li>Permita a QZ Tray hacer cambios en su dispositivo si se le solicita</li>
                  <li>Complete la instalación</li>
                </ol>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 3: Ejecutar QZ Tray</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>QZ Tray se ejecutará automáticamente después de la instalación</li>
                  <li>Verá el icono de QZ Tray en la barra de tareas</li>
                  <li>Cuando se conecte por primera vez, es posible que deba aceptar un certificado de seguridad</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mac" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 1: Descargar QZ Tray</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Descargue el instalador de QZ Tray para macOS.
                </p>
                <Button className="w-full sm:w-auto" onClick={() => window.open('https://qz.io/download/', '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar para Mac
                </Button>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 2: Instalar QZ Tray</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Abra el archivo <code className="bg-gray-100 px-1 rounded">qz-tray-{'{version}'}.pkg</code></li>
                  <li>Siga las instrucciones del instalador</li>
                  <li>Es posible que deba ingresar su contraseña de administrador</li>
                  <li>Complete la instalación</li>
                </ol>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 3: Permitir Aplicación</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>En macOS, es posible que deba permitir explícitamente que se ejecute QZ Tray</li>
                  <li>Vaya a Preferencias del Sistema &gt; Seguridad y Privacidad</li>
                  <li>Haga clic en "Permitir" junto a la notificación sobre QZ Tray</li>
                  <li>Reinicie QZ Tray desde la carpeta de Aplicaciones</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="linux" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 1: Descargar QZ Tray</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Descargue el instalador de QZ Tray para Linux.
                </p>
                <Button className="w-full sm:w-auto" onClick={() => window.open('https://qz.io/download/', '_blank')}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar para Linux
                </Button>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 2: Instalar QZ Tray</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Abra una terminal y navegue hasta la carpeta de descarga</li>
                  <li>Para Debian/Ubuntu: <code className="bg-gray-100 px-1 rounded">sudo dpkg -i qz-tray-{'{version}'}.deb</code></li>
                  <li>Para Red Hat/Fedora: <code className="bg-gray-100 px-1 rounded">sudo rpm -i qz-tray-{'{version}'}.rpm</code></li>
                  <li>Instalación manual: <code className="bg-gray-100 px-1 rounded">sudo tar -xf qz-tray-{'{version}'}.tar.gz -C /opt</code></li>
                </ol>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2 text-lg">Paso 3: Ejecutar QZ Tray</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Abra QZ Tray desde el menú de aplicaciones</li>
                  <li>O ejecute desde la terminal: <code className="bg-gray-100 px-1 rounded">/opt/qz-tray/qz-tray</code></li>
                  <li>Asegúrese de que tiene las dependencias de Java instaladas</li>
                </ol>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start space-y-4">
        <p className="text-sm text-gray-500">
          Es posible que necesite reiniciar su navegador después de instalar QZ Tray para que la conexión funcione correctamente.
        </p>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.open('https://qz.io/wiki/installation', '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Documentación Oficial
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QzTrayInstallGuide;