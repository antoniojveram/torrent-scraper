# Torrent Scraper

Aplicación para scrapear torrents de https://dontorrent.supply/ultimos, y notificar cuando aparecen películas de tu watchlist.

## 🚀 Características

- Scraping automático de la página de últimos estrenos (DonTorrent)
- Detección de películas de tu lista de seguimiento
- **📱 Notificaciones por Telegram** agrupadas por fuente
- Ejecución automática diaria a las 8:00 AM mediante cron
- Contenedor Docker listo para producción
- Resultados guardados en JSON

## 📋 Requisitos

- Node.js 20+ (para desarrollo local)
- Docker y Docker Compose (para despliegue)
- **(Opcional)** Bot de Telegram para notificaciones

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

### 2. Configurar notificaciones de Telegram (Opcional)

Para recibir notificaciones en tu móvil cada vez que se ejecuta el scraper:

#### Paso 1: Crear un bot de Telegram

1. Abre Telegram y busca **@BotFather**
2. Envía el comando `/newbot`
3. Sigue las instrucciones y elige un nombre para tu bot
4. **Guarda el token** que te proporciona (ejemplo: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### Paso 2: Obtener tu Chat ID

1. Busca **@userinfobot** en Telegram
2. Inicia una conversación y te dará tu **Chat ID** (ejemplo: `123456789`)

#### Paso 3: Configurar las variables de entorno

Edita el archivo `docker-compose.yml` y descomenta estas líneas con tus valores:

```yaml
environment:
  - TZ=Europe/Madrid
  - TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
  - TELEGRAM_CHAT_ID=123456789
```

**Para desarrollo local**, crea un archivo `.env` en la raíz:

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

Y ejecuta con: `export $(cat .env | xargs) && npm start` (Linux/Mac) o configura las variables en Windows.

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

**⚠️ Importante:** Si actualizas las variables de Telegram después de crear el contenedor, debes reconstruirlo:

```bash
docker-compose down
docker-compose up -d --build
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
│   ├── index.ts        # Script principal (orquesta los scrapers)
│   ├── scrapers/
│   │   └── dontorrent.ts   # Scraper de dontorrent.supply (salta Anubis)
│   ├── telegram.ts     # Módulo de notificaciones de Telegram
│   └── types.ts        # Definiciones de tipos TypeScript
├── movies.json         # Lista de películas a monitorizar
├── results/            # Resultados del último scraping (generado, volumen Docker)
├── Dockerfile          # Configuración del contenedor
├── docker-compose.yml  # Orquestación de Docker
├── entrypoint.sh       # Script de inicio con cron
├── .env.example        # Ejemplo de variables de entorno
└── tsconfig.json       # Configuración de TypeScript
```

## 📱 Notificaciones de Telegram

Cuando las notificaciones están habilitadas, recibirás un mensaje cada vez que se ejecuta el scraper con:

- 📅 Fecha y hora de la ejecución
- 📦 Número total de torrents analizados y estado de cada fuente
- 🎉 Películas encontradas agrupadas por fuente (si hay coincidencias)
- 🔗 Enlaces directos a los torrents

**Ejemplo de notificación:**

```
🎬 Torrent Scraper - Reporte

📅 Fecha: 17/09/2026, 08:00:15
📦 Total torrents analizados: 56

🌐 Fuentes:
   • DonTorrent: 56 torrents

🎉 ¡1 PELÍCULA(S) ENCONTRADA(S)!

📡 DonTorrent
1. Vaiana — (BluRay-1080p) · 2026-09-15
   🔗 Ver enlace
```

## 📊 Resultados

Los resultados se guardan en `results/results.json` (dentro del volumen montado en Docker) con el siguiente formato:

```json
{
  "foundMovies": [
    {
      "title": "Título de la película encontrada",
      "url": "https://...",
      "date": "2026-09-15",
      "quality": "(BluRay-1080p)",
      "type": "movie",
      "source": "DonTorrent"
    }
  ],
  "sources": [
    {
      "source": "DonTorrent",
      "url": "https://dontorrent.supply/ultimos",
      "totalTorrents": 56,
      "foundMovies": []
    }
  ],
  "totalTorrents": 56,
  "timestamp": "2026-09-17T12:00:00.000Z"
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
- Solo realiza lecturas, no modifica las páginas web objetivo
- DonTorrent usa **Anubis**, una protección proof-of-work contra bots: el scraper usa un User-Agent de navegador real y espera a que el reto JavaScript se resuelva automáticamente

## 🔧 Solución de Problemas

### El scraper no encuentra películas

1. Verifica que los nombres en `movies.json` coincidan parcialmente con los títulos en la web
2. Revisa los logs para ver qué torrents se están detectando
3. La búsqueda es insensible a mayúsculas/minúsculas

### Error de Playwright en Docker

Si hay problemas con Chromium, verifica que todas las dependencias estén instaladas en el Dockerfile.

### DonTorrent bloquea el acceso (Anubis)

Si en los logs aparece `Anubis ha bloqueado la petición`, actualiza el `USER_AGENT` en `src/scrapers/dontorrent.ts` con un User-Agent de navegador reciente y vuelve a compilar/reconstruir.

### DonTorrent no resuelve el dominio en Docker

El contenedor usa DNS públicos (`1.1.1.1`, `8.8.8.8`) configurados en `docker-compose.yml` para evitar bloqueos DNS locales de dominios de torrents. Si tu red los bloquea, cámbialos por otros resolvers.

## 📄 Licencia

ISC
