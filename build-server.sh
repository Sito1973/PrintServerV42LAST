#!/bin/bash
# Script para compilar el servidor y copiar los archivos necesarios

# Ejecutar la compilación normal
npm run build

# Crear directorio para archivos adicionales si no existe
mkdir -p dist/server

# Copiar archivos necesarios
cp server/qz-certificate.ts dist/server/
cp server/queryClient.ts dist/server/

echo "Build completado con archivos adicionales copiados"