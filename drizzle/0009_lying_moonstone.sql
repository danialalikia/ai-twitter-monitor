CREATE TABLE `savedTweets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tweetId` varchar(64) NOT NULL,
	`url` text NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL,
	`language` varchar(10),
	`authorHandle` varchar(255) NOT NULL,
	`authorName` varchar(255),
	`authorProfileUrl` text,
	`authorProfileImageUrl` text,
	`authorVerified` boolean NOT NULL DEFAULT false,
	`likeCount` int NOT NULL DEFAULT 0,
	`retweetCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`viewCount` bigint DEFAULT 0,
	`mediaUrls` json,
	`mediaType` varchar(50),
	`categories` json,
	`trendScore` int DEFAULT 0,
	`retweetedAuthorHandle` varchar(255),
	`retweetedAuthorName` varchar(255),
	`note` text,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedTweets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`scheduleType` enum('daily','weekly','custom') NOT NULL DEFAULT 'daily',
	`scheduleTimes` json,
	`weekDays` json,
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Tehran',
	`postsPerRun` int NOT NULL DEFAULT 5,
	`sortBy` enum('trending','likes','retweets','views','latest') NOT NULL DEFAULT 'trending',
	`contentMix` json,
	`preventDuplicates` int NOT NULL DEFAULT 1,
	`duplicateTimeWindow` int NOT NULL DEFAULT 24,
	`keywords` text,
	`queryType` varchar(20) DEFAULT 'Latest',
	`minLikes` int,
	`minRetweets` int,
	`minViews` int,
	`hasImages` int DEFAULT 0,
	`hasVideos` int DEFAULT 0,
	`hasLinks` int DEFAULT 0,
	`verifiedOnly` int DEFAULT 0,
	`useAiTranslation` int NOT NULL DEFAULT 0,
	`telegramTemplate` text,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`totalSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sent_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`tweetId` varchar(64) NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`url` text NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL,
	`authorHandle` varchar(255) NOT NULL,
	`authorName` varchar(255),
	`authorVerified` boolean NOT NULL DEFAULT false,
	`likeCount` int NOT NULL DEFAULT 0,
	`retweetCount` int NOT NULL DEFAULT 0,
	`replyCount` int NOT NULL DEFAULT 0,
	`viewCount` bigint DEFAULT 0,
	`mediaUrls` json,
	CONSTRAINT `sent_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `settings` ADD `telegramOwnerId` varchar(64);--> statement-breakpoint
ALTER TABLE `settings` ADD `openRouterApiKey` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `aiModel` varchar(100) DEFAULT 'openai/gpt-4o';--> statement-breakpoint
ALTER TABLE `settings` ADD `temperature` varchar(10) DEFAULT '0.7';--> statement-breakpoint
ALTER TABLE `settings` ADD `maxTokens` int DEFAULT 500;--> statement-breakpoint
ALTER TABLE `settings` ADD `topP` varchar(10) DEFAULT '0.9';--> statement-breakpoint
ALTER TABLE `tweets` ADD `isRetweet` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tweets` ADD `retweetedAuthorHandle` varchar(255);--> statement-breakpoint
ALTER TABLE `tweets` ADD `retweetedAuthorName` varchar(255);