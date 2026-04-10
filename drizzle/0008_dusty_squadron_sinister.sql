CREATE TABLE `metaLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` varchar(128) NOT NULL,
	`leadId` varchar(128) NOT NULL,
	`fullName` varchar(256),
	`email` varchar(320),
	`phone` varchar(64),
	`source` varchar(128) DEFAULT 'meta_lead_form',
	`status` enum('new','contacted','enrolled','lost') NOT NULL DEFAULT 'new',
	`rawData` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metaLeads_id` PRIMARY KEY(`id`),
	CONSTRAINT `metaLeads_leadId_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `outreachMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channel` enum('email','whatsapp','sms') NOT NULL,
	`recipientName` varchar(256),
	`recipientEmail` varchar(320),
	`recipientPhone` varchar(64),
	`subject` varchar(512),
	`body` text,
	`templateId` int,
	`status` enum('pending','sent','failed','delivered') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`campaignId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outreachMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('email','whatsapp','meta','instagram','tiktok','youtube','x','linkedin') NOT NULL,
	`handle` varchar(256),
	`appId` varchar(256),
	`appSecret` varchar(512),
	`accessToken` text,
	`refreshToken` text,
	`pageId` varchar(128),
	`phoneNumberId` varchar(128),
	`webhookVerifyToken` varchar(256),
	`status` enum('connected','disconnected','error','pending') NOT NULL DEFAULT 'disconnected',
	`lastVerifiedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialCredentials_id` PRIMARY KEY(`id`)
);
