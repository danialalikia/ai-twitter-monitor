ALTER TABLE `settings` ADD `aiRewriteEnabled` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `settings` ADD `aiRewritePrompt` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `telegramTemplate` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `includeStats` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `settings` ADD `includeLink` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `settings` ADD `includeAuthor` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `settings` ADD `includeMedia` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `settings` ADD `includeDate` int DEFAULT 0;