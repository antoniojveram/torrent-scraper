import { config } from "dotenv";
import { Browser, chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import {
  MovieConfig,
  ScraperResult,
  SiteScraper,
  SourceResult,
} from "./types";
import { TelegramNotifier } from "./telegram";
import { scraper as descargamix } from "./scrapers/descargamix";
import { scraper as dontorrent } from "./scrapers/dontorrent";

// Cargar variables de entorno del archivo .env
config();

const CONFIG_PATH = path.join(__dirname, "..", "movies.json");
const RESULTS_DIR = path.join(__dirname, "..", "results");
const RESULTS_PATH = path.join(RESULTS_DIR, "results.json");

const SCRAPERS: SiteScraper[] = [descargamix, dontorrent];
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [5000, 15000];

function loadWatchlist(): string[] {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config: MovieConfig = JSON.parse(configData);
    return config.watchlist;
  } catch (error) {
    console.error("Error cargando la watchlist:", error);
    return [];
  }
}

function matchesWatchlist(title: string, watchlist: string[]): boolean {
  const normalizedTitle = title.toLowerCase();
  return watchlist.some((movie) =>
    normalizedTitle.includes(movie.toLowerCase()),
  );
}

async function runScraper(
  browser: Browser,
  site: SiteScraper,
  watchlist: string[],
): Promise<SourceResult> {
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(
      `\n🌐 [${site.name}] Analizando: ${site.url}${attempt > 1 ? ` (intento ${attempt}/${MAX_ATTEMPTS})` : ""}`,
    );

    try {
      const items = await site.scrape(browser);
      const foundMovies = items
        .filter((item) => matchesWatchlist(item.title, watchlist))
        .map((item) => ({ ...item, source: site.name }));

      console.log(`📦 [${site.name}] Elementos encontrados: ${items.length}`);
      console.log(
        `🎯 [${site.name}] Coincidencias con la watchlist: ${foundMovies.length}`,
      );

      return {
        source: site.name,
        url: site.url,
        totalTorrents: items.length,
        foundMovies,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ [${site.name}] Error (intento ${attempt}/${MAX_ATTEMPTS}): ${lastError}`,
      );

      if (attempt < MAX_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[attempt - 1];
        console.log(`⏳ [${site.name}] Reintentando en ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return {
    source: site.name,
    url: site.url,
    totalTorrents: 0,
    foundMovies: [],
    error: lastError,
  };
}

function printSummary(result: ScraperResult): void {
  console.log("\n" + "=".repeat(60));
  if (result.foundMovies.length > 0) {
    console.log("🎉 ¡PELÍCULAS ENCONTRADAS!");
    console.log("=".repeat(60));

    result.sources.forEach((source) => {
      if (source.foundMovies.length === 0) return;

      console.log(`\n📡 ${source.source}:`);
      source.foundMovies.forEach((movie, index) => {
        const details = [movie.quality, movie.date]
          .filter(Boolean)
          .join(" · ");
        console.log(
          `  ${index + 1}. ${movie.title}${details ? ` — ${details}` : ""}`,
        );
        console.log(`     🔗 ${movie.url}`);
      });
    });
  } else {
    console.log("😔 No se encontraron películas de la watchlist");
  }

  result.sources
    .filter((source) => source.error)
    .forEach((source) =>
      console.log(`⚠️  ${source.source}: ${source.error}`),
    );

  console.log("=".repeat(60) + "\n");
}

async function scrapeTorrents(): Promise<ScraperResult> {
  console.log("🚀 Iniciando Torrent Scraper...");
  console.log(`📅 Fecha: ${new Date().toLocaleString("es-ES")}`);

  const watchlist = await loadWatchlist();
  console.log(`🎬 Películas en watchlist: ${watchlist.join(", ")}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  try {
    const sources = await Promise.all(
      SCRAPERS.map((site) => runScraper(browser, site, watchlist)),
    );

    const result: ScraperResult = {
      foundMovies: sources.flatMap((source) => source.foundMovies),
      sources,
      totalTorrents: sources.reduce(
        (total, source) => total + source.totalTorrents,
        0,
      ),
      timestamp: new Date().toISOString(),
      watchlist,
    };

    printSummary(result);

    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(result, null, 2));
    console.log(`💾 Resultados guardados en: results/results.json`);

    return result;
  } finally {
    await browser.close();
    console.log("🔒 Navegador cerrado");
  }
}

// Ejecutar el scraper
scrapeTorrents()
  .then(async (result) => {
    console.log("✅ Scraping completado exitosamente");

    // Enviar notificación de Telegram
    const notifier = new TelegramNotifier();
    await notifier.sendNotification(result);

    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
