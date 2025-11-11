/**
 * Telegram Bot Integration
 * Sends daily morning reports and handles inline button callbacks
 */

import { Tweet } from "../drizzle/schema";

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: "Markdown" | "HTML";
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data?: string;
      url?: string;
      web_app?: {
        url: string;
      };
    }>>;
  };
}

interface TelegramPhoto {
  photo: string;
  caption?: string;
  parse_mode?: "Markdown" | "HTML";
}

/**
 * Send a message via Telegram bot
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: TelegramMessage
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...message,
      chat_id: chatId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Telegram message: ${error}`);
  }
}

/**
 * Send a photo via Telegram bot
 */
export async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photo: TelegramPhoto
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...photo,
      chat_id: chatId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Telegram photo: ${error}`);
  }
}

/**
 * Send a video via Telegram bot
 */
export async function sendTelegramVideo(
  botToken: string,
  chatId: string,
  video: { video: string; caption?: string; parse_mode?: "Markdown" | "HTML" }
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendVideo`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...video,
      chat_id: chatId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Telegram video: ${error}`);
  }
}

/**
 * Send a media group (multiple photos/videos) via Telegram bot
 */
export async function sendTelegramMediaGroup(
  botToken: string,
  chatId: string,
  media: Array<{ type: "photo" | "video"; media: string; caption?: string; parse_mode?: "Markdown" | "HTML" }>
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMediaGroup`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      media,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Telegram media group: ${error}`);
  }
}

/**
 * Format and send daily morning report
 */
export async function sendDailyReport(
  botToken: string,
  chatId: string,
  tweets: Tweet[],
  runStats: {
    date: Date;
    totalItems: number;
    viralCount: number;
    highEngagementCount: number;
    risingCount: number;
    mediaRichCount: number;
  }
): Promise<void> {
  // Build summary header
  const header = `🌅 *AI Trends Morning Report*\n📅 ${runStats.date.toLocaleDateString()}\n\n` +
    `📊 *Summary*\n` +
    `• Total Items: ${runStats.totalItems}\n` +
    `• 🔥 Viral: ${runStats.viralCount}\n` +
    `• 📈 High Engagement: ${runStats.highEngagementCount}\n` +
    `• 🚀 Rising: ${runStats.risingCount}\n` +
    `• 🎬 Media-rich: ${runStats.mediaRichCount}\n\n` +
    `*Top 10 Trending Posts:*\n`;

  // Get top 10 tweets
  const topTweets = tweets.slice(0, 10);

  // Build tweet list
  const tweetList = topTweets.map((tweet, index) => {
    const categories = tweet.categories || [];
    const primaryTag = categories[0] || "Standard";
    const tagEmoji = getTagEmoji(primaryTag);
    
    const excerpt = tweet.text.length > 100 
      ? tweet.text.substring(0, 100) + "..." 
      : tweet.text;

    return `${index + 1}. ${tagEmoji} @${tweet.authorHandle}\n` +
      `   "${excerpt}"\n` +
      `   ❤️ ${tweet.likeCount} | 🔁 ${tweet.retweetCount} | 👁️ ${tweet.viewCount || 0}\n`;
  }).join("\n");

  const fullMessage = header + tweetList;

  // Send main message with inline buttons
  await sendTelegramMessage(botToken, chatId, {
    chat_id: chatId,
    text: fullMessage,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📊 View in Panel", url: process.env.VITE_APP_URL || "https://your-app.com" },
          { text: "🔄 Fetch Now", callback_data: "fetch_now" },
        ],
      ],
    },
  });

  // Send top 5 media attachments
  const mediaTweets = topTweets.filter(t => t.mediaUrls && t.mediaUrls.length > 0).slice(0, 5);

  for (const tweet of mediaTweets) {
    if (tweet.mediaUrls && tweet.mediaUrls[0]) {
      try {
        const caption = `@${tweet.authorHandle}: ${tweet.text.substring(0, 200)}${tweet.text.length > 200 ? "..." : ""}`;
        const firstMedia = tweet.mediaUrls[0];
        
        if (firstMedia.type === 'photo') {
          await sendTelegramPhoto(botToken, chatId, {
            photo: firstMedia.url,
            caption,
          });
        } else if (firstMedia.type === 'video') {
          // Send video with thumbnail if available
          const videoBody: any = {
            chat_id: chatId,
            video: firstMedia.url,
            caption,
          };
          if (firstMedia.thumbnail) {
            videoBody.thumbnail = firstMedia.thumbnail;
          }
          await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoBody),
          });
        }
      } catch (error) {
        console.error(`[Telegram] Failed to send media for tweet ${tweet.id}:`, error);
        // Continue with other media
      }
    }
  }
}

/**
 * Send error alert to Telegram
 */
export async function sendErrorAlert(
  botToken: string,
  chatId: string,
  errorMessage: string,
  context?: string
): Promise<void> {
  const message = `⚠️ *Error Alert*\n\n` +
    (context ? `Context: ${context}\n` : "") +
    `Error: ${errorMessage}`;

  await sendTelegramMessage(botToken, chatId, {
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown",
  });
}

/**
 * Send low items warning
 */
export async function sendLowItemsWarning(
  botToken: string,
  chatId: string,
  itemCount: number
): Promise<void> {
  const message = `⚠️ *Low Items Warning*\n\n` +
    `Only ${itemCount} items were fetched in the last run.\n\n` +
    `This might indicate:\n` +
    `• Rate limiting from Twitter/X\n` +
    `• Invalid Apify token\n` +
    `• Keywords not matching recent content\n\n` +
    `Please check your settings and try again.`;

  await sendTelegramMessage(botToken, chatId, {
    chat_id: chatId,
    text: message,
    parse_mode: "Markdown",
  });
}

/**
 * Get emoji for category tag
 */
function getTagEmoji(tag: string): string {
  const emojiMap: Record<string, string> = {
    "Viral": "🔥",
    "High Engagement": "📈",
    "Rising": "🚀",
    "Media-rich": "🎬",
    "Keyword-match-strong": "🎯",
    "Standard": "📌",
  };

  return emojiMap[tag] || "📌";
}

/**
 * Handle Telegram webhook callback
 */
export interface TelegramWebhookUpdate {
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
    };
    data?: string;
  };
}

export function parseTelegramCallback(update: TelegramWebhookUpdate): {
  callbackId: string;
  userId: number;
  action: string;
} | null {
  if (!update.callback_query) {
    return null;
  }

  return {
    callbackId: update.callback_query.id,
    userId: update.callback_query.from.id,
    action: update.callback_query.data || "",
  };
}

/**
 * Answer callback query
 */
export async function answerCallbackQuery(
  botToken: string,
  callbackId: string,
  text?: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text,
    }),
  });
}

/**
 * Set Telegram bot commands and menu button
 */
export async function setTelegramBotCommands(
  botToken: string,
  miniAppUrl: string
): Promise<void> {
  // Set bot commands
  const commandsUrl = `https://api.telegram.org/bot${botToken}/setMyCommands`;
  
  await fetch(commandsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      commands: [
        {
          command: "start",
          description: "Start the bot and open Mini App",
        },
        {
          command: "app",
          description: "Open AI Twitter Monitor Mini App",
        },
      ],
    }),
  });

  // Set menu button to open Mini App
  const menuUrl = `https://api.telegram.org/bot${botToken}/setChatMenuButton`;
  
  await fetch(menuUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: "📊 Open Dashboard",
        web_app: {
          url: miniAppUrl,
        },
      },
    }),
  });
}

/**
 * Send welcome message with Mini App button
 */
export async function sendWelcomeMessage(
  botToken: string,
  chatId: string,
  miniAppUrl: string
): Promise<void> {
  const message = `🤖 <b>Welcome to AI Twitter Monitor!</b>

📊 Track trending AI-related posts from Twitter/X
🤖 Automated scheduling and filtering
📱 Manage everything from this Mini App

Click the button below to get started:`;

  await sendTelegramMessage(botToken, chatId, {
    chat_id: chatId,
    text: message,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📊 Open Dashboard",
            web_app: {
              url: miniAppUrl,
            },
          },
        ],
      ],
    },
  });
}
