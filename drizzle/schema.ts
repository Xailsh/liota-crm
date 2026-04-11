import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
} from "drizzle-orm/mysql-core";

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 256 }),
  googleId: varchar("googleId", { length: 128 }),
  avatarUrl: text("avatarUrl"),
  role: mysqlEnum("role", ["user", "admin", "instructor", "coordinator", "receptionist", "sales", "marketing", "finance"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Instructors ─────────────────────────────────────────────────────────────
export const instructors = mysqlTable("instructors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online"]).notNull(),
  specialization: varchar("specialization", { length: 128 }),
  certifications: text("certifications"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Instructor = typeof instructors.$inferSelect;

// ─── Programs ────────────────────────────────────────────────────────────────
export const programs = mysqlTable("programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["children", "teens", "adults", "business", "polyglot", "immersion", "homeschool"]).notNull(),
  description: text("description"),
  durationHours: int("durationHours"),
  priceUsd: decimal("priceUsd", { precision: 10, scale: 2 }),
  maxStudents: int("maxStudents").default(6),
  modality: mysqlEnum("modality", ["online", "onsite", "hybrid"]).default("hybrid"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Program = typeof programs.$inferSelect;

// ─── Students ────────────────────────────────────────────────────────────────
export const students = mysqlTable("students", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 64 }).notNull(),
  lastName: varchar("lastName", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  dateOfBirth: date("dateOfBirth"),
  ageGroup: mysqlEnum("ageGroup", ["children", "teens", "adults"]).notNull(),
  programId: int("programId"),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online"]).notNull(),
  mcerLevel: mysqlEnum("mcerLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]),
  enrollmentStatus: mysqlEnum("enrollmentStatus", ["active", "inactive", "trial", "graduated", "suspended"]).default("trial").notNull(),
  parentName: varchar("parentName", { length: 128 }),
  parentEmail: varchar("parentEmail", { length: 320 }),
  parentPhone: varchar("parentPhone", { length: 32 }),
  notes: text("notes"),
  tags: text("tags"),
  enrolledAt: timestamp("enrolledAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ─── Classes ─────────────────────────────────────────────────────────────────
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  programId: int("programId"),
  instructorId: int("instructorId"),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online"]).notNull(),
  modality: mysqlEnum("modality", ["online", "onsite"]).default("onsite"),
  maxStudents: int("maxStudents").default(6),
  currentStudents: int("currentStudents").default(0),
  schedule: text("schedule"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["scheduled", "active", "completed", "cancelled"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

// ─── Class Enrollments ───────────────────────────────────────────────────────
export const classEnrollments = mysqlTable("classEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "dropped", "completed"]).default("active").notNull(),
});

// ─── Attendance ──────────────────────────────────────────────────────────────
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  sessionDate: date("sessionDate").notNull(),
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).default("present").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Leads / Pipeline ────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 64 }).notNull(),
  lastName: varchar("lastName", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  ageGroup: mysqlEnum("ageGroup", ["children", "teens", "adults"]),
  interestedProgram: mysqlEnum("interestedProgram", ["children", "teens", "adults", "business", "polyglot", "immersion", "homeschool"]),
  preferredCampus: mysqlEnum("preferredCampus", ["merida", "dallas", "denver", "vienna", "nottingham", "online"]),
  stage: mysqlEnum("stage", ["new_lead", "contacted", "trial_scheduled", "trial_done", "proposal_sent", "enrolled", "lost"]).default("new_lead").notNull(),
  source: varchar("source", { length: 64 }),
  notes: text("notes"),
  trialDate: date("trialDate"),
  assignedTo: varchar("assignedTo", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  programId: int("programId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  method: mysqlEnum("method", ["paypal", "card", "cash", "transfer", "stripe", "zelle", "dolla"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  description: text("description"),
  invoiceNumber: varchar("invoiceNumber", { length: 32 }),
  paidAt: timestamp("paidAt"),
  dueDate: date("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Expenses ────────────────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD"),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online", "general"]).default("general"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── Email Campaigns ─────────────────────────────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  body: text("body").notNull(),
  templateType: mysqlEnum("templateType", ["promotion", "reminder", "newsletter", "welcome", "progress_report"]).default("newsletter"),
  segmentProgram: mysqlEnum("segmentProgram", ["children", "teens", "adults", "business", "polyglot", "immersion", "homeschool", "all"]).default("all"),
  segmentCampus: mysqlEnum("segmentCampus", ["merida", "dallas", "denver", "vienna", "nottingham", "online", "all"]).default("all"),
  segmentAgeGroup: mysqlEnum("segmentAgeGroup", ["children", "teens", "adults", "all"]).default("all"),
  status: mysqlEnum("status", ["draft", "scheduled", "sent", "cancelled"]).default("draft").notNull(),
  recipientCount: int("recipientCount").default(0),
  openCount: int("openCount").default(0),
  clickCount: int("clickCount").default(0),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

// ─── MCER Assessments ────────────────────────────────────────────────────────
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  assessmentDate: date("assessmentDate").notNull(),
  mcerLevel: mysqlEnum("mcerLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]).notNull(),
  speakingScore: int("speakingScore"),
  listeningScore: int("listeningScore"),
  readingScore: int("readingScore"),
  writingScore: int("writingScore"),
  overallScore: int("overallScore"),
  notes: text("notes"),
  assessedBy: varchar("assessedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// ─── Contacts ────────────────────────────────────────────────────────────────
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["parent", "student", "lead", "partner"]).default("parent").notNull(),
  firstName: varchar("firstName", { length: 64 }).notNull(),
  lastName: varchar("lastName", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  relatedStudentId: int("relatedStudentId"),
  notes: text("notes"),
  tags: text("tags"),
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── Communication History ───────────────────────────────────────────────────
export const communications = mysqlTable("communications", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  type: mysqlEnum("type", ["email", "phone", "whatsapp", "meeting", "note"]).default("note").notNull(),
  subject: varchar("subject", { length: 256 }),
  content: text("content"),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).default("outbound"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Communication = typeof communications.$inferSelect;

// ─── Scholarships ────────────────────────────────────────────────────────────
export const scholarships = mysqlTable("scholarships", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["full", "partial", "merit", "need_based", "community", "referral", "staff"]).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("USD"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["active", "pending", "expired", "revoked"]).default("pending").notNull(),
  notes: text("notes"),
  approvedBy: varchar("approvedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Scholarship = typeof scholarships.$inferSelect;
export type InsertScholarship = typeof scholarships.$inferInsert;

// ─── Language Packages ───────────────────────────────────────────────────────
export const languagePackages = mysqlTable("languagePackages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", [
    "esl",
    "ssl",
    "one_language",
    "two_language",
    "polyglot",
    "full_package",
    "business_english",
    "kids_package",
    "teens_package",
    "custom"
  ]).notNull(),
  languages: varchar("languages", { length: 256 }),
  totalHours: int("totalHours").notNull(),
  sessionsPerWeek: int("sessionsPerWeek").default(2),
  sessionDurationMin: int("sessionDurationMin").default(60),
  priceUSD: decimal("priceUSD", { precision: 10, scale: 2 }).notNull(),
  priceMXN: decimal("priceMXN", { precision: 10, scale: 2 }),
  hourlyRateUSD: decimal("hourlyRateUSD", { precision: 8, scale: 2 }).default("20.00"),
  hourlyRateMXN: decimal("hourlyRateMXN", { precision: 8, scale: 2 }).default("200.00"),
  description: text("description"),
  features: text("features"),
  isActive: boolean("isActive").default(true).notNull(),
  maxStudents: int("maxStudents").default(6),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online", "all"]).default("all"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LanguagePackage = typeof languagePackages.$inferSelect;
export type InsertLanguagePackage = typeof languagePackages.$inferInsert;

// ─── Camps ───────────────────────────────────────────────────────────────────
export const camps = mysqlTable("camps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  season: mysqlEnum("season", ["winter", "spring", "summer", "fall"]).notNull(),
  year: int("year").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online", "all"]).notNull(),
  ageGroup: mysqlEnum("ageGroup", ["kids", "teens", "adults", "mixed"]).default("mixed"),
  capacity: int("capacity").default(20),
  enrolled: int("enrolled").default(0),
  priceUSD: decimal("priceUSD", { precision: 10, scale: 2 }),
  priceMXN: decimal("priceMXN", { precision: 10, scale: 2 }),
  description: text("description"),
  highlights: text("highlights"),
  status: mysqlEnum("status", ["upcoming", "open", "full", "in_progress", "completed", "cancelled"]).default("upcoming").notNull(),
  instructorId: int("instructorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Camp = typeof camps.$inferSelect;
export type InsertCamp = typeof camps.$inferInsert;

// ─── Special Events ──────────────────────────────────────────────────────────
export const specialEvents = mysqlTable("specialEvents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", [
    "cultural",
    "competition",
    "graduation",
    "open_house",
    "workshop",
    "webinar",
    "parent_meeting",
    "holiday",
    "fundraiser",
    "other"
  ]).notNull(),
  date: date("date").notNull(),
  startTime: varchar("startTime", { length: 8 }),
  endTime: varchar("endTime", { length: 8 }),
  campus: mysqlEnum("campus", ["merida", "dallas", "denver", "vienna", "nottingham", "online", "all"]).notNull(),
  capacity: int("capacity"),
  registrations: int("registrations").default(0),
  priceUSD: decimal("priceUSD", { precision: 10, scale: 2 }).default("0.00"),
  priceMXN: decimal("priceMXN", { precision: 10, scale: 2 }).default("0.00"),
  isFree: boolean("isFree").default(true),
  description: text("description"),
  status: mysqlEnum("status", ["upcoming", "open", "full", "in_progress", "completed", "cancelled"]).default("upcoming").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpecialEvent = typeof specialEvents.$inferSelect;
export type InsertSpecialEvent = typeof specialEvents.$inferInsert;

// ─── WhatsApp Templates ──────────────────────────────────────────────────────
export const whatsappTemplates = mysqlTable("whatsappTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["marketing", "utility", "authentication", "reminder", "welcome", "follow_up", "payment", "progress_report"]).notNull(),
  language: mysqlEnum("language", ["en", "es", "both"]).default("en").notNull(),
  headerText: varchar("headerText", { length: 256 }),
  bodyText: text("bodyText").notNull(),
  footerText: varchar("footerText", { length: 256 }),
  buttonType: mysqlEnum("buttonType", ["none", "quick_reply", "call_to_action"]).default("none"),
  buttons: text("buttons"),
  variables: text("variables"),
  status: mysqlEnum("status", ["draft", "pending_review", "approved", "rejected"]).default("draft").notNull(),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsappTemplate = typeof whatsappTemplates.$inferInsert;

// ─── Voice Templates ─────────────────────────────────────────────────────────
export const voiceTemplates = mysqlTable("voiceTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: mysqlEnum("category", ["reminder", "welcome", "payment_due", "class_cancelled", "promotion", "follow_up", "emergency", "other"]).notNull(),
  language: mysqlEnum("language", ["en", "es", "both"]).default("en").notNull(),
  scriptText: text("scriptText").notNull(),
  duration: int("duration"),
  voiceType: mysqlEnum("voiceType", ["male", "female", "neutral"]).default("neutral"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VoiceTemplate = typeof voiceTemplates.$inferSelect;
export type InsertVoiceTemplate = typeof voiceTemplates.$inferInsert;

// ─── Webhook Events ───────────────────────────────────────────────────────────
export const webhookEvents = mysqlTable("webhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  source: varchar("source", { length: 64 }).notNull(),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  payload: text("payload"),
  status: mysqlEnum("status", ["received", "processing", "processed", "failed", "ignored"]).default("received").notNull(),
  errorMessage: text("errorMessage"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WebhookEvent = typeof webhookEvents.$inferSelect;

// ─── Sync Jobs ────────────────────────────────────────────────────────────────
export const syncJobs = mysqlTable("syncJobs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["meta_leads", "email_sync", "payment_sync", "student_sync", "calendar_sync", "whatsapp_sync"]).notNull(),
  status: mysqlEnum("status", ["idle", "running", "completed", "failed", "paused"]).default("idle").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  recordsProcessed: int("recordsProcessed").default(0),
  recordsFailed: int("recordsFailed").default(0),
  errorMessage: text("errorMessage"),
  config: text("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SyncJob = typeof syncJobs.$inferSelect;

// ─── Error Logs ───────────────────────────────────────────────────────────────
export const errorLogs = mysqlTable("errorLogs", {
  id: int("id").autoincrement().primaryKey(),
  level: mysqlEnum("level", ["info", "warning", "error", "critical"]).default("error").notNull(),
  source: varchar("source", { length: 128 }).notNull(),
  message: text("message").notNull(),
  stackTrace: text("stackTrace"),
  context: text("context"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: varchar("resolvedBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ErrorLog = typeof errorLogs.$inferSelect;

// ─── Inbound Webhooks ─────────────────────────────────────────────────────────
export const inboundWebhooks = mysqlTable("inboundWebhooks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  source: mysqlEnum("source", ["meta", "whatsapp", "stripe", "zapier", "make", "custom"]).notNull(),
  endpointToken: varchar("endpointToken", { length: 128 }).notNull().unique(),
  isActive: boolean("isActive").default(true),
  description: text("description"),
  lastReceivedAt: timestamp("lastReceivedAt"),
  totalReceived: int("totalReceived").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InboundWebhook = typeof inboundWebhooks.$inferSelect;
export type InsertInboundWebhook = typeof inboundWebhooks.$inferInsert;

// ─── Recurring Bills ──────────────────────────────────────────────────────────
export const recurringBills = mysqlTable("recurringBills", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  category: mysqlEnum("category", [
    "rent", "utilities", "software", "payroll", "insurance",
    "marketing", "supplies", "taxes", "subscriptions", "maintenance", "other"
  ]).default("other").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("USD").notNull(),
  campus: varchar("campus", { length: 64 }).default("all").notNull(),
  frequency: mysqlEnum("frequency", ["monthly", "quarterly", "annually", "one_time"]).default("monthly").notNull(),
  dueDayOfMonth: int("dueDayOfMonth").notNull(), // 1-31
  nextDueDate: timestamp("nextDueDate").notNull(),
  lastPaidDate: timestamp("lastPaidDate"),
  status: mysqlEnum("status", ["active", "paid", "overdue", "disabled"]).default("active").notNull(),
  notes: text("notes"),
  vendor: varchar("vendor", { length: 256 }),
  isPreset: boolean("isPreset").default(false),
  remindersEnabled: boolean("remindersEnabled").default(true),
  // Track which reminders have been sent for current cycle
  reminder7Sent: boolean("reminder7Sent").default(false),
  reminder3Sent: boolean("reminder3Sent").default(false),
  reminder1Sent: boolean("reminder1Sent").default(false),
  reminderOverdueSent: boolean("reminderOverdueSent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RecurringBill = typeof recurringBills.$inferSelect;
export type InsertRecurringBill = typeof recurringBills.$inferInsert;

// ─── Invitations ──────────────────────────────────────────────────────────────
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 256 }).notNull(),
  role: mysqlEnum("role", ["admin", "user", "instructor", "coordinator", "receptionist", "sales", "marketing", "finance"]).notNull().default("user"),
  token: varchar("token", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "revoked", "expired"]).notNull().default("pending"),
  invitedByName: varchar("invitedByName", { length: 256 }),
  invitedByEmail: varchar("invitedByEmail", { length: 256 }),
  message: text("message"),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// ─── Meta Leads ───────────────────────────────────────────────────────────────
export const metaLeads = mysqlTable("metaLeads", {
  id: int("id").autoincrement().primaryKey(),
  formId: varchar("formId", { length: 128 }).notNull(),
  leadId: varchar("leadId", { length: 128 }).notNull().unique(),
  fullName: varchar("fullName", { length: 256 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  source: varchar("source", { length: 128 }).default("meta_lead_form"),
  status: mysqlEnum("status", ["new", "contacted", "enrolled", "lost"]).default("new").notNull(),
  rawData: text("rawData"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MetaLead = typeof metaLeads.$inferSelect;
export type InsertMetaLead = typeof metaLeads.$inferInsert;

// ─── Social Credentials ───────────────────────────────────────────────────────
export const socialCredentials = mysqlTable("socialCredentials", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["email", "whatsapp", "meta", "instagram", "tiktok", "youtube", "x", "linkedin"]).notNull(),
  handle: varchar("handle", { length: 256 }),
  appId: varchar("appId", { length: 256 }),
  appSecret: varchar("appSecret", { length: 512 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  pageId: varchar("pageId", { length: 128 }),
  phoneNumberId: varchar("phoneNumberId", { length: 128 }),
  webhookVerifyToken: varchar("webhookVerifyToken", { length: 256 }),
  status: mysqlEnum("status", ["connected", "disconnected", "error", "pending"]).default("disconnected").notNull(),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SocialCredential = typeof socialCredentials.$inferSelect;
export type InsertSocialCredential = typeof socialCredentials.$inferInsert;

// ─── Outreach Messages (Send History) ────────────────────────────────────────
export const outreachMessages = mysqlTable("outreachMessages", {
  id: int("id").autoincrement().primaryKey(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "sms"]).notNull(),
  recipientName: varchar("recipientName", { length: 256 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 64 }),
  subject: varchar("subject", { length: 512 }),
  body: text("body"),
  templateId: int("templateId"),
  status: mysqlEnum("status", ["pending", "sent", "failed", "delivered"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  campaignId: varchar("campaignId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OutreachMessage = typeof outreachMessages.$inferSelect;
export type InsertOutreachMessage = typeof outreachMessages.$inferInsert;

// ─── Placement Tests ──────────────────────────────────────────────────────────
export const placementTests = mysqlTable("placementTests", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 64 }).notNull().default("v1"),
  targetLevel: mysqlEnum("targetLevel", ["A1", "A2", "B1", "B2", "C1", "C2", "mixed"]).default("mixed").notNull(),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlacementTest = typeof placementTests.$inferSelect;
export type InsertPlacementTest = typeof placementTests.$inferInsert;

export const testQuestions = mysqlTable("testQuestions", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull().references(() => placementTests.id, { onDelete: "cascade" }),
  orderIndex: int("orderIndex").notNull().default(0),
  questionText: text("questionText").notNull(),
  options: text("options").notNull(), // JSON array of strings
  correctAnswer: varchar("correctAnswer", { length: 512 }).notNull(),
  points: int("points").default(1).notNull(),
  skill: mysqlEnum("skill", ["grammar", "vocabulary", "reading", "listening", "writing"]).default("grammar").notNull(),
  cefrLevel: mysqlEnum("cefrLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]).default("A1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TestQuestion = typeof testQuestions.$inferSelect;
export type InsertTestQuestion = typeof testQuestions.$inferInsert;

export const testSubmissions = mysqlTable("testSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  testId: int("testId").notNull().references(() => placementTests.id),
  studentId: int("studentId").references(() => students.id),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientName: varchar("recipientName", { length: 256 }),
  token: varchar("token", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "expired"]).default("pending").notNull(),
  score: int("score"),
  maxScore: int("maxScore"),
  percentScore: int("percentScore"),
  cefrResult: mysqlEnum("cefrResult", ["A1", "A2", "B1", "B2", "C1", "C2"]),
  answers: text("answers"), // JSON: { questionId: selectedAnswer }
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  notes: text("notes"),
  certificateUrl: text("certificateUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TestSubmission = typeof testSubmissions.$inferSelect;
export type InsertTestSubmission = typeof testSubmissions.$inferInsert;

export const testSchedules = mysqlTable("testSchedules", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id, { onDelete: "cascade" }),
  testId: int("testId").notNull().references(() => placementTests.id),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  intervalMonths: int("intervalMonths").default(1),
  scheduledAt: timestamp("scheduledAt").notNull(),
  lastSentAt: timestamp("lastSentAt"),
  nextSendAt: timestamp("nextSendAt"),
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TestSchedule = typeof testSchedules.$inferSelect;
export type InsertTestSchedule = typeof testSchedules.$inferInsert;

// ─── Submission Notes (staff internal comments) ───────────────────────────────
export const submissionNotes = mysqlTable("submissionNotes", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull().references(() => testSubmissions.id, { onDelete: "cascade" }),
  authorId: int("authorId").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SubmissionNote = typeof submissionNotes.$inferSelect;
export type InsertSubmissionNote = typeof submissionNotes.$inferInsert;

// ─── Onboarding Guide Videos (admin-editable YouTube embeds per section) ─────
export const guideVideos = mysqlTable("guideVideos", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(),
  youtubeUrl: varchar("youtubeUrl", { length: 500 }),
  updatedBy: int("updatedBy").references(() => users.id),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GuideVideo = typeof guideVideos.$inferSelect;
export type InsertGuideVideo = typeof guideVideos.$inferInsert;

// ─── Onboarding Progress (per-user checklist tracking) ───────────────────────
export const onboardingProgress = mysqlTable("onboardingProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(), // instructor | coordinator | finance | admin
  completedItems: text("completedItems").notNull().default("[]"), // JSON array of item keys
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = typeof onboardingProgress.$inferInsert;
