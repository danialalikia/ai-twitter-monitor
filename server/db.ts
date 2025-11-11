import { eq, desc, and, gte, lte, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, settings, InsertSettings, runs, InsertRun, tweets, InsertTweet, ignoredTweets, InsertIgnoredTweet, fetchSettings, InsertFetchSetting, bookmarks, InsertBookmark, scheduledPosts, InsertScheduledPost, sentPosts, InsertSentPost } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Settings helpers
export async function getSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSettings(data: InsertSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getSettings(data.userId);
  
  if (existing) {
    await db.update(settings).set(data).where(eq(settings.userId, data.userId));
    return getSettings(data.userId);
  } else {
    await db.insert(settings).values(data);
    return getSettings(data.userId);
  }
}

// Runs helpers
export async function createRun(data: InsertRun) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(runs).values(data);
  return result[0].insertId;
}

export async function updateRun(id: number, data: Partial<InsertRun>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(runs).set(data).where(eq(runs.id, id));
}

export async function getRun(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(runs).where(eq(runs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLatestRuns(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(runs).where(eq(runs.userId, userId)).orderBy(desc(runs.createdAt)).limit(limit);
}

export async function getLatestSuccessfulRun(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(runs)
    .where(and(eq(runs.userId, userId), eq(runs.status, "success")))
    .orderBy(desc(runs.completedAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Tweets helpers
export async function insertTweets(data: InsertTweet[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.length === 0) return;
  
  try {
    // Insert with ignore duplicates - use a dummy update to skip duplicates
    await db.insert(tweets).values(data).onDuplicateKeyUpdate({
      set: { fetchedAt: new Date() } // Dummy update to ignore duplicates
    });
  } catch (error) {
    console.error("[Database] Failed to insert tweets:", error);
    console.error("[Database] Sample tweet data:", JSON.stringify(data[0], null, 2));
    throw error;
  }
}

export async function getTweetsByRun(runId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tweets).where(eq(tweets.runId, runId)).orderBy(desc(tweets.trendScore));
}

export async function getLatestTweetsWithBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get latest run
  const latestRun = await getLatestSuccessfulRun(userId);
  if (!latestRun) return [];

  // Get tweets from latest run
  const latestTweets = await db.select().from(tweets)
    .where(eq(tweets.runId, latestRun.id))
    .orderBy(desc(tweets.trendScore));

  // Get bookmarked tweet IDs
  const userBookmarks = await db.select().from(bookmarks)
    .where(eq(bookmarks.userId, userId));
  
  const bookmarkedTweetIds = userBookmarks.map(b => b.tweetId);

  // Get bookmarked tweets (from all runs)
  const bookmarkedTweets = bookmarkedTweetIds.length > 0
    ? await db.select().from(tweets)
        .where(inArray(tweets.id, bookmarkedTweetIds))
    : [];

  // Merge: bookmarked tweets first, then latest tweets (remove duplicates)
  const latestTweetIds = new Set(latestTweets.map(t => t.id));
  const uniqueBookmarkedTweets = bookmarkedTweets.filter(t => !latestTweetIds.has(t.id));

  return [...uniqueBookmarkedTweets, ...latestTweets];
}

export async function getTopTweetsByRun(runId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tweets)
    .where(eq(tweets.runId, runId))
    .orderBy(desc(tweets.trendScore))
    .limit(limit);
}

// Ignored tweets helpers
export async function getIgnoredTweets(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ignoredTweets).where(eq(ignoredTweets.userId, userId));
}

export async function addIgnoredTweet(data: InsertIgnoredTweet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(ignoredTweets).values(data);
}

export async function removeIgnoredTweet(userId: number, tweetId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(ignoredTweets).where(
    and(eq(ignoredTweets.userId, userId), eq(ignoredTweets.tweetId, tweetId))
  );
}

export async function getTweetById(tweetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(tweets).where(eq(tweets.id, tweetId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function deleteAllTweets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First get all run IDs for this user
  const userRuns = await db.select({ id: runs.id }).from(runs).where(eq(runs.userId, userId));
  const runIds = userRuns.map(r => r.id);
  
  // Delete all tweets from those runs
  if (runIds.length > 0) {
    await db.delete(tweets).where(inArray(tweets.runId, runIds));
  }
  
  // Then delete all runs for this user
  await db.delete(runs).where(eq(runs.userId, userId));
}

/**
 * Fetch Settings helpers
 */
export async function getFetchSettings(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(fetchSettings).where(eq(fetchSettings.userId, userId)).orderBy(desc(fetchSettings.updatedAt));
}

export async function saveFetchSetting(data: InsertFetchSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (data.id) {
    // Update existing
    await db.update(fetchSettings).set(data).where(eq(fetchSettings.id, data.id));
    return data.id;
  } else {
    // Insert new
    const result = await db.insert(fetchSettings).values(data);
    return result[0].insertId;
  }
}

export async function deleteFetchSetting(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(fetchSettings).where(
    and(eq(fetchSettings.id, id), eq(fetchSettings.userId, userId))
  );
}

/**
 * Bookmarks helpers
 */
export async function getBookmarks(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Join with tweets table to get full tweet data
  const result = await db
    .select({
      bookmark: bookmarks,
      tweet: tweets,
    })
    .from(bookmarks)
    .leftJoin(tweets, eq(bookmarks.tweetId, tweets.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.bookmarkedAt));

  return result.map(r => ({
    ...r.bookmark,
    tweet: r.tweet,
  }));
}

export async function addBookmark(userId: number, tweetId: number, note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already bookmarked
  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.tweetId, tweetId)))
    .limit(1);

  if (existing.length > 0) {
    // Update note if provided
    if (note !== undefined) {
      await db.update(bookmarks).set({ note }).where(eq(bookmarks.id, existing[0].id));
    }
    return existing[0].id;
  }

  // Insert new bookmark
  const result = await db.insert(bookmarks).values({
    userId,
    tweetId,
    note: note || null,
  });
  return result[0].insertId;
}

export async function removeBookmark(userId: number, tweetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(bookmarks).where(
    and(eq(bookmarks.userId, userId), eq(bookmarks.tweetId, tweetId))
  );
}

export async function isBookmarked(userId: number, tweetId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.tweetId, tweetId)))
    .limit(1);

  return result.length > 0;
}

// ==================== Scheduled Posts ====================

export async function getScheduledPosts(userId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scheduledPosts).orderBy(desc(scheduledPosts.createdAt));
}

export async function getScheduledPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createScheduledPost(data: InsertScheduledPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(scheduledPosts).values(data);
}

export async function updateScheduledPost(id: number, data: Partial<InsertScheduledPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(scheduledPosts).set(data).where(eq(scheduledPosts.id, id));
}

export async function deleteScheduledPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
}

export async function getActiveSchedules() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scheduledPosts).where(eq(scheduledPosts.isActive, 1));
}

// ==================== Sent Posts ====================

export async function insertSentPost(data: InsertSentPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(sentPosts).values(data);
}

export async function getLastSentPost(scheduleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(sentPosts)
    .where(eq(sentPosts.scheduleId, scheduleId))
    .orderBy(desc(sentPosts.sentAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getSentPostsInWindow(scheduleId: number, hours: number) {
  const db = await getDb();
  if (!db) return [];
  
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await db
    .select()
    .from(sentPosts)
    .where(
      and(
        eq(sentPosts.scheduleId, scheduleId),
        gte(sentPosts.sentAt, cutoff)
      )
    );
}

export async function recordSentPost(data: {
  scheduleId: number;
  executionId?: string;
  tweetId: string;
  url: string;
  text: string;
  createdAt: Date;
  authorHandle: string;
  authorName?: string;
  authorVerified: boolean;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number;
  mediaUrls?: any;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record sent post: database not available");
    return;
  }
  
  try {
    await db.insert(sentPosts).values({
      scheduleId: data.scheduleId,
      executionId: data.executionId,
      tweetId: data.tweetId,
      sentAt: new Date(),
      url: data.url,
      text: data.text,
      createdAt: data.createdAt,
      authorHandle: data.authorHandle,
      authorName: data.authorName,
      authorVerified: data.authorVerified,
      likeCount: data.likeCount,
      retweetCount: data.retweetCount,
      replyCount: data.replyCount,
      viewCount: data.viewCount,
      mediaUrls: data.mediaUrls,
    });
  } catch (error) {
    console.error("[Database] Failed to record sent post:", error);
    throw error;
  }
}

export async function getSentTweets(scheduleId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sent tweets: database not available");
    return [];
  }
  
  try {
    let query = db.select().from(sentPosts);
    
    if (scheduleId) {
      query = query.where(eq(sentPosts.scheduleId, scheduleId)) as any;
    }
    
    const result = await query.orderBy(desc(sentPosts.sentAt)).limit(200);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get sent tweets:", error);
    return [];
  }
}

export async function deleteSentTweetsByExecution(executionId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete sent tweets: database not available");
    return;
  }
  
  try {
    await db.delete(sentPosts).where(eq(sentPosts.executionId, executionId));
  } catch (error) {
    console.error("[Database] Failed to delete sent tweets by execution:", error);
    throw error;
  }
}

export async function getRecentSentTweetIds(scheduleId: number, hours: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recent sent tweets: database not available");
    return [];
  }
  
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  try {
    const result = await db
      .select({ tweetId: sentPosts.tweetId })
      .from(sentPosts)
      .where(
        and(
          eq(sentPosts.scheduleId, scheduleId),
          gte(sentPosts.sentAt, cutoff)
        )
      );
    
    return result.map(r => r.tweetId);
  } catch (error) {
    console.error("[Database] Failed to get recent sent tweets:", error);
    return [];
  }
}


export async function clearAllSentTweets(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear sent tweets: database not available");
    return;
  }
  
  try {
    // Get all schedules for this user
    const userSchedules = await db.select({ id: scheduledPosts.id }).from(scheduledPosts).where(eq(scheduledPosts.userId, userId));
    const scheduleIds = userSchedules.map(s => s.id);
    
    if (scheduleIds.length > 0) {
      // Delete all sent tweets for these schedules
      await db.delete(sentPosts).where(
        scheduleIds.length === 1 
          ? eq(sentPosts.scheduleId, scheduleIds[0])
          : sql`${sentPosts.scheduleId} IN (${sql.join(scheduleIds.map(id => sql`${id}`), sql`, `)})`
      );
    }
  } catch (error) {
    console.error("[Database] Failed to clear all sent tweets:", error);
    throw error;
  }
}
