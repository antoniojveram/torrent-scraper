import TelegramBot from "node-telegram-bot-api";
import { ScraperResult } from "./types";

export class TelegramNotifier {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;
  private enabled: boolean = false;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      this.bot = new TelegramBot(token, { polling: false });
      this.chatId = chatId;
      this.enabled = true;
      console.log("✅ Notificaciones de Telegram habilitadas");
    } else {
      console.log(
        "ℹ️  Notificaciones de Telegram deshabilitadas (configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID)",
      );
    }
  }

  async sendNotification(result: ScraperResult): Promise<void> {
    if (!this.enabled || !this.bot || !this.chatId) {
      return;
    }

    try {
      const message = this.formatMessage(result);
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "Markdown",
      });
      console.log("📱 Notificación enviada a Telegram");
    } catch (error) {
      console.error("❌ Error enviando notificación a Telegram:", error);
    }
  }

  private formatMessage(result: ScraperResult): string {
    const date = new Date(result.timestamp).toLocaleString("es-ES");

    let message = `🎬 *Torrent Scraper - Reporte*\n\n`;
    message += `📅 *Fecha:* ${date}\n`;
    message += `📦 *Total torrents analizados:* ${result.totalTorrents}\n\n`;

    if (result.foundMovies.length > 0) {
      message += `🎉 *¡${result.foundMovies.length} PELÍCULA(S) ENCONTRADA(S)!*\n\n`;

      result.foundMovies.forEach((movie, index) => {
        message += `${index + 1}. *${this.escapeMarkdown(movie.title)}*\n`;
        message += `   🔗 [Ver enlace](${movie.url})\n\n`;
      });
    } else {
      message += `😔 No se encontraron películas de tu watchlist\n\n`;
      message += `💡 Las películas buscadas se encuentran en el archivo movies.json`;
    }

    return message;
  }

  private escapeMarkdown(text: string): string {
    // Escapar caracteres especiales de Markdown
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
  }
}
