#!/bin/bash
set -e

# Mostrar todas las variables de entorno relacionadas con la base de datos (sin mostrar contraseñas completas)
echo "=== Variables de entorno de base de datos ==="
echo "DATABASE_URL: ${DATABASE_URL//:*@/:***@}"
echo "PGHOST: $PGHOST"
echo "PGPORT: $PGPORT"
echo "PGUSER: $PGUSER" 
echo "PGDATABASE: $PGDATABASE"
echo "PGPASSWORD: ***" # No mostramos la contraseña por seguridad
echo "======================================="

# Extraer host y puerto del DATABASE_URL
if [[ "$DATABASE_URL" =~ postgres://.+:.+@([^:]+):([0-9]+)/.* ]]; then
  DB_HOST="${BASH_REMATCH[1]}"
  DB_PORT="${BASH_REMATCH[2]}"
  echo "Host extraído de DATABASE_URL: $DB_HOST"
  echo "Puerto extraído de DATABASE_URL: $DB_PORT"
else
  # Usar variables de entorno si DATABASE_URL no está en el formato esperado
  DB_HOST="${PGHOST:-localhost}"
  DB_PORT="${PGPORT:-5432}"
  echo "Usando host y puerto de variables de entorno: $DB_HOST:$DB_PORT"
fi

# Verificar resolución de DNS
echo "Verificando resolución DNS para $DB_HOST..."
getent hosts $DB_HOST || echo "No se pudo resolver el nombre de host $DB_HOST"

# Intentar conexión con información adicional
echo "=== Intentando conexión a la base de datos ==="
echo "Esperando conexión a la base de datos en $DB_HOST:$DB_PORT..."
retries=20  # Aumentamos el número de intentos
until nc -z -w5 $DB_HOST $DB_PORT; do
  if [ $retries -eq 0 ]; then
    echo "Error: No se pudo conectar a la base de datos después de varios intentos."
    echo "Intentando diagnóstico de red:"
    ping -c 1 $DB_HOST || echo "No se puede hacer ping a $DB_HOST"
    exit 1
  fi
  retries=$((retries-1))
  echo "Reintentando conexión a la base de datos... ($retries intentos restantes)"
  sleep 5
done
echo "Base de datos disponible!"

# Comprobar la conexión con psql
echo "Verificando conexión a PostgreSQL con psql..."
export PGPASSWORD="${PGPASSWORD}"
pg_isready -h $DB_HOST -p $DB_PORT -U $PGUSER || echo "pg_isready falló, pero continuaremos"

# Ejecutar migraciones
echo "Aplicando migraciones..."
npm run db:push

# Iniciar la aplicación con registro adicional
echo "Iniciando la aplicación..."
export NODE_DEBUG=pg  # Activamos depuración para el módulo pg
exec npm start