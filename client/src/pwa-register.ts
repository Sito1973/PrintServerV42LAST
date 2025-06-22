export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
          
          // Verificar actualizaciones cada 30 segundos
          setInterval(() => {
            registration.update();
          }, 30000);
          
          // Manejar actualizaciones del service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // Nuevo service worker disponible, recargar página
                    console.log('Nueva versión disponible, recargando...');
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          console.log('Error al registrar Service Worker:', error);
        });
    });
  }
}