CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tweetId` int NOT NULL,
	`note` text,
	`bookmarkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tweets` ADD `authorProfileImageUrl` text;--> statement-breakpoint
ALTER TABLE `tweets` ADD `authorFollowingCount` int DEFAULT 0 NOT NULL;