
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { initializeQzTray } from "@/lib/qz-tray";

export function QzTrayAuthorization() {
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    try {
      const success = await initializeQzTray();
      if (success) {
        setAuthStatus('success');
      } else {
        setAuthStatus('error');
      }
    } catch (error) {
      console.error('Error durante la autorización:', error);
      setAuthStatus('error');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autorización QZ Tray
        </CardTitle>
        <CardDescription>
          Autoriza esta aplicación web para conectarse con QZ Tray y enviar trabajos de impresión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authStatus === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ¡Autorización exitosa! Esta aplicación ahora puede conectarse con QZ Tray.
            </AlertDescription>
          </Alert>
        )}

        {authStatus === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error al autorizar. Asegúrate de que QZ Tray esté ejecutándose y haz clic en "Allow" cuando aparezca el diálogo.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Pasos para autorizar:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Asegúrate de que QZ Tray esté instalado y ejecutándose</li>
            <li>Haz clic en el botón "Autorizar QZ Tray"</li>
            <li>Cuando aparezca el diálogo de seguridad, haz clic en "Allow"</li>
            <li>Opcionalmente, marca "Remember this decision" para evitar futuras confirmaciones</li>
          </ol>
        </div>

        <Button 
          onClick={handleAuthorize}
          disabled={isAuthorizing || authStatus === 'success'}
          className="w-full"
        >
          {isAuthorizing ? 'Autorizando...' : 
           authStatus === 'success' ? 'Autorizado ✓' : 
           'Autorizar QZ Tray'}
        </Button>
      </CardContent>
    </Card>
  );
}
