import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, json, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Fetch settings table for storing user's Apify actor parameters
 */
export const fetchSettings = mysqlTable("fetchSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Setting preset name
  
  // Search parameters
  searchTerms: text("searchTerms"), // JSON array
  twitterContent: text("twitterContent"),
  queryType: varchar("queryType", { length: 20 }).default("Latest"),
  maxItems: int("maxItems").default(200),
  lang: varchar("lang", { length: 10 }).default("en"),
  
  // User filters
  fromUser: varchar("fromUser", { length: 255 }),
  toUser: varchar("toUser", { length: 255 }),
  mentionUser: varchar("mentionUser", { length: 255 }),
  
  // Time filters
  since: varchar("since", { length: 100 }),
  until: varchar("until", { length: 100 }),
  withinTime: varchar("withinTime", { length: 50 }),
  
  // Engagement filters
  minRetweets: int("minRetweets").default(0),
  minFaves: int("minFaves").default(0),
  minReplies: int("minReplies").default(0),
  
  // Content type filters
  filterMedia: int("filterMedia").default(0), // boolean as int
  filterImages: int("filterImages").default(0),
  filterVideos: int("filterVideos").default(0),
  filterLinks: int("filterLinks").default(0),
  filterVerified: int("filterVerified").default(0),
  filterSafe: int("filterSafe").default(0),
  
  // Location filters
  near: varchar("near", { length: 255 }),
  within: varchar("within", { length: 50 }),
  geocode: varchar("geocode", { length: 255 }),
  
  // Other filters
  filterReplies: int("filterReplies").default(0),
  filterQuote: int("filterQuote").default(0),
  filterNativeRetweets: int("filterNativeRetweets").default(0),
  
  // AI Rewrite Settings
  aiRewriteEnabled: int("aiRewriteEnabled").default(0),
  aiRewritePrompt: text("aiRewritePrompt"),
  
  // Telegram Template Settings
  telegramTemplate: text("telegramTemplate"),
  
  // Include/Exclude Options for Telegram
  includeStats: int("includeStats").default(1),
  includeLink: int("includeLink").default(1),
  includeAuthor: int("includeAuthor").default(1),
  includeMedia: int("includeMedia").default(1),
  includeDate: int("includeDate").default(0),
  
  isDefault: int("isDefault").default(0), // Mark as default preset
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FetchSetting = typeof fetchSettings.$inferSelect;
export type InsertFetchSetting = typeof fetchSettings.$inferInsert;

/**
 * Settings table - stores user configuration
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  apifyToken: text("apifyToken"),
  telegramBotToken: text("telegramBotToken"),
  telegramChatId: text("telegramChatId"),
  telegramOwnerId: varchar("telegramOwnerId", { length: 64 }), // Telegram user ID of the owner
  ownerEmails: text("ownerEmails"), // Comma-separated list of owner emails for desktop access
  keywords: text("keywords").notNull(),
  scheduleTime: varchar("scheduleTime", { length: 5 }).notNull().default("08:00"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  maxItemsPerRun: int("maxItemsPerRun").notNull().default(200),
  
  // AI Rewrite Settings (OpenRouter)
  aiRewriteEnabled: int("aiRewriteEnabled").default(0),
  aiRewritePrompt: text("aiRewritePrompt"),
  openRouterApiKey: text("openRouterApiKey"),
  aiModel: varchar("aiModel", { length: 100 }).default("openai/gpt-4o"),
  temperature: varchar("temperature", { length: 10 }).default("0.7"),
  maxTokens: int("maxTokens").default(500),
  topP: varchar("topP", { length: 10 }).default("0.9"),
  
  // Telegram Template Settings
  telegramTemplate: text("telegramTemplate"),
  
  // Include/Exclude Options for Telegram
  includeStats: int("includeStats").default(1),
  includeLink: int("includeLink").default(1),
  includeAuthor: int("includeAuthor").default(1),
  includeMedia: int("includeMedia").default(1),
  includeDate: int("includeDate").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

/**
 * Fetch runs table - tracks each execution of the Apify actor
 */
export const runs = mysqlTable("runs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  runId: varchar("runId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "running", "success", "failed"]).notNull().default("pending"),
  totalItems: int("totalItems").notNull().default(0),
  errorMessage: text("errorMessage"),
  triggeredBy: mysqlEnum("triggeredBy", ["manual", "scheduled", "telegram"]).notNull().default("manual"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Run = typeof runs.$inferSelect;
export type InsertRun = typeof runs.$inferInsert;

/**
 * Tweets table - stores fetched and processed tweets with full metadata
 */
export const tweets = mysqlTable("tweets", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  
  // Twitter core fields
  tweetId: varchar("tweetId", { length: 64 }).notNull(),
  url: text("url").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  language: varchar("language", { length: 10 }),
  
  // Author fields
  authorHandle: varchar("authorHandle", { length: 255 }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  authorProfileUrl: text("authorProfileUrl"),
  authorProfileImageUrl: text("authorProfileImageUrl"),
  authorCoverPhoto: text("authorCoverPhoto"),
  authorFollowersCount: int("authorFollowersCount").notNull().default(0),
  authorFollowingCount: int("authorFollowingCount").notNull().default(0),
  authorVerified: boolean("authorVerified").notNull().default(false),
  authorDescription: text("authorDescription"),
  authorJobTitle: text("authorJobTitle"),
  authorLocation: text("authorLocation"),
  authorWebsite: text("authorWebsite"),
  authorJoinDate: text("authorJoinDate"),
  authorTweetsCount: int("authorTweetsCount").notNull().default(0),
  
  // Tweet type flags
  isRetweet: boolean("isRetweet").notNull().default(false),
  retweetedAuthorHandle: varchar("retweetedAuthorHandle", { length: 255 }),
  retweetedAuthorName: varchar("retweetedAuthorName", { length: 255 }),
  
  // Engagement metrics
  replyCount: int("replyCount").notNull().default(0),
  retweetCount: int("retweetCount").notNull().default(0),
  quoteCount: int("quoteCount").notNull().default(0),
  likeCount: int("likeCount").notNull().default(0),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  
  // Media and references
  mediaUrls: json("mediaUrls").$type<Array<{type: 'photo'|'video', url: string, thumbnail?: string}>>(),
  mediaType: varchar("mediaType", { length: 50 }),
  quotedStatusId: varchar("quotedStatusId", { length: 64 }),
  inReplyToStatusId: varchar("inReplyToStatusId", { length: 64 }),
  
  // Extracted entities
  hashtags: json("hashtags").$type<string[]>(),
  mentions: json("mentions").$type<string[]>(),
  urls: json("urls").$type<string[]>(),
  
  // Computed fields
  trendScore: int("trendScore").notNull().default(0),
  categories: json("categories").$type<string[]>(),
  
  // Raw data from Apify
  rawData: json("rawData"),
  
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
});

export type Tweet = typeof tweets.$inferSelect;
export type InsertTweet = typeof tweets.$inferInsert;

/**
 * Ignored tweets table - user can mark tweets to ignore in future runs
 */
export const ignoredTweets = mysqlTable("ignoredTweets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tweetId: varchar("tweetId", { length: 64 }).notNull(),
  tweetUrl: text("tweetUrl"),
  ignoredAt: timestamp("ignoredAt").defaultNow().notNull(),
});

export type IgnoredTweet = typeof ignoredTweets.$inferSelect;
export type InsertIgnoredTweet = typeof ignoredTweets.$inferInsert;

/**
 * Bookmarks table - user can save favorite tweets
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tweetId: int("tweetId").notNull(), // References tweets.id
  note: text("note"), // Optional user note
  bookmarkedAt: timestamp("bookmarkedAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Saved tweets table - permanent copy of bookmarked tweets
 * This table stores the full tweet data so bookmarked tweets persist across fetches
 */
export const savedTweets = mysqlTable("savedTweets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Twitter core fields (copied from tweets table)
  tweetId: varchar("tweetId", { length: 64 }).notNull(),
  url: text("url").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  language: varchar("language", { length: 10 }),
  
  // Author fields
  authorHandle: varchar("authorHandle", { length: 255 }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  authorProfileUrl: text("authorProfileUrl"),
  authorProfileImageUrl: text("authorProfileImageUrl"),
  authorVerified: boolean("authorVerified").notNull().default(false),
  
  // Engagement metrics
  likeCount: int("likeCount").notNull().default(0),
  retweetCount: int("retweetCount").notNull().default(0),
  replyCount: int("replyCount").notNull().default(0),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  
  // Media
  mediaUrls: json("mediaUrls").$type<Array<{type: 'photo'|'video', url: string, thumbnail?: string}>>(),
  mediaType: varchar("mediaType", { length: 50 }),
  
  // Metadata
  categories: json("categories").$type<string[]>(),
  trendScore: int("trendScore").default(0),
  
  // Retweet info
  retweetedAuthorHandle: varchar("retweetedAuthorHandle", { length: 255 }),
  retweetedAuthorName: varchar("retweetedAuthorName", { length: 255 }),
  
  // User note
  note: text("note"),
  
  // Timestamps
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedTweet = typeof savedTweets.$inferSelect;
export type InsertSavedTweet = typeof savedTweets.$inferInsert;

/**
 * Scheduled posts table - for automatic posting to Telegram
 */
export const scheduledPosts = mysqlTable("scheduledPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Preset name
  isActive: int("isActive").default(1).notNull(), // 1=active, 0=inactive
  
  // Schedule settings
  scheduleType: mysqlEnum("scheduleType", ["daily", "weekly", "custom"]).notNull().default("daily"),
  scheduleTimes: json("scheduleTimes").$type<string[]>(), // ["08:00", "14:00", "20:00"] Tehran time
  weekDays: json("weekDays").$type<number[]>(), // [0,1,2,3,4,5,6] for weekly (0=Sunday)
  timezone: varchar("timezone", { length: 64 }).default("Asia/Tehran").notNull(),
  
  // Content settings
  postsPerRun: int("postsPerRun").default(5).notNull(),
  sortBy: mysqlEnum("sortBy", ["trending", "likes", "retweets", "views", "latest"]).default("trending").notNull(),
  
  // Content mix (percentages)
  contentMix: json("contentMix").$type<{
    text: number;
    images: number;
    videos: number;
  }>(),
  
  // Duplicate prevention
  preventDuplicates: int("preventDuplicates").default(1).notNull(),
  duplicateTimeWindow: int("duplicateTimeWindow").default(24).notNull(), // hours
  
  // Search filters (same as Advanced Fetch)
  keywords: text("keywords"), // comma-separated
  queryType: varchar("queryType", { length: 20 }).default("Latest"),
  maxItems: int("maxItems").default(200),
  lang: varchar("lang", { length: 10 }).default("en"),
  
  // Engagement filters
  minLikes: int("minLikes"),
  minRetweets: int("minRetweets"),
  minReplies: int("minReplies"),
  minViews: int("minViews"),
  
  // Content filters
  hasImages: int("hasImages").default(0),
  hasVideos: int("hasVideos").default(0),
  hasLinks: int("hasLinks").default(0),
  verifiedOnly: int("verifiedOnly").default(0),
  safeOnly: int("safeOnly").default(0),
  
  // Time filters (Advanced)
  since: varchar("since", { length: 64 }),
  until: varchar("until", { length: 64 }),
  withinTime: varchar("withinTime", { length: 20 }),
  
  // User filters (Advanced)
  fromUser: varchar("fromUser", { length: 255 }),
  toUser: varchar("toUser", { length: 255 }),
  mentionUser: varchar("mentionUser", { length: 255 }),
  
  // Telegram settings
  useAiTranslation: int("useAiTranslation").default(0).notNull(),
  telegramTemplate: text("telegramTemplate"), // Template with placeholders
  
  // Execution tracking
  lastRunAt: timestamp("lastRunAt"),
  lastExecutionMinute: varchar("lastExecutionMinute", { length: 5 }), // "HH:MM" to prevent duplicate runs in same minute
  nextRunAt: timestamp("nextRunAt"),
  totalSent: int("totalSent").default(0).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;

/**
 * Execution locks table - prevents concurrent execution of same schedule
 * Uses UNIQUE constraint for atomic lock acquisition
 */
export const executionLocks = mysqlTable("execution_locks", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  executionMinute: varchar("executionMinute", { length: 5 }).notNull(), // "HH:MM"
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
}, (table) => ({
  // UNIQUE constraint ensures only one lock per schedule per minute
  uniqueLock: unique().on(table.scheduleId, table.executionMinute),
}));

export type ExecutionLock = typeof executionLocks.$inferSelect;
export type InsertExecutionLock = typeof executionLocks.$inferInsert;

/**
 * Sent posts tracking table - stores sent tweets with full data for history
 */
export const sentPosts = mysqlTable("sent_posts", {
  id: int("id").autoincrement().primaryKey(),
  scheduleId: int("scheduleId").notNull(),
  executionId: varchar("executionId", { length: 64 }), // Group posts by execution run
  tweetId: varchar("tweetId", { length: 64 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  
  // Tweet data (same as tweets table)
  url: text("url").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  
  // Author fields
  authorHandle: varchar("authorHandle", { length: 255 }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  authorVerified: boolean("authorVerified").notNull().default(false),
  
  // Engagement metrics
  likeCount: int("likeCount").notNull().default(0),
  retweetCount: int("retweetCount").notNull().default(0),
  replyCount: int("replyCount").notNull().default(0),
  viewCount: bigint("viewCount", { mode: "number" }).default(0),
  
  // Media
  mediaUrls: json("mediaUrls").$type<Array<{type: 'photo'|'video', url: string, thumbnail?: string}>>(),
});

export type SentPost = typeof sentPosts.$inferSelect;
export type InsertSentPost = typeof sentPosts.$inferInsert;
