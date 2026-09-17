import { Browser } from "playwright";
import { SiteScraper, TorrentItem } from "../types";

export const name = "Descargamix";
export const url = "https://descargamix.net/ultimos";

async function scrape(browser: Browser): Promise<TorrentItem[]> {
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    return await page.evaluate(() => {
      const results: { title: string; url: string }[] = [];

      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>("a"),
      );

      links.forEach((link) => {
        const title = link.textContent?.trim() || "";
        const href = link.href || "";

        if (title.length > 5 && href.startsWith("http")) {
          results.push({ title, url: href });
        }
      });

      return results;
    });
  } finally {
    await page.close();
  }
}

export const scraper: SiteScraper = { name, url, scrape };
