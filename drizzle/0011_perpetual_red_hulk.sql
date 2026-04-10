CREATE TABLE `submissionNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissionNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `submissionNotes` ADD CONSTRAINT `submissionNotes_submissionId_testSubmissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `testSubmissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissionNotes` ADD CONSTRAINT `submissionNotes_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;