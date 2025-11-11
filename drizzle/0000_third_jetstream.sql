CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `ignoredTweets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tweetId` varchar(64) NOT NULL,
	`tweetUrl` text,
	`ignoredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ignoredTweets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`runId` varchar(255),
	`status` enum('pending','running','success','failed') NOT NULL DEFAULT 'pending',
	`totalItems` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`triggeredBy` enum('manual','scheduled','telegram') NOT NULL DEFAULT 'manual',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`apifyToken` text,
	`telegramBotToken` text,
	`telegramChatId` text,
	`keywords` text NOT NULL,
	`scheduleTime` varchar(5) NOT NULL DEFAULT '08:00',
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`maxItemsPerRun` int NOT NULL DEFAULT 200,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tweets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`tweetId` varchar(64) NOT NULL,
	`url` text NOT NULL,
	`text` text NOT NULL,
	`createdAt` timestamp NOT NULL,
	`language` varchar(10),
	`authorHandle` varchar(255) NOT NULL,
	`authorName` varchar(255),
	`authorProfileUrl` text,
	`authorFollowersCount` int NOT NULL DEFAULT 0,
	`authorVerified` boolean NOT NULL DEFAULT false,
	`authorDescription` text,
	`replyCount` int NOT NULL DEFAULT 0,
	`retweetCount` int NOT NULL DEFAULT 0,
	`quoteCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`viewCount` bigint DEFAULT 0,
	`impressions` bigint DEFAULT 0,
	`mediaUrls` json,
	`mediaType` varchar(50),
	`quotedStatusId` varchar(64),
	`inReplyToStatusId` varchar(64),
	`hashtags` json,
	`mentions` json,
	`urls` json,
	`trendScore` int NOT NULL DEFAULT 0,
	`categories` json,
	`rawData` json,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tweets_id` PRIMARY KEY(`id`)
);
