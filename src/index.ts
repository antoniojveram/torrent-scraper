import { config } from "dotenv";
import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { MovieConfig, TorrentResult, ScraperResult } from "./types";
import { TelegramNotifier } from "./telegram";

// Cargar variables de entorno del archivo .env
config();

const CONFIG_PATH = path.join(__dirname, "..", "movies.json");
const TARGET_URL = "https://descargamix.net/ultimos";

async function loadWatchlist(): Promise<string[]> {
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

async function scrapeTorrents(): Promise<ScraperResult> {
  console.log("🚀 Iniciando Torrent Scraper...");
  console.log(`📅 Fecha: ${new Date().toLocaleString("es-ES")}`);

  const watchlist = await loadWatchlist();
  console.log(`🎬 Películas en watchlist: ${watchlist.join(", ")}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });

  try {
    const page = await browser.newPage();
    console.log(`🌐 Navegando a: ${TARGET_URL}`);

    await page.goto(TARGET_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    console.log("⏳ Esperando a que cargue el contenido...");
    await page.waitForTimeout(2000);

    // Capturar todos los enlaces de torrents
    const torrents = await page.evaluate(() => {
      const results: { title: string; url: string }[] = [];

      // Buscar enlaces que contengan información de torrents
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>("a"),
      );

      links.forEach((link) => {
        const title = link.textContent?.trim() || "";
        const url = link.href || "";

        // Filtrar enlaces que parecen ser torrents (tienen título y URL válida)
        if (title.length > 5 && url.startsWith("http")) {
          results.push({ title, url });
        }
      });

      return results;
    });

    console.log(`📦 Total de elementos encontrados: ${torrents.length}`);

    // Filtrar películas que coinciden con la watchlist
    const foundMovies: TorrentResult[] = torrents.filter((torrent) =>
      matchesWatchlist(torrent.title, watchlist),
    );

    const result: ScraperResult = {
      foundMovies,
      totalTorrents: torrents.length,
      timestamp: new Date().toISOString(),
    };

    // Mostrar resultados
    console.log("\n" + "=".repeat(60));
    if (foundMovies.length > 0) {
      console.log("🎉 ¡PELÍCULAS ENCONTRADAS!");
      console.log("=".repeat(60));
      foundMovies.forEach((movie, index) => {
        console.log(`\n${index + 1}. ${movie.title}`);
        console.log(`   🔗 ${movie.url}`);
      });
    } else {
      console.log("😔 No se encontraron películas de la watchlist");
    }
    console.log("=".repeat(60) + "\n");

    // Guardar resultados en un archivo JSON
    const resultsPath = path.join(__dirname, "..", "results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
    console.log(`💾 Resultados guardados en: results.json`);

    return result;
  } catch (error) {
    console.error("❌ Error durante el scraping:", error);
    throw error;
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
