/**
 * Telegram Webhook Handler
 * Handles incoming webhook requests from Telegram
 */

import * as db from "./db";
import { settings as settingsTable } from "../drizzle/schema";
import { sendWelcomeMessage } from "./telegram";
import { handleTweetUrl } from "./lib/handle-tweet-url";

export async function handleTelegramWebhook(input: any): Promise<void> {
  console.log("[Webhook] Received:", JSON.stringify(input, null, 2));

  // Handle text messages
  if (input.message?.text) {
    const text = input.message.text;
    const chatId = input.message.chat?.id;

    if (!chatId) {
      console.error("[Webhook] No chat ID");
      return;
    }

    // Get settings to find bot token
    const dbConn = await db.getDb();
    if (!dbConn) {
      console.error("[Webhook] Database not available");
      return;
    }

    const allSettings = await dbConn.select().from(settingsTable).limit(1);

    if (!allSettings || allSettings.length === 0) {
      console.error("[Webhook] No settings found");
      return;
    }

    const userSettings = allSettings[0];

    if (!userSettings.telegramBotToken) {
      console.error("[Webhook] Telegram bot token not configured");
      return;
    }

    const miniAppUrl =
      process.env.VITE_APP_URL || "https://3000-iydbtns1aq333ef13jid0-ddc4418f.manusvm.computer";

    // Handle /start or /app commands
    if (text === "/start" || text === "/app") {
      await sendWelcomeMessage(userSettings.telegramBotToken, chatId.toString(), miniAppUrl);
      return;
    }

    // Handle Twitter/X URL
    const twitterUrlRegex = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/(\d+)/i;
    const match = text.match(twitterUrlRegex);
    if (match) {
      const tweetUrl = text.trim();
      await handleTweetUrl(tweetUrl, userSettings.telegramBotToken, chatId.toString(), {
        apifyToken: userSettings.apifyToken,
        openRouterApiKey: userSettings.openRouterApiKey,
        aiRewritePrompt: userSettings.aiRewritePrompt,
        aiModel: userSettings.aiModel,
        aiTemperature: parseFloat(userSettings.temperature || "0.7"),
        aiMaxTokens: userSettings.maxTokens || 500,
        aiTopP: parseFloat(userSettings.topP || "0.9"),
        telegramTemplate: userSettings.telegramTemplate,
        includeStats: Boolean(userSettings.includeStats),
        includeLink: Boolean(userSettings.includeLink),
        includeAuthor: Boolean(userSettings.includeAuthor),
        includeDate: Boolean(userSettings.includeDate),
      });
      return;
    }
  }

  // Handle callback queries (button clicks)
  if (input.callback_query) {
    // Handle callback queries if needed
    console.log("[Webhook] Callback query received:", input.callback_query);
  }
}
