
FROM node:20-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    netcat-traditional \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias (incluyendo dev para el build)
RUN npm ci --no-audit

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN npm run build

# Verificar que los archivos fueron generados correctamente
RUN ls -la dist/ && echo "Build completed successfully"

# NO eliminar drizzle-kit - crear una copia del node_modules completo
# Solo eliminar las dependencias más pesadas manualmente
RUN rm -rf node_modules/@types/node \
    node_modules/@types/react \
    node_modules/@types/express \
    node_modules/typescript \
    node_modules/tsx \
    node_modules/@vitejs \
    node_modules/vite \
    node_modules/esbuild \
    || true

# Crear archivo .env con configuración por defecto
RUN echo 'NODE_ENV=production\nPORT=3000\nHOST=0.0.0.0' > /app/.env

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Exponer puerto 3000
EXPOSE 3000

# Healthcheck en puerto 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Script de inicio simplificado - SIN bucles de migración
RUN echo '#!/bin/bash\n\
set -e\n\
echo "🚀 Iniciando aplicación en Easypanel..."\n\
\n\
# Verificar variables de entorno requeridas\n\
if [ -z "$DATABASE_URL" ]; then\n\
  echo "❌ Error: DATABASE_URL no está configurada"\n\
  exit 1\n\
fi\n\
\n\
echo "✅ DATABASE_URL configurada"\n\
echo "✅ PORT: $PORT"\n\
\n\
# Ejecutar migraciones UNA SOLA VEZ\n\
echo "🔄 Aplicando migraciones (una vez)..."\n\
npm run db:push || echo "⚠️ Advertencia: Error en migraciones"\n\
\n\
# Iniciar servidor en puerto 3000 directamente\n\
echo "🎯 Iniciando servidor en puerto $PORT..."\n\
exec node dist/index.js' > /app/start.sh && chmod +x /app/start.sh

# Comando de inicio
CMD ["/app/start.sh"]
