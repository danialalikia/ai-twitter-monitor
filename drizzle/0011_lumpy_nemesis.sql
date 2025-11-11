ALTER TABLE `scheduledPosts` ADD `maxItems` int DEFAULT 200;--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `lang` varchar(10) DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `minReplies` int;--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `safeOnly` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `since` varchar(64);--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `until` varchar(64);--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `withinTime` varchar(20);--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `fromUser` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `toUser` varchar(255);--> statement-breakpoint
ALTER TABLE `scheduledPosts` ADD `mentionUser` varchar(255);