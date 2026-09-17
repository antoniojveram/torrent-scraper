import { Browser } from "playwright";

export interface MovieConfig {
  watchlist: string[];
}

export type TorrentType = "movie" | "series";

export interface TorrentItem {
  title: string;
  url: string;
  date?: string;
  quality?: string;
  type?: TorrentType;
}

export interface TorrentResult extends TorrentItem {
  source: string;
}

export interface SiteScraper {
  name: string;
  url: string;
  scrape(browser: Browser): Promise<TorrentItem[]>;
}

export interface SourceResult {
  source: string;
  url: string;
  totalTorrents: number;
  foundMovies: TorrentResult[];
  error?: string;
}

export interface ScraperResult {
  foundMovies: TorrentResult[];
  sources: SourceResult[];
  totalTorrents: number;
  timestamp: string;
  watchlist?: string[];
}
