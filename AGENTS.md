# AGENTS.md - Torrent Scraper

## Project Overview
TypeScript scraper for `https://dontorrent.supply/ultimos` that checks for movies in a watchlist and optionally sends Telegram notifications. Runs daily at 8:00 AM via cron in Docker.

## Key Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Build TypeScript | `npm run build` |
| Run scraper | `npm start` |
| Dev (watch mode) | `npm run dev` |
| Docker build & run | `docker-compose up -d` |
| Docker logs | `docker-compose logs -f` |
| Docker rebuild (after .env changes) | `docker-compose down && docker-compose up -d --build` |

## Architecture

**Entry point**: `src/index.ts` → compiles to `dist/index.js`
- Loads `movies.json` watchlist
- Launches a single Playwright (Chromium) browser shared by all scrapers
- Runs every scraper in parallel with retries (failures are isolated per source)
- Filters torrents by partial title match (case-insensitive)
- Saves results to `results/results.json` (mounted volume in Docker)
- Sends Telegram notification if configured

**Modules**:
- `src/index.ts` - Orchestrates scrapers, filters watchlist, writes results
- `src/scrapers/dontorrent.ts` - Scrapes `#ultimos_torrents` (movies + series) and bypasses Anubis
- `src/telegram.ts` - Telegram bot notifications (grouped by source)
- `src/types.ts` - TypeScript interfaces (`SiteScraper`, `TorrentItem`, `SourceResult`, ...)

## Adding a New Source
Create `src/scrapers/<site>.ts` exporting a `scraper: SiteScraper` with `name`, `url` and `scrape(browser)`, then register it in the `SCRAPERS` array in `src/index.ts`.

## Environment Variables

Required for Telegram (both in `.env` for local, `docker-compose.yml` for Docker):
- `TELEGRAM_BOT_TOKEN` - From @BotFather
- `TELEGRAM_CHAT_ID` - From @userinfobot

## Docker Specifics

- Base: `node:20-alpine` with Chromium + cron
- Playwright uses system Chromium: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser`
- `entrypoint.sh` runs scraper once on start, then cron at `0 8 * * *`
- Volumes: `movies.json` and `results/` mounted for live editing
- Cron logs: `/var/log/cron.log` inside container

## TypeScript Config

- Target: ES2020, Module: NodeNext
- Output: `dist/`, Source: `src/`
- Strict mode enabled
- Declaration maps + source maps generated

## Watchlist Format (`movies.json`)

```json
{ "watchlist": ["Movie Name 1", "Movie Name 2"] }
```

## Testing

No test framework configured. `npm test` exits with error.

## Common Issues

- **Playwright in Docker**: Ensure all deps in Dockerfile (chromium, nss, freetype, harfbuzz, ca-certificates, ttf-freefont)
- **Telegram not working**: Verify `.env` or docker-compose env vars; rebuild container after changes
- **Cron not running**: Check `/var/log/cron.log` inside container
- **Movies not found**: Matching is partial + case-insensitive; check logs for detected torrents