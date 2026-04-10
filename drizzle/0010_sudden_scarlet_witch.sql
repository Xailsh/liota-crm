CREATE TABLE `placementTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`version` varchar(64) NOT NULL DEFAULT 'v1',
	`targetLevel` enum('A1','A2','B1','B2','C1','C2','mixed') NOT NULL DEFAULT 'mixed',
	`durationMinutes` int NOT NULL DEFAULT 30,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `placementTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`questionText` text NOT NULL,
	`options` text NOT NULL,
	`correctAnswer` varchar(512) NOT NULL,
	`points` int NOT NULL DEFAULT 1,
	`skill` enum('grammar','vocabulary','reading','listening','writing') NOT NULL DEFAULT 'grammar',
	`cefrLevel` enum('A1','A2','B1','B2','C1','C2') NOT NULL DEFAULT 'A1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`testId` int NOT NULL,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`intervalMonths` int DEFAULT 1,
	`scheduledAt` timestamp NOT NULL,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`status` enum('active','paused','completed','cancelled') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testId` int NOT NULL,
	`studentId` int,
	`recipientEmail` varchar(320),
	`recipientName` varchar(256),
	`token` varchar(128) NOT NULL,
	`status` enum('pending','in_progress','completed','expired') NOT NULL DEFAULT 'pending',
	`score` int,
	`maxScore` int,
	`percentScore` int,
	`cefrResult` enum('A1','A2','B1','B2','C1','C2'),
	`answers` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`expiresAt` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `testSubmissions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `testQuestions` ADD CONSTRAINT `testQuestions_testId_placementTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `placementTests`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testSchedules` ADD CONSTRAINT `testSchedules_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testSchedules` ADD CONSTRAINT `testSchedules_testId_placementTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `placementTests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testSubmissions` ADD CONSTRAINT `testSubmissions_testId_placementTests_id_fk` FOREIGN KEY (`testId`) REFERENCES `placementTests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testSubmissions` ADD CONSTRAINT `testSubmissions_studentId_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE no action ON UPDATE no action;