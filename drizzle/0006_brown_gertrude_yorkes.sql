CREATE TABLE `recurringBills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`category` enum('rent','utilities','software','payroll','insurance','marketing','supplies','taxes','subscriptions','maintenance','other') NOT NULL DEFAULT 'other',
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`campus` varchar(64) NOT NULL DEFAULT 'all',
	`frequency` enum('monthly','quarterly','annually','one_time') NOT NULL DEFAULT 'monthly',
	`dueDayOfMonth` int NOT NULL,
	`nextDueDate` timestamp NOT NULL,
	`lastPaidDate` timestamp,
	`status` enum('active','paid','overdue','disabled') NOT NULL DEFAULT 'active',
	`notes` text,
	`vendor` varchar(256),
	`isPreset` boolean DEFAULT false,
	`remindersEnabled` boolean DEFAULT true,
	`reminder7Sent` boolean DEFAULT false,
	`reminder3Sent` boolean DEFAULT false,
	`reminder1Sent` boolean DEFAULT false,
	`reminderOverdueSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringBills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `campaigns` MODIFY COLUMN `segmentCampus` enum('merida','dallas','denver','vienna','nottingham','online','all') DEFAULT 'all';--> statement-breakpoint
ALTER TABLE `camps` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online','all') NOT NULL;--> statement-breakpoint
ALTER TABLE `classes` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online') NOT NULL;--> statement-breakpoint
ALTER TABLE `expenses` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online','general') DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `instructors` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online') NOT NULL;--> statement-breakpoint
ALTER TABLE `languagePackages` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online','all') DEFAULT 'all';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `preferredCampus` enum('merida','dallas','denver','vienna','nottingham','online');--> statement-breakpoint
ALTER TABLE `specialEvents` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online','all') NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `campus` enum('merida','dallas','denver','vienna','nottingham','online') NOT NULL;