FROM node:20-alpine

# Instalar cron y dependencias de Playwright
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dcron \
    nodejs \
    npm

# Establecer variables de entorno para Playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci && npm cache clean --force

# Instalar TypeScript globalmente
RUN npm install -g typescript

# Copiar código fuente y configuración
COPY src/ ./src/
COPY movies.json ./

# Compilar TypeScript
RUN tsc

# Copiar script de entrada y convertir finales de línea de Windows a Unix
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# Crear archivo de log
RUN touch /var/log/cron.log

# Punto de entrada
ENTRYPOINT ["/entrypoint.sh"]
