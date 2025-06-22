#!/bin/bash
set -e

# Función para esperar que PostgreSQL esté disponible
wait_for_postgres() {
  # Extraer host y puerto del DATABASE_URL
  if [[ "$DATABASE_URL" == postgres://* ]]; then
    # Parse DATABASE_URL to get host and port
    DB_HOST=$(echo $DATABASE_URL | awk -F[@/:] '{print $4}')
    DB_PORT=$(echo $DATABASE_URL | awk -F[@/:] '{print $5}')
  else
    # Si no hay DATABASE_URL, usar valores predeterminados (servicios Docker)
    DB_HOST=${POSTGRES_HOST:-db}
    DB_PORT=${POSTGRES_PORT:-5432}
  fi

  echo "Esperando que PostgreSQL esté disponible en $DB_HOST:$DB_PORT..."
  
  until pg_isready -h $DB_HOST -p $DB_PORT -U postgres; do
    echo "PostgreSQL no está listo - esperando..."
    sleep 2
  done
  
  echo "PostgreSQL está listo!"
}

# Esperar que la base de datos esté disponible antes de iniciar la aplicación
wait_for_postgres

# Ejecutar las migraciones de la base de datos
echo "Ejecutando migraciones de la base de datos..."
npm run db:push

# Ejecutar el comando que se pasa como argumento (generalmente npm start)
exec "$@"