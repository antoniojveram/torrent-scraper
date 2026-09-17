import { Browser, Page } from "playwright";
import { SiteScraper, TorrentItem } from "../types";

export const name = "DonTorrent";
export const url = "https://dontorrent.supply/ultimos";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const CHALLENGE_MARKERS = ["Asegurándonos", "Oh no"];

async function solveAnubisChallenge(page: Page): Promise<void> {
  const status = await page
    .waitForFunction(
      (markers: string[]) => {
        const title = document.title;
        if (title.length === 0) return false;
        if (title.includes("Oh no")) return "blocked";
        if (markers.some((marker) => title.includes(marker))) return false;
        return "ok";
      },
      CHALLENGE_MARKERS,
      { timeout: 90000, polling: 500 },
    )
    .then((handle) => handle.jsonValue() as Promise<string>)
    .catch(() => "timeout");

  if (status === "blocked") {
    throw new Error(
      "Anubis ha bloqueado la petición (User-Agent detectado como bot)",
    );
  }

  if (status === "timeout") {
    throw new Error("La protección anti-bot de Anubis no se resolvió a tiempo");
  }
}

async function scrape(browser: Browser): Promise<TorrentItem[]> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "es-ES",
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    if (response && response.status() === 403) {
      throw new Error("DonTorrent ha rechazado la petición (HTTP 403)");
    }

    await solveAnubisChallenge(page);
    await page.waitForSelector("#ultimos_torrents", { timeout: 30000 });
    await page.waitForTimeout(1500);

    return await page.evaluate(() => {
      const section = document.querySelector("#ultimos_torrents");
      if (!section) {
        throw new Error("No se encontró la sección de estrenos");
      }

      const items: {
        title: string;
        url: string;
        date?: string;
        quality?: string;
        type: "movie" | "series";
      }[] = [];

      section.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
        const href = link.getAttribute("href") || "";
        const isMovie = href.includes("pelicula/");
        const isSeries = href.includes("serie/");

        if (!isMovie && !isSeries) return;

        const title = link.textContent?.trim() || "";
        if (!title) return;

        const date =
          link.previousElementSibling?.textContent?.trim() || undefined;
        const quality =
          link.nextElementSibling?.textContent?.trim() || undefined;

        items.push({
          title,
          url: new URL(href, location.origin).href,
          date,
          quality,
          type: isMovie ? "movie" : "series",
        });
      });

      return items;
    });
  } finally {
    await context.close();
  }
}

export const scraper: SiteScraper = { name, url, scrape };
