CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` enum('info','warning','error','critical') NOT NULL DEFAULT 'error',
	`source` varchar(128) NOT NULL,
	`message` text NOT NULL,
	`stackTrace` text,
	`context` text,
	`resolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`resolvedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inboundWebhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`source` enum('meta','whatsapp','stripe','zapier','make','custom') NOT NULL,
	`endpointToken` varchar(128) NOT NULL,
	`isActive` boolean DEFAULT true,
	`description` text,
	`lastReceivedAt` timestamp,
	`totalReceived` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inboundWebhooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `inboundWebhooks_endpointToken_unique` UNIQUE(`endpointToken`)
);
--> statement-breakpoint
CREATE TABLE `syncJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('meta_leads','email_sync','payment_sync','student_sync','calendar_sync','whatsapp_sync') NOT NULL,
	`status` enum('idle','running','completed','failed','paused') NOT NULL DEFAULT 'idle',
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`recordsProcessed` int DEFAULT 0,
	`recordsFailed` int DEFAULT 0,
	`errorMessage` text,
	`config` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `syncJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `voiceTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` enum('reminder','welcome','payment_due','class_cancelled','promotion','follow_up','emergency','other') NOT NULL,
	`language` enum('en','es','both') NOT NULL DEFAULT 'en',
	`scriptText` text NOT NULL,
	`duration` int,
	`voiceType` enum('male','female','neutral') DEFAULT 'neutral',
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `voiceTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(64) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`payload` text,
	`status` enum('received','processing','processed','failed','ignored') NOT NULL DEFAULT 'received',
	`errorMessage` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsappTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`category` enum('marketing','utility','authentication','reminder','welcome','follow_up','payment','progress_report') NOT NULL,
	`language` enum('en','es','both') NOT NULL DEFAULT 'en',
	`headerText` varchar(256),
	`bodyText` text NOT NULL,
	`footerText` varchar(256),
	`buttonType` enum('none','quick_reply','call_to_action') DEFAULT 'none',
	`buttons` text,
	`variables` text,
	`status` enum('draft','pending_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsappTemplates_id` PRIMARY KEY(`id`)
);
