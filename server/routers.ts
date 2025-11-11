import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { settings as settingsTable } from "../drizzle/schema";
import { fetchTweetsFromApify, type NormalizedTweet } from "./apify";
import { sendDailyReport, sendErrorAlert, sendLowItemsWarning, parseTelegramCallback, answerCallbackQuery, setTelegramBotCommands, sendWelcomeMessage } from "./telegram";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getSettings(ctx.userId);
      
      // Return default values if no settings exist
      if (!settings) {
        return {
          id: 0,
          userId: ctx.userId,
          apifyToken: null,
          telegramBotToken: null,
          telegramChatId: null,
          keywords: "AI,artificial intelligence,machine learning,deep learning,LLM,GPT",
          scheduleTime: "08:00",
          timezone: "UTC",
          maxItemsPerRun: 200,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      return settings;
    }),

    update: protectedProcedure
      .input(z.object({
        apifyToken: z.string().optional(),
        telegramBotToken: z.string().optional(),
        telegramChatId: z.string().optional(),
        telegramOwnerId: z.string().optional(),
        ownerEmails: z.string().optional(),
        keywords: z.string(),
        scheduleTime: z.string(),
        timezone: z.string(),
        maxItemsPerRun: z.number().min(1).max(1000),
        
        // AI Rewrite Settings
        aiRewriteEnabled: z.number().optional(),
        aiRewritePrompt: z.string().optional(),
        openRouterApiKey: z.string().optional(),
        aiModel: z.string().optional(),
        temperature: z.string().optional(),
        maxTokens: z.number().optional(),
        topP: z.string().optional(),
        
        // Telegram Template Settings
        telegramTemplate: z.string().optional(),
        
        // Include/Exclude Options
        includeStats: z.number().optional(),
        includeLink: z.number().optional(),
        includeAuthor: z.number().optional(),
        includeMedia: z.number().optional(),
        includeDate: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await db.upsertSettings({
          userId: ctx.userId,
          ...input,
        });
        return settings;
      }),
  }),

  fetch: router({
    now: protectedProcedure
      .input(z.object({
        triggeredBy: z.enum(["manual", "scheduled", "telegram"]).default("manual"),
        minLikes: z.number().optional(),
        minRetweets: z.number().optional(),
        minViews: z.number().optional(),
        hasImages: z.boolean().optional(),
        hasVideos: z.boolean().optional(),
        hasLinks: z.boolean().optional(),
        verifiedOnly: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Get user settings
        const settings = await db.getSettings(ctx.userId);
        
        if (!settings) {
          throw new Error("Please configure your settings first");
        }

        if (!settings.apifyToken) {
          throw new Error("Please provide your Apify token in settings");
        }

        // Delete all previous tweets before fetching new ones
        await db.deleteAllTweets(ctx.userId);
        console.log('[Fetch] Deleted all previous tweets');

        // Create a new run record
        const runId = await db.createRun({
          userId: ctx.userId,
          status: "running",
          triggeredBy: input.triggeredBy,
          startedAt: new Date(),
        });

        try {
          // Parse keywords
          const keywords = settings.keywords.split(",").map(k => k.trim()).filter(Boolean);

          // Fetch tweets from Apify with advanced filters
          const apifyFilters = {
            minLikes: input.minLikes,
            minRetweets: input.minRetweets,
            minViews: input.minViews,
            hasImages: input.hasImages,
            hasVideos: input.hasVideos,
            hasLinks: input.hasLinks,
            verifiedOnly: input.verifiedOnly,
          };

          const rawTweets = await fetchTweetsFromApify(
            keywords,
            settings.maxItemsPerRun,
            settings.apifyToken,
            apifyFilters
          );

          // No need for deduplication - actor handles it
          const uniqueTweets = rawTweets;

          // Get ignored tweets
          const ignoredList = await db.getIgnoredTweets(ctx.userId);
          const ignoredIds = new Set(ignoredList.map(i => i.tweetId));

          // Filter out ignored tweets
          let filteredTweets = uniqueTweets.filter(t => !ignoredIds.has(t.tweetId));
          console.log(`[Fetch] After removing ignored: ${filteredTweets.length} tweets`);

          // Apply client-side engagement filters (since Apify may not support all filters)
          if (input.minLikes) {
            const before = filteredTweets.length;
            filteredTweets = filteredTweets.filter(t => (t.likeCount || 0) >= input.minLikes!);
            console.log(`[Fetch] After minLikes filter (${input.minLikes}): ${filteredTweets.length} tweets (removed ${before - filteredTweets.length})`);
          }
          if (input.minRetweets) {
            const before = filteredTweets.length;
            filteredTweets = filteredTweets.filter(t => (t.retweetCount || 0) >= input.minRetweets!);
            console.log(`[Fetch] After minRetweets filter (${input.minRetweets}): ${filteredTweets.length} tweets (removed ${before - filteredTweets.length})`);
          }
          if (input.minViews) {
            const before = filteredTweets.length;
            filteredTweets = filteredTweets.filter(t => (t.viewCount || 0) >= input.minViews!);
            console.log(`[Fetch] After minViews filter (${input.minViews}): ${filteredTweets.length} tweets (removed ${before - filteredTweets.length})`);
          }

          // Prepare for insertion (actor already provides trendScore and categories)
          const tweetsToInsert = filteredTweets.map((tweet: NormalizedTweet) => {
            return {
              runId,
              tweetId: tweet.tweetId,
              url: tweet.url,
              text: tweet.text,
              createdAt: tweet.createdAt,
              language: tweet.language,
              authorHandle: tweet.authorHandle,
              authorName: tweet.authorName,
              authorProfileUrl: tweet.authorProfileUrl,
              authorProfileImageUrl: tweet.authorProfileImageUrl,
              authorFollowersCount: tweet.authorFollowersCount,
              authorFollowingCount: tweet.authorFollowingCount,
              authorVerified: tweet.authorVerified,
              authorDescription: tweet.authorDescription,
              authorJobTitle: tweet.authorJobTitle,
              authorCoverPhoto: tweet.authorCoverPhoto,
              authorLocation: tweet.authorLocation,
              authorWebsite: tweet.authorWebsite,
              authorJoinDate: tweet.authorJoinDate,
              authorTweetsCount: tweet.authorTweetsCount,
              replyCount: tweet.replyCount,
              retweetCount: tweet.retweetCount,
              quoteCount: tweet.quoteCount,
              likeCount: tweet.likeCount,
              viewCount: tweet.viewCount,
              impressions: tweet.impressions,
              mediaUrls: tweet.mediaUrls,
              mediaType: tweet.mediaType,
              quotedStatusId: tweet.quotedStatusId,
              inReplyToStatusId: tweet.inReplyToStatusId,
              hashtags: tweet.hashtags,
              mentions: tweet.mentions,
              urls: tweet.urls,
              trendScore: tweet.trendScore || 0,
              categories: tweet.categories || null,
              rawData: tweet.rawData,
            };
          });

          // Insert tweets
          console.log(`[Fetch] Final tweets to insert: ${tweetsToInsert.length}`);
          if (tweetsToInsert.length > 0) {
            await db.insertTweets(tweetsToInsert);
            console.log(`[Fetch] Successfully inserted ${tweetsToInsert.length} tweets`);
          } else {
            console.log('[Fetch] No tweets to insert after all filters');
          }

          // Update run status
          await db.updateRun(runId, {
            status: "success",
            totalItems: tweetsToInsert.length,
            completedAt: new Date(),
          });

          // Check if we got too few items
          if (tweetsToInsert.length < 5) {
            return {
              success: true,
              runId,
              totalItems: tweetsToInsert.length,
              warning: "Low number of items returned. Check your keywords or Apify actor configuration.",
            };
          }

          return {
            success: true,
            runId,
            totalItems: tweetsToInsert.length,
          };
        } catch (error) {
          // Update run with error
          await db.updateRun(runId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          });

          throw error;
        }
      }),
  }),

  runs: router({
    latest: protectedProcedure.query(async ({ ctx }) => {
      return db.getLatestRuns(ctx.userId, 10);
    }),

    get: protectedProcedure
      .input(z.object({ runId: z.number() }))
      .query(async ({ ctx, input }) => {
        const run = await db.getRun(input.runId);
        
        if (!run || run.userId !== ctx.userId) {
          throw new Error("Run not found");
        }

        return run;
      }),
  }),

  tweets: router({
    byRun: protectedProcedure
      .input(z.object({ runId: z.number() }))
      .query(async ({ ctx, input }) => {
        const run = await db.getRun(input.runId);
        
        if (!run || run.userId !== ctx.userId) {
          throw new Error("Run not found");
        }

        return db.getTweetsByRun(input.runId);
      }),

    latest: protectedProcedure.query(async ({ ctx }) => {
      return db.getLatestTweetsWithBookmarks(ctx.userId);
    }),

    topLatest: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        const latestRun = await db.getLatestSuccessfulRun(ctx.userId);
        
        if (!latestRun) {
          return [];
        }

        return db.getTopTweetsByRun(latestRun.id, input.limit);
      }),

    deleteAll: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.deleteAllTweets(ctx.userId);
        return { success: true };
      }),
  }),

  ignored: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getIgnoredTweets(ctx.userId);
    }),

    add: protectedProcedure
      .input(z.object({
        tweetId: z.string(),
        tweetUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.addIgnoredTweet({
          userId: ctx.userId,
          tweetId: input.tweetId,
          tweetUrl: input.tweetUrl,
        });
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ tweetId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeIgnoredTweet(ctx.userId, input.tweetId);
        return { success: true };
      }),
  }),

  fetchSettings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFetchSettings(ctx.userId);
    }),

    save: protectedProcedure
      .input(z.object({
        id: z.number().optional(),
        name: z.string(),
        queryType: z.string().optional(),
        maxItems: z.number().optional(),
        lang: z.string().optional(),
        minFaves: z.number().optional(),
        minRetweets: z.number().optional(),
        minReplies: z.number().optional(),
        filterImages: z.number().optional(),
        filterVideos: z.number().optional(),
        filterLinks: z.number().optional(),
        filterVerified: z.number().optional(),
        filterSafe: z.number().optional(),
        since: z.string().nullable().optional(),
        until: z.string().nullable().optional(),
        withinTime: z.string().nullable().optional(),
        fromUser: z.string().nullable().optional(),
        toUser: z.string().nullable().optional(),
        mentionUser: z.string().nullable().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.saveFetchSetting({
          ...input,
          userId: ctx.userId,
        });
        return { success: true, id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFetchSetting(input.id, ctx.userId);
        return { success: true };
      }),
  }),

  bookmarks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBookmarks(ctx.userId);
    }),

    add: protectedProcedure
      .input(z.object({
        tweetId: z.number(),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.addBookmark(ctx.userId, input.tweetId, input.note);
        return { success: true, id };
      }),

    remove: protectedProcedure
      .input(z.object({ tweetId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeBookmark(ctx.userId, input.tweetId);
        return { success: true };
      }),

    isBookmarked: protectedProcedure
      .input(z.object({ tweetId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isBookmarked(ctx.userId, input.tweetId);
      }),

    toggle: protectedProcedure
      .input(z.object({ tweetId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const isBookmarked = await db.isBookmarked(ctx.userId, input.tweetId);
        
        if (isBookmarked) {
          await db.removeBookmark(ctx.userId, input.tweetId);
          return { success: true, bookmarked: false };
        } else {
          await db.addBookmark(ctx.userId, input.tweetId);
          return { success: true, bookmarked: true };
        }
      }),
  }),

  telegram: router({
    webhook: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        // Handle text commands (/start, /app)
        if (input.message?.text) {
          const text = input.message.text;
          const chatId = input.message.chat?.id;

          if (!chatId) {
            return { success: false, error: "No chat ID" };
          }

          // Get settings to find bot token
          const dbConn = await db.getDb();
          if (!dbConn) {
            return { success: false, error: "Database not available" };
          }
          const allSettings = await dbConn.select().from(settingsTable).limit(1);
          
          if (!allSettings || allSettings.length === 0) {
            return { success: false, error: "No settings found" };
          }

          const userSettings = allSettings[0];
          
          if (!userSettings.telegramBotToken) {
            return { success: false, error: "Telegram bot token not configured" };
          }

          const miniAppUrl = process.env.VITE_APP_URL || "https://3000-iydbtns1aq333ef13jid0-ddc4418f.manusvm.computer";

          // Handle /start or /app commands
          if (text === "/start" || text === "/app") {
            await sendWelcomeMessage(userSettings.telegramBotToken, chatId.toString(), miniAppUrl);
            return { success: true };
          }

          // Handle Twitter/X URL
          const twitterUrlRegex = /https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/(\d+)/i;
          const match = text.match(twitterUrlRegex);
          if (match) {
            const tweetUrl = text.trim();
            const { handleTweetUrl } = await import("./lib/handle-tweet-url");
            await handleTweetUrl(
              tweetUrl,
              userSettings.telegramBotToken,
              chatId.toString(),
              {
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
              }
            );
            return { success: true };
          }
        }

        const callback = parseTelegramCallback(input);
        
        if (!callback) {
          return { success: false };
        }

        // Handle "fetch_now" callback
        if (callback.action === "fetch_now") {
          // Find user by telegram chat ID
          // For simplicity, we'll trigger a fetch for the first user
          // In production, you'd map telegram user ID to app user ID
          
          try {
            // Get settings to find bot token
            const dbConn = await db.getDb();
            if (!dbConn) {
              return { success: false, error: "Database not available" };
            }
            const allSettings = await dbConn.select().from(settingsTable).limit(1);
            
            if (!allSettings || allSettings.length === 0) {
              return { success: false, error: "No settings found" };
            }

            const userSettings = allSettings[0];
            
            if (!userSettings.telegramBotToken) {
              return { success: false, error: "Telegram bot token not configured" };
            }

            // Answer the callback query
            await answerCallbackQuery(userSettings.telegramBotToken, callback.callbackId, "Fetching tweets...");

            // This would trigger the fetch - for now just acknowledge
            return { success: true };
          } catch (error) {
            console.error("[Telegram] Webhook error:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
          }
        }

        return { success: true };
      }),

    sendReport: protectedProcedure
      .input(z.object({
        runId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await db.getSettings(ctx.userId);
        
        if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
          throw new Error("Telegram bot token and chat ID are required");
        }

        // Get the run to report on
        let run;
        if (input.runId) {
          run = await db.getRun(input.runId);
        } else {
          run = await db.getLatestSuccessfulRun(ctx.userId);
        }

        if (!run) {
          throw new Error("No run found to report on");
        }

        // Get tweets for this run
        const tweets = await db.getTweetsByRun(run.id);

        if (tweets.length === 0) {
          throw new Error("No tweets found in this run");
        }

        // Calculate category counts
        const viralCount = tweets.filter(t => t.categories?.includes("Viral")).length;
        const highEngagementCount = tweets.filter(t => t.categories?.includes("High Engagement")).length;
        const risingCount = tweets.filter(t => t.categories?.includes("Rising")).length;
        const mediaRichCount = tweets.filter(t => t.categories?.includes("Media-rich")).length;

        // Send the report
        await sendDailyReport(
          settings.telegramBotToken,
          settings.telegramChatId,
          tweets,
          {
            date: run.completedAt || run.startedAt,
            totalItems: tweets.length,
            viralCount,
            highEngagementCount,
            risingCount,
            mediaRichCount,
          }
        );

        return { success: true };
      }),

    sendTweet: protectedProcedure
      .input(z.object({
        tweetId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await db.getSettings(ctx.userId);
        
        if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
          throw new Error("Telegram bot token and chat ID are required");
        }

        // Get the tweet
        const tweet = await db.getTweetById(input.tweetId);

        if (!tweet) {
          throw new Error("Tweet not found");
        }

           // Prepare caption
        const caption = `🐦 **${tweet.authorName || tweet.authorHandle}** (@${tweet.authorHandle})${tweet.authorVerified ? ' ✓' : ''}

${tweet.text}

❤️ ${tweet.likeCount.toLocaleString()} | 🔁 ${tweet.retweetCount.toLocaleString()} | 💬 ${tweet.replyCount.toLocaleString()}${tweet.viewCount ? ` | 👁️ ${tweet.viewCount.toLocaleString()}` : ''}

🔗 ${tweet.url}`;

        // mediaUrls is now structured: Array<{type: 'photo'|'video', url: string, thumbnail?: string}>
        const mediaArray = tweet.mediaUrls || [];
        const actualMedia = mediaArray.map(media => ({
          url: media.url,
          isVideo: media.type === 'video',
          thumbnail: media.thumbnail,
        }));

        let response;

        if (actualMedia.length === 0) {
          // No media, send as text message
          response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId,
              text: caption,
              disable_web_page_preview: false,
            }),
          });
        } else if (actualMedia.length === 1) {
          const media = actualMedia[0];
          
          if (media.isVideo) {
            // Send as video with optional thumbnail
            const videoBody: any = {
              chat_id: settings.telegramChatId,
              video: media.url,
              caption: caption,
            };
            
            // Add thumbnail if available
            if (media.thumbnail) {
              videoBody.thumbnail = media.thumbnail;
            }
            
            response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendVideo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(videoBody),
            });
          } else {
            // Send as photo
            response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: settings.telegramChatId,
                photo: media.url,
                caption: caption,
              }),
            });
          }
        } else {
          // Multiple media, send as media group
          const mediaGroup = actualMedia.slice(0, 10).map((media, index) => {
            const item: any = {
              type: media.isVideo ? 'video' : 'photo',
              media: media.url,
              ...(index === 0 ? { caption: caption } : {}),
            };
            
            // Add thumbnail for videos
            if (media.isVideo && media.thumbnail) {
              item.thumbnail = media.thumbnail;
            }
            
            return item;
          });

          response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMediaGroup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId,
              media: mediaGroup,
            }),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send tweet to Telegram: ${response.statusText} - ${errorText}`);
        }

        return { success: true };
      }),

    sendTweetWithAI: protectedProcedure
      .input(z.object({
        tweetId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const settings = await db.getSettings(ctx.userId);
        
        if (!settings || !settings.telegramBotToken || !settings.telegramChatId) {
          throw new Error("Telegram bot token and chat ID are required");
        }

        // Get the tweet
        const tweet = await db.getTweetById(input.tweetId);

        if (!tweet) {
          throw new Error("Tweet not found");
        }

        // Check if AI rewrite is enabled in settings
        if (!settings.aiRewriteEnabled) {
          throw new Error("AI rewrite is not enabled. Please enable it in settings.");
        }

        if (!settings.aiRewritePrompt) {
          throw new Error("AI rewrite prompt is not configured. Please set it in settings.");
        }

        if (!settings.openRouterApiKey) {
          throw new Error("OpenRouter API key is not configured. Please set it in settings.");
        }

        // Import AI rewrite helper
        const { rewriteTweetWithOpenRouter } = await import("./lib/ai-rewrite");
        const { buildTelegramMessage, getDefaultTelegramTemplate } = await import("./lib/telegram-template");

        // Remove only the last t.co link (which is usually the tweet's own URL added by Apify)
        // Keep other links in the text as they are part of the content
        let cleanText = tweet.text || "";
        const tcoLinkRegex = /https?:\/\/t\.co\/\w+/g;
        const matches = cleanText.match(tcoLinkRegex);
        
        if (matches && matches.length > 0) {
          // Remove only the last occurrence (the tweet's own URL)
          const lastLink = matches[matches.length - 1];
          const lastIndex = cleanText.lastIndexOf(lastLink);
          cleanText = cleanText.substring(0, lastIndex) + cleanText.substring(lastIndex + lastLink.length);
        }
        
        cleanText = cleanText.replace(/\s+/g, " ").trim();

        // Check OpenRouter API key
        if (!settings.openRouterApiKey || !settings.openRouterApiKey.trim()) {
          throw new Error("OpenRouter API key is not configured. Please add it in settings.");
        }

        // Rewrite tweet with AI using OpenRouter
        const rewrittenText = await rewriteTweetWithOpenRouter(
          cleanText,
          settings.aiRewritePrompt,
          {
            apiKey: settings.openRouterApiKey,
            model: settings.aiModel || 'openai/gpt-4o',
            temperature: Number(settings.temperature) || 0.7,
            maxTokens: Number(settings.maxTokens) || 500,
            topP: Number(settings.topP) || 0.9,
          }
        );

        // Build message from template (use default if empty or null)
        const template = (settings.telegramTemplate && settings.telegramTemplate.trim()) 
          ? settings.telegramTemplate 
          : getDefaultTelegramTemplate();
        const message = buildTelegramMessage(template, {
          rewrittenText,
          originalText: tweet.text || "",
          authorName: tweet.authorName,
          authorHandle: tweet.authorHandle,
          likeCount: tweet.likeCount,
          retweetCount: tweet.retweetCount,
          replyCount: tweet.replyCount,
          viewCount: tweet.viewCount,
          tweetUrl: tweet.url,
          createdAt: tweet.createdAt,
          // Use default value of 1 (true) if NULL
          includeStats: settings.includeStats !== null ? Boolean(settings.includeStats) : true,
          includeLink: settings.includeLink !== null ? Boolean(settings.includeLink) : true,
          includeAuthor: settings.includeAuthor !== null ? Boolean(settings.includeAuthor) : true,
          includeDate: settings.includeDate !== null ? Boolean(settings.includeDate) : false,
        });

        // Prepare media if includeMedia is enabled (default true if NULL)
        const includeMedia = settings.includeMedia !== null ? Boolean(settings.includeMedia) : true;
        const mediaArray = includeMedia ? (tweet.mediaUrls || []) : [];
        const actualMedia = mediaArray.map(media => ({
          url: media.url,
          isVideo: media.type === 'video',
          thumbnail: media.thumbnail,
        }));

        let response;

        if (actualMedia.length === 0) {
          // No media, send as text message
          response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId,
              text: message,
              disable_web_page_preview: false,
            }),
          });
        } else if (actualMedia.length === 1) {
          const media = actualMedia[0];
          
          if (media.isVideo) {
            // Send as video with optional thumbnail
            const videoBody: any = {
              chat_id: settings.telegramChatId,
              video: media.url,
              caption: message,
            };
            
            if (media.thumbnail) {
              videoBody.thumbnail = media.thumbnail;
            }
            
            response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendVideo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(videoBody),
            });
          } else {
            // Send as photo
            response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: settings.telegramChatId,
                photo: media.url,
                caption: message,
              }),
            });
          }
        } else {
          // Multiple media, send as media group
          const mediaGroup = actualMedia.slice(0, 10).map((media, index) => {
            const item: any = {
              type: media.isVideo ? 'video' : 'photo',
              media: media.url,
              ...(index === 0 ? { caption: message } : {}),
            };
            
            if (media.isVideo && media.thumbnail) {
              item.thumbnail = media.thumbnail;
            }
            
            return item;
          });

          response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMediaGroup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId,
              media: mediaGroup,
            }),
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to send tweet to Telegram: ${response.statusText} - ${errorText}`);
        }

        return { success: true, rewrittenText };
      }),

    setupBot: protectedProcedure
      .mutation(async ({ ctx }) => {
        const settings = await db.getSettings(ctx.userId);
        
        if (!settings || !settings.telegramBotToken) {
          throw new Error("Telegram bot token is required");
        }

        // Get Mini App URL from environment
        const miniAppUrl = process.env.VITE_APP_URL || "https://3000-iydbtns1aq333ef13jid0-ddc4418f.manusvm.computer";

        // Set webhook URL
        const webhookUrl = `${miniAppUrl}/api/trpc/telegram.webhook`;
        const setWebhookResponse = await fetch(
          `https://api.telegram.org/bot${settings.telegramBotToken}/setWebhook`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: webhookUrl }),
          }
        );
        const webhookResult = await setWebhookResponse.json();
        if (!webhookResult.ok) {
          throw new Error(`Failed to set webhook: ${webhookResult.description}`);
        }

        // Set bot commands and menu button
        await setTelegramBotCommands(settings.telegramBotToken, miniAppUrl);

        // Send welcome message if chat ID is configured
        if (settings.telegramChatId) {
          await sendWelcomeMessage(settings.telegramBotToken, settings.telegramChatId, miniAppUrl);
        }

        return { success: true, miniAppUrl };
      }),
  }),

  scheduled: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getScheduledPosts(ctx.userId);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getScheduledPostById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        scheduleType: z.enum(["daily", "weekly", "custom"]),
        scheduleTimes: z.array(z.string()),
        weekDays: z.array(z.number()).optional(),
        postsPerRun: z.number().default(5),
        sortBy: z.enum(["trending", "likes", "retweets", "views", "latest"]).default("trending"),
        contentMix: z.object({
          text: z.number(),
          images: z.number(),
          videos: z.number(),
        }).optional(),
        preventDuplicates: z.boolean().default(true),
        duplicateTimeWindow: z.number().default(24),
        keywords: z.string().optional(),
        queryType: z.string().default("Latest"),
        minLikes: z.number().optional(),
        minRetweets: z.number().optional(),
        minViews: z.number().optional(),
        hasImages: z.boolean().default(false),
        hasVideos: z.boolean().default(false),
        hasLinks: z.boolean().default(false),
        verifiedOnly: z.boolean().default(false),
        useAiTranslation: z.boolean().default(false),
        telegramTemplate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createScheduledPost({
          userId: ctx.userId,
          name: input.name,
          scheduleType: input.scheduleType,
          scheduleTimes: input.scheduleTimes,
          weekDays: input.weekDays,
          postsPerRun: input.postsPerRun,
          sortBy: input.sortBy,
          contentMix: input.contentMix,
          preventDuplicates: input.preventDuplicates ? 1 : 0,
          duplicateTimeWindow: input.duplicateTimeWindow,
          keywords: input.keywords,
          queryType: input.queryType,
          minLikes: input.minLikes,
          minRetweets: input.minRetweets,
          minViews: input.minViews,
          hasImages: input.hasImages ? 1 : 0,
          hasVideos: input.hasVideos ? 1 : 0,
          hasLinks: input.hasLinks ? 1 : 0,
          verifiedOnly: input.verifiedOnly ? 1 : 0,
          useAiTranslation: input.useAiTranslation ? 1 : 0,
          telegramTemplate: input.telegramTemplate,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        isActive: z.boolean().optional(),
        scheduleType: z.enum(["daily", "weekly", "custom"]).optional(),
        scheduleTimes: z.array(z.string()).optional(),
        weekDays: z.array(z.number()).optional(),
        postsPerRun: z.number().optional(),
        sortBy: z.enum(["trending", "likes", "retweets", "views", "latest"]).optional(),
        contentMix: z.object({
          text: z.number(),
          images: z.number(),
          videos: z.number(),
        }).optional(),
        preventDuplicates: z.boolean().optional(),
        duplicateTimeWindow: z.number().optional(),
        keywords: z.string().optional(),
        queryType: z.string().optional(),
        minLikes: z.number().optional(),
        minRetweets: z.number().optional(),
        minViews: z.number().optional(),
        hasImages: z.boolean().optional(),
        hasVideos: z.boolean().optional(),
        hasLinks: z.boolean().optional(),
        verifiedOnly: z.boolean().optional(),
        useAiTranslation: z.boolean().optional(),
        telegramTemplate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input };
        delete updateData.id;
        
        // Convert booleans to integers
        if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;
        if (input.preventDuplicates !== undefined) updateData.preventDuplicates = input.preventDuplicates ? 1 : 0;
        if (input.hasImages !== undefined) updateData.hasImages = input.hasImages ? 1 : 0;
        if (input.hasVideos !== undefined) updateData.hasVideos = input.hasVideos ? 1 : 0;
        if (input.hasLinks !== undefined) updateData.hasLinks = input.hasLinks ? 1 : 0;
        if (input.verifiedOnly !== undefined) updateData.verifiedOnly = input.verifiedOnly ? 1 : 0;
        if (input.useAiTranslation !== undefined) updateData.useAiTranslation = input.useAiTranslation ? 1 : 0;
        
        await db.updateScheduledPost(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteScheduledPost(input.id);
        return { success: true };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateScheduledPost(input.id, { isActive: input.isActive ? 1 : 0 });
        return { success: true };
      }),

    executeNow: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        console.log(`[executeNow] Manual execution requested for schedule ${input.id}`);
        const { executeScheduledPost } = await import('./scheduler');
        const result = await executeScheduledPost(input.id, ctx.userId);
        return result;
      }),

    sentTweets: protectedProcedure
      .input(z.object({ scheduleId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getSentTweets(input.scheduleId);
      }),

    deleteSentGroup: protectedProcedure
      .input(z.object({ executionId: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteSentTweetsByExecution(input.executionId);
        return { success: true };
      }),

    clearAllHistory: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.clearAllSentTweets(ctx.userId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
