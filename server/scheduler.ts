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
    
    // STEP 1: Run Apify actor to fetch fresh tweets before sending
    console.log(`[Scheduler] Triggering Apify actor to fetch fresh tweets...`);
    
    if (!settings.apifyToken) {
      throw new Error('Apify token not configured');
    }
    
    // Get fetch settings to know what keywords to search
    const fetchSettingsList = await db.getFetchSettings(userId);
    if (fetchSettingsList.length === 0) {
      throw new Error('No fetch settings found');
    }
    
    // Use the first fetch setting
    const activeFetchSetting = fetchSettingsList[0];
    const keywordsStr = activeFetchSetting.twitterContent || activeFetchSetting.searchTerms || '';
    const keywords = keywordsStr.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
    
    if (keywords.length === 0) {
      throw new Error('No keywords configured in fetch settings');
    }
    
    // Use schedule's postsPerRun as maxItems for actor
    const maxItems = (schedule.postsPerRun || 10) * 3; // Fetch 3x to have buffer for filtering
    
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
    
    // Limit to EXACTLY postsPerRun
    const postsPerRun = schedule.postsPerRun || 10;
    const tweetsToSend = filteredTweets.slice(0, postsPerRun);
    
    console.log(`[Scheduler] Will send exactly ${tweetsToSend.length} tweets (postsPerRun: ${postsPerRun})`);
    
    if (tweetsToSend.length === 0) {
      console.log(`[Scheduler] No tweets match criteria for schedule ${scheduleId}`);
      return { success: false, message: "No tweets match criteria" };
    }
    
    console.log(`[Scheduler] Sending ${tweetsToSend.length} tweets for schedule ${scheduleId}`);
    
    // Send tweets to Telegram
    let sentCount = 0;
    for (const tweet of tweetsToSend) {
      try {
        // Import the router to call the procedure
        // We'll use direct database and telegram API calls instead
        const tweetToSend = tweet;
        const useAI = Boolean(schedule.useAiTranslation);
        
        // Build telegram message (simplified version)
        let message = `🐦 **${tweetToSend.authorName || tweetToSend.authorHandle}** (@${tweetToSend.authorHandle})${tweetToSend.authorVerified ? ' ✓' : ''}\n\n${tweetToSend.text}\n\n❤️ ${tweetToSend.likeCount.toLocaleString()} | 🔁 ${tweetToSend.retweetCount.toLocaleString()} | 💬 ${tweetToSend.replyCount.toLocaleString()}${tweetToSend.viewCount ? ` | 👁️ ${tweetToSend.viewCount.toLocaleString()}` : ''}\n\n🔗 ${tweetToSend.url}`;
        
        // Send to Telegram
        const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: message,
            disable_web_page_preview: false,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Telegram API error: ${response.statusText}`);
        }
        
        // Record sent post
        await db.recordSentPost({
          scheduleId,
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
          
          // Check if already executed in the last 2 minutes to prevent duplicates
          if (lastExecutionTime) {
            const minutesSinceLastExecution = now.diff(lastExecutionTime, 'minutes');
            if (minutesSinceLastExecution < 2) {
              console.log(`[Scheduler] Schedule ${schedule.id} executed ${minutesSinceLastExecution} minutes ago, skipping`);
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
          await executeScheduledPost(schedule.id, schedule.userId);
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
