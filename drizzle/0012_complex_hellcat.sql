CREATE TABLE `guideVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionKey` varchar(100) NOT NULL,
	`youtubeUrl` varchar(500),
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guideVideos_id` PRIMARY KEY(`id`),
	CONSTRAINT `guideVideos_sectionKey_unique` UNIQUE(`sectionKey`)
);
--> statement-breakpoint
ALTER TABLE `testSubmissions` ADD `certificateUrl` text;--> statement-breakpoint
ALTER TABLE `guideVideos` ADD CONSTRAINT `guideVideos_updatedBy_users_id_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;