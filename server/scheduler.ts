import * as db from "./db";
import moment from 'moment-timezone';

/**
 * Execute a scheduled post immediately
 * Fetches tweets based on schedule settings and sends to Telegram
 */
export async function executeScheduledPost(scheduleId: number, userId: number) {
  console.log(`[Scheduler] Executing scheduled post ${scheduleId} for user ${userId}`);
  
  try {
    // Get schedule details
    const schedule = await db.getScheduledPostById(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }
    
    if (!schedule.isActive) {
      console.log(`[Scheduler] Schedule ${scheduleId} is not active, skipping`);
      return { success: false, message: "Schedule is not active" };
    }
    
    // Get user settings for Telegram config
    const settings = await db.getSettings(userId);
    if (!settings?.telegramBotToken || !settings?.telegramChatId) {
      throw new Error("Telegram not configured");
    }
    
    // Generate unique execution ID for grouping
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Scheduler] Starting execution ${executionId}`);
    
    // STEP 1: Run Apify actor to fetch fresh tweets before sending
    console.log(`[Scheduler] Triggering Apify actor to fetch fresh tweets...`);
    
    if (!settings.apifyToken) {
      throw new Error('Apify token not configured');
    }
    
    // Get keywords from schedule settings
    const keywordsStr = schedule.keywords || '';
    const keywords = keywordsStr.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    
    if (keywords.length === 0) {
      throw new Error('No keywords configured in schedule. Please add keywords in the schedule settings.');
    }
    
    // Use schedule's maxItems for actor (default 200)
    const maxItems = schedule.maxItems || 200;
    
    console.log(`[Scheduler] Running actor with keywords: ${keywords.join(', ')}, maxItems: ${maxItems}`);
    
    // Import and run the Apify actor
    const { fetchTweetsFromApify } = await import('./apify');
    const freshTweets = await fetchTweetsFromApify(
      keywords,
      maxItems,
      settings.apifyToken,
      {
        // Search filters
        queryType: schedule.queryType || "Latest",
        lang: schedule.lang || "en",
        
        // Engagement filters
        minLikes: schedule.minLikes || undefined,
        minRetweets: schedule.minRetweets || undefined,
        minReplies: schedule.minReplies || undefined,
        minViews: schedule.minViews || undefined,
        
        // Content filters
        hasImages: schedule.hasImages ? true : false,
        hasVideos: schedule.hasVideos ? true : false,
        hasLinks: schedule.hasLinks ? true : false,
        verifiedOnly: schedule.verifiedOnly ? true : false,
        safeOnly: schedule.safeOnly ? true : false,
        
        // Time filters
        since: schedule.since || undefined,
        until: schedule.until || undefined,
        withinTime: schedule.withinTime || undefined,
        
        // User filters
        fromUser: schedule.fromUser || undefined,
        toUser: schedule.toUser || undefined,
        mentionUser: schedule.mentionUser || undefined,
      }
    );
    
    console.log(`[Scheduler] Actor completed, received ${freshTweets.length} fresh tweets`);
    
    if (freshTweets.length === 0) {
      console.log(`[Scheduler] No fresh tweets available for schedule ${scheduleId}`);
      return { success: false, message: "No fresh tweets available" };
    }
    
    // STEP 2: Use ONLY fresh tweets from actor (don't query database)
    const allTweets = freshTweets;
    if (!allTweets || allTweets.length === 0) {
      console.log(`[Scheduler] No tweets available for schedule ${scheduleId}`);
      return { success: false, message: "No tweets available" };
    }
    
    // Filter tweets based on schedule settings (already filtered by actor, but apply additional filters)
    let filteredTweets = allTweets.filter((tweet: any) => {
      // Filter by keywords if specified (additional keyword filter)
      if (schedule.keywords) {
        const keywords = schedule.keywords.split(',').map(k => k.trim().toLowerCase());
        const tweetText = tweet.text.toLowerCase();
        const hasKeyword = keywords.some(keyword => tweetText.includes(keyword));
        if (!hasKeyword) return false;
      }
      
      return true;
    });
    
    // Sort tweets based on sortBy setting
    if (schedule.sortBy === 'likes') {
      filteredTweets.sort((a: any, b: any) => b.likeCount - a.likeCount);
    } else if (schedule.sortBy === 'retweets') {
      filteredTweets.sort((a: any, b: any) => b.retweetCount - a.retweetCount);
    } else if (schedule.sortBy === 'views') {
      filteredTweets.sort((a: any, b: any) => b.viewCount - a.viewCount);
    } else if (schedule.sortBy === 'latest') {
      filteredTweets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // Default: trending (trendScore)
      filteredTweets.sort((a: any, b: any) => b.trendScore - a.trendScore);
    }
    
    // Check for duplicates if preventDuplicates is enabled
    if (schedule.preventDuplicates) {
      const recentSentIds = await db.getRecentSentTweetIds(
        scheduleId,
        schedule.duplicateTimeWindow || 24
      );
      filteredTweets = filteredTweets.filter((tweet: any) => !recentSentIds.includes(tweet.tweetId));
    }
    
    // Apply contentMix if specified
    let tweetsToSend: any[] = [];
    const postsPerRun = schedule.postsPerRun || 10;
    
    if (schedule.contentMix) {
      const { text: textPercent, images: imagesPercent, videos: videosPercent } = schedule.contentMix;
      
      // Separate tweets by type
      const textTweets = filteredTweets.filter((t: any) => !t.mediaUrls || t.mediaUrls.length === 0);
      const imageTweets = filteredTweets.filter((t: any) => t.mediaUrls && t.mediaUrls.length > 0 && t.mediaType === 'image');
      const videoTweets = filteredTweets.filter((t: any) => t.mediaUrls && t.mediaUrls.length > 0 && t.mediaType === 'video');
      
      // Calculate how many of each type to send
      const textCount = Math.round((postsPerRun * textPercent) / 100);
      const imagesCount = Math.round((postsPerRun * imagesPercent) / 100);
      const videosCount = Math.round((postsPerRun * videosPercent) / 100);
      
      console.log(`[Scheduler] ContentMix: text=${textCount}, images=${imagesCount}, videos=${videosCount}`);
      
      // Select tweets based on contentMix
      tweetsToSend = [
        ...textTweets.slice(0, textCount),
        ...imageTweets.slice(0, imagesCount),
        ...videoTweets.slice(0, videosCount),
      ];
      
      // If we don't have enough tweets of a specific type, fill with any available
      if (tweetsToSend.length < postsPerRun) {
        const remaining = postsPerRun - tweetsToSend.length;
        const usedIds = new Set(tweetsToSend.map((t: any) => t.tweetId));
        const availableTweets = filteredTweets.filter((t: any) => !usedIds.has(t.tweetId));
        tweetsToSend.push(...availableTweets.slice(0, remaining));
      }
      
      // Limit to EXACTLY postsPerRun
      tweetsToSend = tweetsToSend.slice(0, postsPerRun);
    } else {
      // No contentMix specified, just take first postsPerRun tweets
      tweetsToSend = filteredTweets.slice(0, postsPerRun);
    }
    
    console.log(`[Scheduler] Will send exactly ${tweetsToSend.length} tweets (postsPerRun: ${postsPerRun})`);
    
    if (tweetsToSend.length === 0) {
      console.log(`[Scheduler] No tweets match criteria for schedule ${scheduleId}`);
      return { success: false, message: "No tweets match criteria" };
    }
    
    console.log(`[Scheduler] Sending ${tweetsToSend.length} tweets for schedule ${scheduleId}`);
    
    // Send tweets to Telegram
    let sentCount = 0;
    const { sendTelegramMessage, sendTelegramPhoto, sendTelegramVideo, sendTelegramMediaGroup } = await import('./telegram');
    
    for (const tweet of tweetsToSend) {
      try {
        const tweetToSend = tweet;
        const useAI = Boolean(schedule.useAiTranslation);
        
        // Build caption/message (HTML format like Send Telegram Report)
        const escapeHtml = (text: string) => {
          return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        };
        
        const authorName = escapeHtml(tweetToSend.authorName || tweetToSend.authorHandle);
        const authorHandle = escapeHtml(tweetToSend.authorHandle);
        const tweetText = escapeHtml(tweetToSend.text);
        
        // Build caption (Telegram limit: 1024 characters)
        const stats = `❤️ ${tweetToSend.likeCount.toLocaleString()} | 🔁 ${tweetToSend.retweetCount.toLocaleString()} | 💬 ${tweetToSend.replyCount.toLocaleString()}${tweetToSend.viewCount ? ` | 👁️ ${tweetToSend.viewCount.toLocaleString()}` : ''}`;
        const link = `🔗 <a href="${tweetToSend.url}">View on Twitter</a>`;
        const header = `🐦 <b>${authorName}</b> (@${authorHandle})${tweetToSend.authorVerified ? ' ✓' : ''}\n\n`;
        const footer = `\n\n${stats}\n\n${link}`;
        
        // Calculate max text length (1024 - header - footer - safety margin)
        const maxTextLength = 1024 - header.length - footer.length - 50;
        const truncatedText = tweetText.length > maxTextLength 
          ? tweetText.substring(0, maxTextLength) + '...' 
          : tweetText;
        
        const caption = `${header}${truncatedText}${footer}`;
        
        // Determine send method based on media
        const mediaUrls = tweetToSend.mediaUrls || [];
        
        if (mediaUrls.length === 0) {
          // Text only - send as message
          await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, {
            chat_id: settings.telegramChatId,
            text: caption,
            parse_mode: "HTML",
          });
        } else if (mediaUrls.length === 1) {
          // Single media - send as photo or video with caption
          const mediaItem = mediaUrls[0];
          const mediaUrl = typeof mediaItem === 'string' ? mediaItem : mediaItem.url;
          const mediaType = typeof mediaItem === 'string' ? tweetToSend.mediaType : mediaItem.type;
          
          if (mediaType === 'video') {
            await sendTelegramVideo(settings.telegramBotToken, settings.telegramChatId, {
              video: mediaUrl,
              caption,
              parse_mode: "HTML",
            });
          } else {
            // Default to photo
            await sendTelegramPhoto(settings.telegramBotToken, settings.telegramChatId, {
              photo: mediaUrl,
              caption,
              parse_mode: "HTML",
            });
          }
        } else {
          // Multiple media - send as media group
          // Note: Telegram media group doesn't support parse_mode, strip HTML tags
          const plainCaption = caption.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
          const media = mediaUrls.map((item: any, index: number) => {
            const url = typeof item === 'string' ? item : item.url;
            const type = typeof item === 'string' ? (tweetToSend.mediaType === 'video' ? 'video' as const : 'photo' as const) : item.type;
            return {
              type,
              media: url,
              caption: index === 0 ? plainCaption : undefined,
            };
          });
          
          await sendTelegramMediaGroup(settings.telegramBotToken, settings.telegramChatId, media);
        }
        
        // Record sent post
        await db.recordSentPost({
          scheduleId,
          executionId,
          tweetId: tweet.tweetId,
          url: tweet.url,
          text: tweet.text,
          createdAt: tweet.createdAt,
          authorHandle: tweet.authorHandle,
          authorName: tweet.authorName || undefined,
          authorVerified: tweet.authorVerified,
          likeCount: tweet.likeCount,
          retweetCount: tweet.retweetCount,
          replyCount: tweet.replyCount,
          viewCount: tweet.viewCount || 0,
          mediaUrls: tweet.mediaUrls,
        });
        
        sentCount++;
        
        // Add delay between tweets to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[Scheduler] Failed to send tweet ${tweet.tweetId}:`, error);
      }
    }
    
    console.log(`[Scheduler] Successfully sent ${sentCount}/${tweetsToSend.length} tweets for schedule ${scheduleId}`);
    
    // Save fresh tweets to database for history (optional)
    try {
      const runId = await db.createRun({
        userId: userId,
        status: 'success',
        totalItems: freshTweets.length,
        triggeredBy: 'scheduled',
        startedAt: new Date(),
        completedAt: new Date(),
      });
      
      const tweetsToInsert = freshTweets.map(tweet => ({
        runId: runId,
        tweetId: tweet.tweetId,
        url: tweet.url,
        text: tweet.text,
        authorHandle: tweet.authorHandle,
        authorName: tweet.authorName,
        authorVerified: tweet.authorVerified,
        likeCount: tweet.likeCount,
        retweetCount: tweet.retweetCount,
        replyCount: tweet.replyCount,
        viewCount: tweet.viewCount,
        mediaUrls: tweet.mediaUrls,
        createdAt: tweet.createdAt,
        fetchedAt: new Date(),
        trendScore: tweet.trendScore,
        userId: userId,
      }));
      
      await db.insertTweets(tweetsToInsert);
      console.log(`[Scheduler] Saved ${tweetsToInsert.length} fresh tweets to database for history`);
    } catch (dbError) {
      console.error(`[Scheduler] Failed to save tweets to database:`, dbError);
    }
    
    return {
      success: true,
      message: `Sent ${sentCount} tweets`,
      sentCount,
      totalAvailable: filteredTweets.length,
    };
  } catch (error) {
    console.error(`[Scheduler] Error executing schedule ${scheduleId}:`, error);
    throw error;
  }
}

// In-memory lock to prevent concurrent executions of the same schedule
const executionLocks = new Map<number, string>(); // scheduleId -> currentMinute

/**
 * Check and execute all due scheduled posts
 * This should be called periodically (e.g., every minute)
 */
export async function checkAndExecuteSchedules() {
  try {
    const activeSchedules = await db.getActiveSchedules();
    if (!activeSchedules || activeSchedules.length === 0) {
      return;
    }
    
    for (const schedule of activeSchedules) {
      try {
        // Get current time in schedule's timezone
        const timezone = schedule.timezone || 'UTC';
        const now = moment().tz(timezone);
        const currentTime = now.format('HH:mm');
        const currentDay = now.day(); // 0 = Sunday, 6 = Saturday
        
        // Parse schedule times
        const scheduleTimes = typeof schedule.scheduleTimes === 'string'
          ? JSON.parse(schedule.scheduleTimes)
          : schedule.scheduleTimes;
        
        if (!Array.isArray(scheduleTimes)) continue;
        
        // Check if current time matches any schedule time
        console.log(`[Scheduler] Schedule ${schedule.id} (${timezone}): times=${JSON.stringify(scheduleTimes)}, current=${currentTime}`);
        
        // Check if already executed today for this time slot
        const lastExecution = await db.getLastSentPost(schedule.id);
        const lastExecutionTime = lastExecution ? moment(lastExecution.sentAt).tz(timezone) : null;
        
        const shouldExecute = scheduleTimes.some((time: string) => {
          // Only execute if current time exactly matches schedule time (HH:MM)
          if (time !== currentTime) return false;
          
          // Check in-memory lock first (prevents multiple executions in same minute)
          const lockedMinute = executionLocks.get(schedule.id);
          if (lockedMinute === currentTime) {
            console.log(`[Scheduler] Schedule ${schedule.id} locked for ${currentTime}, skipping`);
            return false;
          }
          
          // Check if already executed in the same minute to prevent duplicates
          if (lastExecutionTime) {
            const lastExecutionMinute = lastExecutionTime.format('HH:mm');
            if (lastExecutionMinute === currentTime) {
              console.log(`[Scheduler] Schedule ${schedule.id} already executed at ${currentTime}, skipping`);
              return false;
            }
          }
          
          // For weekly schedules, check day of week
          if (schedule.scheduleType === 'weekly') {
            const weekDays = typeof schedule.weekDays === 'string'
              ? JSON.parse(schedule.weekDays)
              : schedule.weekDays;
            
            if (!Array.isArray(weekDays) || !weekDays.includes(currentDay)) {
              return false;
            }
          }
          
          return true;
        });
        
        if (shouldExecute) {
          console.log(`[Scheduler] Executing schedule ${schedule.id} at ${currentTime}`);
          // Set lock before execution
          executionLocks.set(schedule.id, currentTime);
          try {
            await executeScheduledPost(schedule.id, schedule.userId);
          } finally {
            // Keep lock for this minute (will be cleared when minute changes)
            // No need to clear immediately
          }
        }
      } catch (error) {
        console.error(`[Scheduler] Error checking schedule ${schedule.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in checkAndExecuteSchedules:', error);
  }
}

/**
 * Start the scheduler background job
 * Checks for due schedules every minute
 */
export function startScheduler() {
  console.log('[Scheduler] Starting background scheduler...');
  
  // Calculate delay to sync with the start of next minute
  const now = new Date();
  const secondsUntilNextMinute = 60 - now.getSeconds();
  const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds();
  
  console.log(`[Scheduler] Will sync with next minute in ${secondsUntilNextMinute} seconds...`);
  
  // Wait until the start of next minute, then start checking every minute
  setTimeout(() => {
    console.log('[Scheduler] Synced! Starting minute-by-minute checks...');
    
    // Run immediately at the start of minute
    checkAndExecuteSchedules();
    
    // Then run every minute at the start of minute
    setInterval(() => {
      checkAndExecuteSchedules();
    }, 60 * 1000); // Every 60 seconds
  }, msUntilNextMinute);
  
  console.log('[Scheduler] Background scheduler started');
}
