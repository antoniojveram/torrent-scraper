export interface MovieConfig {
  watchlist: string[];
}

export interface TorrentResult {
  title: string;
  url: string;
  date?: string;
}

export interface ScraperResult {
  foundMovies: TorrentResult[];
  totalTorrents: number;
  timestamp: string;
}
