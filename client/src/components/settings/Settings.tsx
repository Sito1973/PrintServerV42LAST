// client/src/components/settings/Settings.tsx - VERSIÓN ACTUALIZADA

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  AlertOctagon,
  RefreshCw,
  Shield,
  Printer,
  Database,
  Server,
  Activity,
  CheckCircle,
  Building2
} from "lucide-react";
import { useAppSettings } from "@/components/AppContext";
import { useAuth } from '@/components/auth/AuthProvider';
import qzTray from "@/lib/qz-tray";
import PrintJobMonitor from "@/components/print-jobs/PrintJobMonitor";
import QzTrayCertificate from "@/components/settings/QzTrayCertificate";
import CompanyLocationSettings from "@/components/settings/CompanyLocationSettings";

const Settings: React.FC = () => {
  const auth = useAuth();
  const [displayedApiKey, setDisplayedApiKey] = useState(auth.apiKey || '');

  // Usar el contexto de la aplicación para la configuración
  const { settings, updateSettings } = useAppSettings();

  // Form state for general settings
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: settings,
  });

  // Observar cambios en el formulario
  const companyName = watch('companyName');
  const adminEmail = watch('adminEmail');
  const enableNotifications = watch('enableNotifications');

  // QZ Tray connection test state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "untested" | "success" | "failed"
  >("untested");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiKeyRotationStatus, setApiKeyRotationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Efecto para actualizar el título de la aplicación cuando cambia el nombre de la empresa
  useEffect(() => {
    if (companyName) {
      document.title = companyName;
    }
  }, [companyName]);

  // Effect to keep displayedApiKey in sync with auth context
  useEffect(() => {
    setDisplayedApiKey(auth.apiKey || '');
  }, [auth.apiKey]);

  // Test QZ Tray connection usando el certificado auto-firmado integrado
  const testQzTrayConnection = async () => {
    setTestingConnection(true);
    try {
      // Intentamos conectar a QZ Tray usando nuestra biblioteca
      const connected = await qzTray.initQzTray();

      // Actualizamos el estado de la conexión
      setConnectionStatus(connected ? "success" : "failed");
    } catch (error) {
      console.error("Error al conectar con QZ Tray:", error);
      setConnectionStatus("failed");
    } finally {
      setTestingConnection(false);
    }
  };

  // Save general settings
  const onSubmitGeneral = (data: any) => {
    // Actualizar los ajustes usando el contexto de la aplicación
    updateSettings(data);

    // Actualizar el documento para reflejar los cambios
    document.title = data.companyName;

    // Mostrar mensaje de éxito
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    console.log("General settings updated:", data);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="companies">Empresas y Sedes</TabsTrigger>
          <TabsTrigger value="qztray">QZ Tray Setup</TabsTrigger>
          <TabsTrigger value="printmonitor">Monitor de Impresión</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic settings for your PrinterHub instance.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmitGeneral)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Your Company"
                    {...register("companyName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@example.com"
                    {...register("adminEmail")}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableNotifications" 
                    checked={watch('enableNotifications')}
                    onCheckedChange={(checked) => setValue('enableNotifications', checked)}
                  />
                  <Label htmlFor="enableNotifications">
                    Enable email notifications
                  </Label>
                </div>

                {saveSuccess && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 rounded-md flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Configuración guardada correctamente
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Empresas y Sedes Settings */}
        <TabsContent value="companies">
          <CompanyLocationSettings />
        </TabsContent>

        {/* QZ Tray Setup */}
        <TabsContent value="qztray">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de QZ Tray</CardTitle>
                <CardDescription>
                  Configura los ajustes de conexión de QZ Tray para la comunicación con impresoras.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qzHost">Host de QZ Tray</Label>
                  <Input
                    id="qzHost"
                    placeholder="localhost"
                    defaultValue="localhost"
                  />
                  <p className="text-sm text-muted-foreground">
                    El valor predeterminado es localhost ya que QZ Tray se ejecuta en la máquina del cliente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qzPort">Puerto de QZ Tray</Label>
                  <Input
                    id="qzPort"
                    placeholder="8181"
                    defaultValue="8181"
                  />
                  <p className="text-sm text-muted-foreground">
                    El puerto predeterminado de QZ Tray es 8181.
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Test de Conexión QZ Tray</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={testQzTrayConnection}
                      disabled={testingConnection}
                    >
                      {testingConnection ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Activity className="mr-2 h-4 w-4" />
                      )}
                      {testingConnection ? "Probando..." : "Probar Conexión"}
                    </Button>

                    {connectionStatus === "success" && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Conectado exitosamente
                      </div>
                    )}

                    {connectionStatus === "failed" && (
                      <div className="flex items-center text-red-600">
                        <AlertOctagon className="mr-2 h-4 w-4" />
                        Error de conexión
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Verifica la conexión con QZ Tray antes de enviar trabajos de impresión.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QZ Tray Certificate Configuration */}
            <QzTrayCertificate />
          </div>
        </TabsContent>

        {/* Print Monitor */}
        <TabsContent value="printmonitor">
          <Card>
            <CardHeader>
              <CardTitle>Monitor de Trabajos de Impresión</CardTitle>
              <CardDescription>
                Monitorea el estado de todos los trabajos de impresión en tiempo real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrintJobMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage API keys and security configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={displayedApiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(displayedApiKey);
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use this API key to authenticate API requests.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Regenerate API Key</Label>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      setApiKeyRotationStatus('loading');
                      try {
                        const newApiKey = await auth.rotateApiKey();
                        if (newApiKey) {
                          setDisplayedApiKey(newApiKey);
                          setApiKeyRotationStatus('success');
                          setTimeout(() => setApiKeyRotationStatus('idle'), 3000);
                        } else {
                          setApiKeyRotationStatus('error');
                          setTimeout(() => setApiKeyRotationStatus('idle'), 3000);
                        }
                      } catch (error) {
                        console.error('Error rotating API key:', error);
                        setApiKeyRotationStatus('error');
                        setTimeout(() => setApiKeyRotationStatus('idle'), 3000);
                      }
                    }}
                    disabled={apiKeyRotationStatus === 'loading'}
                  >
                    {apiKeyRotationStatus === 'loading' ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="mr-2 h-4 w-4" />
                    )}
                    {apiKeyRotationStatus === 'loading' ? "Generando..." : "Regenerar API Key"}
                  </Button>

                  {apiKeyRotationStatus === 'success' && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      API Key actualizada
                    </div>
                  )}

                  {apiKeyRotationStatus === 'error' && (
                    <div className="flex items-center text-red-600">
                      <AlertOctagon className="mr-2 h-4 w-4" />
                      Error al generar nueva API Key
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  ⚠️ Warning: Regenerating will invalidate the current API key.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;