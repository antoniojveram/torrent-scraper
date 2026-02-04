#!/bin/sh

# Script de entrada para ejecutar el scraper con cron

# Ejecutar el scraper inmediatamente al iniciar el contenedor (opcional)
echo "Ejecutando scraper inicial..."
node /app/dist/index.js

# Configurar cron para ejecutar todos los días a las 8:00 AM
echo "0 8 * * * cd /app && node /app/dist/index.js >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Iniciar cron en primer plano
echo "Cron configurado para ejecutarse todos los días a las 8:00 AM"
crond -f -l 2
