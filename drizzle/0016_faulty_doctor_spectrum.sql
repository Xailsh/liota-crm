CREATE TABLE `dripEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sequenceId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`currentStepIndex` int NOT NULL DEFAULT 0,
	`status` enum('active','completed','paused','unsubscribed') NOT NULL DEFAULT 'active',
	`nextSendAt` timestamp,
	`completedAt` timestamp,
	`leadEmail` varchar(255) NOT NULL,
	`leadName` varchar(255) NOT NULL,
	CONSTRAINT `dripEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dripSequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dripSequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dripSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`dayOffset` int NOT NULL DEFAULT 0,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dripSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leadFormSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(50),
	`interestedProgram` varchar(100),
	`preferredCampus` varchar(100),
	`hearAboutUs` varchar(200),
	`source` varchar(100) DEFAULT 'website_form',
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leadFormSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dripEnrollments` ADD CONSTRAINT `dripEnrollments_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dripEnrollments` ADD CONSTRAINT `dripEnrollments_sequenceId_dripSequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `dripSequences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dripSteps` ADD CONSTRAINT `dripSteps_sequenceId_dripSequences_id_fk` FOREIGN KEY (`sequenceId`) REFERENCES `dripSequences`(`id`) ON DELETE cascade ON UPDATE no action;