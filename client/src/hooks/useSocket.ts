
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 [useSocket] Inicializando conexión WebSocket...');
    
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('✅ [useSocket] WebSocket conectado');
      setIsConnected(true);
      
      // Autenticación automática
      const apiKey = localStorage.getItem('apiKey');
      if (apiKey) {
        newSocket.emit('authenticate', { apiKey });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ [useSocket] WebSocket desconectado');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      if (data.success) {
        console.log(`✅ [useSocket] Autenticado como: ${data.username}`);
      } else {
        console.error('❌ [useSocket] Error de autenticación');
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 [useSocket] Cerrando conexión WebSocket...');
      newSocket.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
