# Torrent Scraper

Aplicación para scrapear torrents de https://descargamix.net/ultimos y notificar cuando aparecen películas de tu watchlist.

## 🚀 Características

- Scraping automático de la página de últimos torrents
- Detección de películas de tu lista de seguimiento
- Ejecución automática diaria a las 8:00 AM mediante cron
- Contenedor Docker listo para producción
- Resultados guardados en JSON

## 📋 Requisitos

- Node.js 20+ (para desarrollo local)
- Docker y Docker Compose (para despliegue)

## 🛠️ Configuración

### 1. Editar la lista de películas

Edita el archivo `movies.json` con las películas que quieres monitorizar:

```json
{
  "watchlist": [
    "Nombre de Película 1",
    "Nombre de Película 2",
    "Nombre de Película 3"
  ]
}
```

## 💻 Uso Local

### Compilar y ejecutar

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Ejecutar scraper
npm start
```

### Desarrollo

```bash
# Modo watch (recompila automáticamente)
npm run dev
```

## 🐳 Despliegue con Docker

### Construcción y ejecución

```bash
# Construir y levantar el contenedor
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener el contenedor
docker-compose down
```

### Configuración del Cron

El contenedor ejecuta el scraper:

- Inmediatamente al iniciar (para verificar que funciona)
- Todos los días a las 8:00 AM (hora configurada en `entrypoint.sh`)

Para cambiar el horario, edita el archivo `entrypoint.sh` y modifica la expresión cron:

```bash
# Formato: minuto hora día mes día_semana
0 8 * * *  # 8:00 AM todos los días
```

## 📁 Estructura del Proyecto

```
torrent-scraper/
├── src/
│   ├── index.ts        # Script principal del scraper
│   └── types.ts        # Definiciones de tipos TypeScript
├── movies.json         # Lista de películas a monitorizar
├── results.json        # Resultados del último scraping (generado)
├── Dockerfile          # Configuración del contenedor
├── docker-compose.yml  # Orquestación de Docker
├── entrypoint.sh       # Script de inicio con cron
└── tsconfig.json       # Configuración de TypeScript
```

## 📊 Resultados

Los resultados se guardan en `results.json` con el siguiente formato:

```json
{
  "foundMovies": [
    {
      "title": "Título de la película encontrada",
      "url": "https://..."
    }
  ],
  "totalTorrents": 150,
  "timestamp": "2026-02-04T12:00:00.000Z"
}
```

## 🔄 Actualizar la Watchlist sin Reconstruir

Gracias al volumen montado en Docker Compose, puedes editar `movies.json` en tu host y los cambios se reflejarán en la siguiente ejecución del scraper.

## 📝 Logs

Ver los logs del contenedor:

```bash
# Logs en tiempo real
docker-compose logs -f

# Logs de cron
docker exec torrent-scraper cat /var/log/cron.log
```

## 🛡️ Notas de Seguridad

- El scraper utiliza Playwright en modo headless
- No requiere credenciales ni autenticación
- Solo realiza lecturas, no modifica la página web objetivo

## 🔧 Solución de Problemas

### El scraper no encuentra películas

1. Verifica que los nombres en `movies.json` coincidan parcialmente con los títulos en la web
2. Revisa los logs para ver qué torrents se están detectando
3. La búsqueda es insensible a mayúsculas/minúsculas

### Error de Playwright en Docker

Si hay problemas con Chromium, verifica que todas las dependencias estén instaladas en el Dockerfile.

## 📄 Licencia

ISC
