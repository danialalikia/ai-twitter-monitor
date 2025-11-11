/**
 * Handle Twitter URL sent to Telegram bot
 * Fetch tweet, rewrite with AI, send back with media
 */

import { fetchSingleTweet } from "../apify-single";
import { rewriteTweetWithOpenRouter } from "./ai-rewrite";
import { buildTelegramMessage, getDefaultTelegramTemplate } from "./telegram-template";
import {
  sendTelegramMessage,
  sendTelegramPhoto,
  sendTelegramVideo,
  sendTelegramMediaGroup,
} from "../telegram";

interface Settings {
  apifyToken: string | null;
  openRouterApiKey: string | null;
  aiRewritePrompt: string | null;
  aiModel: string | null;
  aiTemperature: number;
  aiMaxTokens: number;
  aiTopP: number;
  telegramTemplate: string | null;
  includeStats: boolean | null;
  includeLink: boolean | null;
  includeAuthor: boolean | null;
  includeDate: boolean | null;
}

/**
 * Extract tweet ID from Twitter/X URL
 */
function extractTweetId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /twitter\.com\/i\/web\/status\/(\d+)/,
    /x\.com\/i\/web\/status\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Download media file and return as Buffer
 */
async function downloadMedia(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Media] Failed to download: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[Media] Download error:", error);
    return null;
  }
}

/**
 * Main handler for tweet URL
 */
export async function handleTweetUrl(
  url: string,
  botToken: string,
  chatId: string,
  settings: Settings
): Promise<void> {
  try {
    // Extract tweet ID
    const tweetId = extractTweetId(url);
    if (!tweetId) {
    await sendTelegramMessage(botToken, chatId, {
      chat_id: chatId,
      text: "❌ Invalid Twitter/X URL. Please send a valid tweet link.",
      parse_mode: "HTML",
    });
      return;
    }

    // Send loading message
    await sendTelegramMessage(botToken, chatId, {
      chat_id: chatId,
      text: "⏳ Fetching tweet...",
      parse_mode: "HTML",
    });

    // Check Apify token
    if (!settings.apifyToken) {
      await sendTelegramMessage(botToken, chatId, {
        chat_id: chatId,
        text: "❌ Apify token not configured. Please add it in Settings.",
        parse_mode: "HTML",
      });
      return;
    }

    // Fetch tweet from Apify - pass full URL
    const tweet = await fetchSingleTweet(url, settings.apifyToken);
    if (!tweet) {
      await sendTelegramMessage(botToken, chatId, {
        chat_id: chatId,
        text: "❌ Could not fetch tweet. It may be deleted or private.",
        parse_mode: "HTML",
      });
      return;
    }

    // Send processing message
    await sendTelegramMessage(botToken, chatId, {
      chat_id: chatId,
      text: "🤖 Rewriting with AI...",
      parse_mode: "HTML",
    });

    // Clean text: remove only the last t.co link
    let cleanText = tweet.text || "";
    const tcoLinks = cleanText.match(/https:\/\/t\.co\/\w+/g);
    if (tcoLinks && tcoLinks.length > 0) {
      const lastLink = tcoLinks[tcoLinks.length - 1];
      const lastIndex = cleanText.lastIndexOf(lastLink);
      cleanText = cleanText.substring(0, lastIndex) + cleanText.substring(lastIndex + lastLink.length);
    }
    cleanText = cleanText.trim();

    // Check AI settings
    if (!settings.openRouterApiKey) {
      await sendTelegramMessage(botToken, chatId, {
        chat_id: chatId,
        text: "❌ OpenRouter API key not configured. Please add it in Settings.",
        parse_mode: "HTML",
      });
      return;
    }

    if (!settings.aiRewritePrompt) {
      await sendTelegramMessage(botToken, chatId, {
        chat_id: chatId,
        text: "❌ AI rewrite prompt not configured. Please add it in Settings.",
        parse_mode: "HTML",
      });
      return;
    }

    // Rewrite with AI
    let rewrittenText: string;
    try {
      rewrittenText = await rewriteTweetWithOpenRouter(cleanText, settings.aiRewritePrompt, {
        apiKey: settings.openRouterApiKey,
        model: settings.aiModel || "openai/gpt-4o",
        temperature: settings.aiTemperature,
        maxTokens: settings.aiMaxTokens,
        topP: settings.aiTopP,
      });
    } catch (error: any) {
      await sendTelegramMessage(botToken, chatId, {
        chat_id: chatId,
        text: `❌ AI rewrite failed: ${error.message}`,
        parse_mode: "HTML",
      });
      return;
    }

    // Build message from template
    const template = settings.telegramTemplate || getDefaultTelegramTemplate();
    const message = buildTelegramMessage(template, {
      rewrittenText,
      originalText: cleanText,
      authorName: tweet.authorName,
      authorHandle: tweet.authorHandle,
      likeCount: tweet.likeCount,
      retweetCount: tweet.retweetCount,
      replyCount: tweet.replyCount,
      viewCount: tweet.viewCount,
      tweetUrl: tweet.url,
      createdAt: tweet.createdAt,
      includeStats: settings.includeStats ?? true,
      includeLink: settings.includeLink ?? true,
      includeAuthor: settings.includeAuthor ?? true,
      includeDate: settings.includeDate ?? true,
    });

    // Limit caption to 1024 characters (Telegram limit)
    const maxCaptionLength = 1024;
    let finalMessage = message;
    if (message.length > maxCaptionLength) {
      const truncateLength = maxCaptionLength - 50; // Safety margin
      finalMessage = message.substring(0, truncateLength) + "...";
    }

    // Send based on media type
    if (!tweet.mediaUrls || tweet.mediaUrls.length === 0) {
      // Text only
      await sendTelegramMessage(botToken, chatId, {
        chat_id: chatId,
        text: finalMessage,
        parse_mode: "HTML",
      });
    } else if (tweet.mediaUrls.length === 1) {
      const media = tweet.mediaUrls[0];
      if (media.type === "photo") {
        // Single photo
        await sendTelegramPhoto(botToken, chatId, {
          photo: media.url,
          caption: finalMessage,
          parse_mode: "HTML",
        });
      } else if (media.type === "video") {
        // Single video
        await sendTelegramVideo(botToken, chatId, {
          video: media.url,
          caption: finalMessage,
          parse_mode: "HTML",
        });
      }
    } else {
      // Multiple media (media group)
      const mediaGroup = tweet.mediaUrls.map((m, index) => ({
        type: m.type,
        media: m.url,
        caption: index === 0 ? finalMessage : undefined, // Caption only on first item
        parse_mode: "HTML" as const,
      }));
      await sendTelegramMediaGroup(botToken, chatId, mediaGroup);
    }

    console.log(`[Telegram] Successfully sent rewritten tweet ${tweetId} to chat ${chatId}`);
  } catch (error: any) {
    console.error("[Telegram] Error handling tweet URL:", error);
    await sendTelegramMessage(botToken, chatId, {
      chat_id: chatId,
      text: `❌ Error: ${error.message}`,
      parse_mode: "HTML",
    });
  }
}
