ALTER TABLE `fetchSettings` ADD `aiRewriteEnabled` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `aiRewritePrompt` text;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `telegramTemplate` text;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `includeStats` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `includeLink` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `includeAuthor` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `includeMedia` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `fetchSettings` ADD `includeDate` int DEFAULT 0;