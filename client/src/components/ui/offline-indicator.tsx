import React, { useState, useEffect } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4 mr-2" />
        <AlertDescription className="flex items-center">
          Sin conexión a internet. La aplicación está funcionando en modo offline.
        </AlertDescription>
      </Alert>
    </div>
  );
}