# PrinterHub - Sistema de Impresión Remota

Este sistema permite gestionar impresoras y trabajos de impresión de forma remota a través de una interfaz web.

### Usando solo Docker

1. Construye la imagen: `docker build -t printerhub .`
2. Ejecuta el contenedor: `docker run -p 3000:3000 -e DATABASE_URL=tu_url_de_postgres printerhub`

## Despliegue en Easypanel

1. Descarga este proyecto como archivo ZIP
2. En Easypanel, crea una nueva aplicación seleccionando "Custom"
3. Selecciona "Upload" para subir el archivo ZIP o conecta con el repositorio Git
4. El Dockerfile incluido será utilizado automáticamente por Easypanel
5. Configura la variable de entorno DATABASE_URL para conectar con tu base de datos

## Estructura del proyecto

- `/client` - Frontend React/TypeScript
- `/server` - Backend Express/TypeScript
- `/shared` - Tipos y esquemas compartidos
- `/public` - Archivos estáticos

## API Endpoints

La documentación de la API está disponible en la sección "API Docs" de la aplicación una vez iniciada.

## Licencia

MIT