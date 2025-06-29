#!/bin/sh
set -e
echo "🚀 Iniciando aplicación en Easypanel..."

# Verificar variables de entorno requeridas
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL no está configurada"
  exit 1
fi

echo "✅ DATABASE_URL configurada"
echo "✅ PORT: $PORT"

# Ejecutar migraciones UNA SOLA VEZ
echo "🔄 Aplicando migraciones (una vez)..."
npm run db:push || echo "⚠️ Advertencia: Error en migraciones"

# Iniciar servidor en puerto 3000 directamente
echo "🎯 Iniciando servidor en puerto $PORT..."
exec node dist/index.js