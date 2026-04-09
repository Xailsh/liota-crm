CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`assessmentDate` date NOT NULL,
	`mcerLevel` enum('A1','A2','B1','B2','C1','C2') NOT NULL,
	`speakingScore` int,
	`listeningScore` int,
	`readingScore` int,
	`writingScore` int,
	`overallScore` int,
	`notes` text,
	`assessedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`sessionDate` date NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`subject` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`templateType` enum('promotion','reminder','newsletter','welcome','progress_report') DEFAULT 'newsletter',
	`segmentProgram` enum('children','teens','adults','business','polyglot','immersion','homeschool','all') DEFAULT 'all',
	`segmentCampus` enum('merida','dallas','denver','vienna','online','all') DEFAULT 'all',
	`segmentAgeGroup` enum('children','teens','adults','all') DEFAULT 'all',
	`status` enum('draft','scheduled','sent','cancelled') NOT NULL DEFAULT 'draft',
	`recipientCount` int DEFAULT 0,
	`openCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','dropped','completed') NOT NULL DEFAULT 'active',
	CONSTRAINT `classEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`programId` int,
	`instructorId` int,
	`campus` enum('merida','dallas','denver','vienna','online') NOT NULL,
	`modality` enum('online','onsite') DEFAULT 'onsite',
	`maxStudents` int DEFAULT 6,
	`currentStudents` int DEFAULT 0,
	`schedule` text,
	`startDate` date,
	`endDate` date,
	`status` enum('scheduled','active','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`type` enum('email','phone','whatsapp','meeting','note') NOT NULL DEFAULT 'note',
	`subject` varchar(256),
	`content` text,
	`direction` enum('inbound','outbound') DEFAULT 'outbound',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('parent','student','lead','partner') NOT NULL DEFAULT 'parent',
	`firstName` varchar(64) NOT NULL,
	`lastName` varchar(64) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`relatedStudentId` int,
	`notes` text,
	`tags` text,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(64) NOT NULL,
	`description` text,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(8) DEFAULT 'USD',
	`campus` enum('merida','dallas','denver','vienna','online','general') DEFAULT 'general',
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`campus` enum('merida','dallas','denver','vienna','online') NOT NULL,
	`specialization` varchar(128),
	`certifications` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instructors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(64) NOT NULL,
	`lastName` varchar(64) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`ageGroup` enum('children','teens','adults'),
	`interestedProgram` enum('children','teens','adults','business','polyglot','immersion','homeschool'),
	`preferredCampus` enum('merida','dallas','denver','vienna','online'),
	`stage` enum('new_lead','contacted','trial_scheduled','trial_done','proposal_sent','enrolled','lost') NOT NULL DEFAULT 'new_lead',
	`source` varchar(64),
	`notes` text,
	`trialDate` date,
	`assignedTo` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`programId` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(8) DEFAULT 'USD',
	`method` enum('paypal','card','cash','transfer') NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`description` text,
	`invoiceNumber` varchar(32),
	`paidAt` timestamp,
	`dueDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('children','teens','adults','business','polyglot','immersion','homeschool') NOT NULL,
	`description` text,
	`durationHours` int,
	`priceUsd` decimal(10,2),
	`maxStudents` int DEFAULT 6,
	`modality` enum('online','onsite','hybrid') DEFAULT 'hybrid',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(64) NOT NULL,
	`lastName` varchar(64) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`dateOfBirth` date,
	`ageGroup` enum('children','teens','adults') NOT NULL,
	`programId` int,
	`campus` enum('merida','dallas','denver','vienna','online') NOT NULL,
	`mcerLevel` enum('A1','A2','B1','B2','C1','C2'),
	`enrollmentStatus` enum('active','inactive','trial','graduated','suspended') NOT NULL DEFAULT 'trial',
	`parentName` varchar(128),
	`parentEmail` varchar(320),
	`parentPhone` varchar(32),
	`notes` text,
	`tags` text,
	`enrolledAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
