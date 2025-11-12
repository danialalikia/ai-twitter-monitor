CREATE TABLE `voiceJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referenceAudioUrl` text NOT NULL,
	`inputAudioUrl` text NOT NULL,
	`outputAudioUrl` text,
	`pitchShift` int DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `voiceJobs_id` PRIMARY KEY(`id`)
);
