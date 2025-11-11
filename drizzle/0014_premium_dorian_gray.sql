CREATE TABLE `execution_locks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleId` int NOT NULL,
	`executionMinute` varchar(5) NOT NULL,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `execution_locks_id` PRIMARY KEY(`id`),
	CONSTRAINT `execution_locks_scheduleId_executionMinute_unique` UNIQUE(`scheduleId`,`executionMinute`)
);
