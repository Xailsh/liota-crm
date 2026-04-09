import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assessments,
  attendance,
  campaigns,
  camps,
  classEnrollments,
  classes,
  communications,
  contacts,
  expenses,
  instructors,
  InsertUser,
  languagePackages,
  leads,
  payments,
  programs,
  scholarships,
  specialEvents,
  students,
  users,
  whatsappTemplates,
  voiceTemplates,
  webhookEvents,
  syncJobs,
  errorLogs,
  inboundWebhooks,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

function createDb() {
  if (process.env.DATABASE_URL) {
    return drizzle(process.env.DATABASE_URL);
  }
  return null;
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = createDb();
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  // Retry up to 3 times on ECONNRESET (transient DB connection drop)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
      return; // success
    } catch (err: any) {
      const isConnReset = err?.cause?.code === "ECONNRESET" || err?.message?.includes("ECONNRESET") || err?.cause?.message?.includes("ECONNRESET");
      if (isConnReset && attempt < 3) {
        console.warn(`[Database] ECONNRESET on upsertUser attempt ${attempt}, retrying...`);
        _db = null; // force reconnect
        await new Promise((r) => setTimeout(r, 200 * attempt));
      } else {
        throw err;
      }
    }
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export async function getDashboardMetrics() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [totalStudents] = await db.select({ count: sql<number>`count(*)` }).from(students);
  const [activeStudents] = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.enrollmentStatus, "active"));
  const [trialStudents] = await db
    .select({ count: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.enrollmentStatus, "trial"));
  const [totalLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [activeCampaigns] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaigns)
    .where(or(eq(campaigns.status, "draft"), eq(campaigns.status, "scheduled")));
  const [scheduledClasses] = await db
    .select({ count: sql<number>`count(*)` })
    .from(classes)
    .where(or(eq(classes.status, "scheduled"), eq(classes.status, "active")));
  const [monthlyRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.paidAt, startOfMonth),
        lte(payments.paidAt, endOfMonth)
      )
    );
  const [totalRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "completed"));
  const [pendingRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "pending"));
  const [totalExpenses] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(expenses);

  const recentStudents = await db
    .select()
    .from(students)
    .orderBy(desc(students.createdAt))
    .limit(5);

  const recentLeads = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(5);

  return {
    totalStudents: Number(totalStudents?.count ?? 0),
    activeStudents: Number(activeStudents?.count ?? 0),
    trialStudents: Number(trialStudents?.count ?? 0),
    totalLeads: Number(totalLeads?.count ?? 0),
    activeCampaigns: Number(activeCampaigns?.count ?? 0),
    scheduledClasses: Number(scheduledClasses?.count ?? 0),
    monthlyRevenue: Number(monthlyRevenue?.total ?? 0),
    totalRevenue: Number(totalRevenue?.total ?? 0),
    pendingRevenue: Number(pendingRevenue?.total ?? 0),
    totalExpenses: Number(totalExpenses?.total ?? 0),
    satisfactionRate: 95,
    recentStudents,
    recentLeads,
  };
}

// ─── Students ────────────────────────────────────────────────────────────────
export async function getStudents(filters?: {
  search?: string;
  campus?: string;
  ageGroup?: string;
  enrollmentStatus?: string;
  programId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.search) {
    conditions.push(
      or(
        like(students.firstName, `%${filters.search}%`),
        like(students.lastName, `%${filters.search}%`),
        like(students.email, `%${filters.search}%`)
      )
    );
  }
  if (filters?.campus && filters.campus !== "all") {
    conditions.push(eq(students.campus, filters.campus as any));
  }
  if (filters?.ageGroup && filters.ageGroup !== "all") {
    conditions.push(eq(students.ageGroup, filters.ageGroup as any));
  }
  if (filters?.enrollmentStatus && filters.enrollmentStatus !== "all") {
    conditions.push(eq(students.enrollmentStatus, filters.enrollmentStatus as any));
  }
  if (filters?.programId) {
    conditions.push(eq(students.programId, filters.programId));
  }
  const query = db.select().from(students).orderBy(desc(students.createdAt));
  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }
  return await query;
}

export async function getStudentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return result[0];
}

export async function createStudent(data: typeof students.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(students).values(data);
}

export async function updateStudent(id: number, data: Partial<typeof students.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(students).set(data).where(eq(students.id, id));
}

export async function deleteStudent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(students).where(eq(students.id, id));
}

// ─── Programs ────────────────────────────────────────────────────────────────
export async function getPrograms() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(programs).orderBy(programs.name);
}

export async function createProgram(data: typeof programs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(programs).values(data);
}

export async function updateProgram(id: number, data: Partial<typeof programs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(programs).set(data).where(eq(programs.id, id));
}

// ─── Instructors ─────────────────────────────────────────────────────────────
export async function getInstructors() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(instructors).orderBy(instructors.name);
}

export async function createInstructor(data: typeof instructors.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(instructors).values(data);
}

// ─── Classes ─────────────────────────────────────────────────────────────────
export async function getClasses(filters?: { campus?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.campus && filters.campus !== "all") {
    conditions.push(eq(classes.campus, filters.campus as any));
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(classes.status, filters.status as any));
  }
  const query = db.select().from(classes).orderBy(desc(classes.createdAt));
  if (conditions.length > 0) return await query.where(and(...conditions));
  return await query;
}

export async function createClass(data: typeof classes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(classes).values(data);
}

export async function updateClass(id: number, data: Partial<typeof classes.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(classes).set(data).where(eq(classes.id, id));
}

// ─── Leads ───────────────────────────────────────────────────────────────────
export async function getLeads(filters?: { stage?: string; campus?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.stage && filters.stage !== "all") {
    conditions.push(eq(leads.stage, filters.stage as any));
  }
  if (filters?.campus && filters.campus !== "all") {
    conditions.push(eq(leads.preferredCampus, filters.campus as any));
  }
  const query = db.select().from(leads).orderBy(desc(leads.createdAt));
  if (conditions.length > 0) return await query.where(and(...conditions));
  return await query;
}

export async function createLead(data: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(leads).values(data);
}

export async function updateLead(id: number, data: Partial<typeof leads.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(leads).where(eq(leads.id, id));
}

// ─── Payments ────────────────────────────────────────────────────────────────
export async function getPayments(filters?: { status?: string; studentId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(payments.status, filters.status as any));
  }
  if (filters?.studentId) {
    conditions.push(eq(payments.studentId, filters.studentId));
  }
  const query = db.select().from(payments).orderBy(desc(payments.createdAt));
  if (conditions.length > 0) return await query.where(and(...conditions));
  return await query;
}

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(payments).values(data);
}

export async function updatePayment(id: number, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(payments).set(data).where(eq(payments.id, id));
}

// ─── Expenses ────────────────────────────────────────────────────────────────
export async function getExpenses(filters?: { campus?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.campus && filters.campus !== "all") {
    conditions.push(eq(expenses.campus, filters.campus as any));
  }
  const query = db.select().from(expenses).orderBy(desc(expenses.date));
  if (conditions.length > 0) return await query.where(and(...conditions));
  return await query;
}

export async function createExpense(data: typeof expenses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(expenses).values(data);
}

// ─── Campaigns ───────────────────────────────────────────────────────────────
export async function getCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(data: typeof campaigns.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(campaigns).values(data);
}

export async function updateCampaign(id: number, data: Partial<typeof campaigns.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(campaigns).set(data).where(eq(campaigns.id, id));
}

export async function deleteCampaign(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

// ─── Assessments ─────────────────────────────────────────────────────────────
export async function getAssessments(studentId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (studentId) {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.studentId, studentId))
      .orderBy(desc(assessments.assessmentDate));
  }
  return await db.select().from(assessments).orderBy(desc(assessments.assessmentDate));
}

export async function createAssessment(data: typeof assessments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(assessments).values(data);
}

// ─── Contacts ────────────────────────────────────────────────────────────────
export async function getContacts(filters?: { type?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type && filters.type !== "all") {
    conditions.push(eq(contacts.type, filters.type as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(contacts.firstName, `%${filters.search}%`),
        like(contacts.lastName, `%${filters.search}%`),
        like(contacts.email, `%${filters.search}%`)
      )
    );
  }
  const query = db.select().from(contacts).orderBy(desc(contacts.createdAt));
  if (conditions.length > 0) return await query.where(and(...conditions));
  return await query;
}

export async function createContact(data: typeof contacts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(contacts).values(data);
}

export async function updateContact(id: number, data: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contacts).set(data).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}

// ─── Communications ──────────────────────────────────────────────────────────
export async function getCommunications(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(communications)
    .where(eq(communications.contactId, contactId))
    .orderBy(desc(communications.createdAt));
}

export async function createCommunication(data: typeof communications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(communications).values(data);
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const db = await getDb();
  if (!db) return null;

  // Students by campus
  const studentsByCampus = await db
    .select({ campus: students.campus, count: sql<number>`count(*)` })
    .from(students)
    .groupBy(students.campus);

  // Students by program type
  const studentsByProgram = await db
    .select({ ageGroup: students.ageGroup, count: sql<number>`count(*)` })
    .from(students)
    .groupBy(students.ageGroup);

  // Students by status
  const studentsByStatus = await db
    .select({ status: students.enrollmentStatus, count: sql<number>`count(*)` })
    .from(students)
    .groupBy(students.enrollmentStatus);

  // Revenue by month (last 6 months)
  const revenueByMonth = await db
    .select({
      month: sql<string>`DATE_FORMAT(paidAt, '%Y-%m')`,
      total: sql<number>`SUM(amount)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.paidAt, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
      )
    )
    .groupBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`);

  // Leads by stage
  const leadsByStage = await db
    .select({ stage: leads.stage, count: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.stage);

  // Campaign performance
  const campaignStats = await db
    .select({
      total: sql<number>`count(*)`,
      sent: sql<number>`SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END)`,
      totalRecipients: sql<number>`SUM(recipientCount)`,
      totalOpens: sql<number>`SUM(openCount)`,
    })
    .from(campaigns);

  return {
    studentsByCampus: studentsByCampus.map((r) => ({ ...r, count: Number(r.count) })),
    studentsByProgram: studentsByProgram.map((r) => ({ ...r, count: Number(r.count) })),
    studentsByStatus: studentsByStatus.map((r) => ({ ...r, count: Number(r.count) })),
    revenueByMonth: revenueByMonth.map((r) => ({ ...r, total: Number(r.total) })),
    leadsByStage: leadsByStage.map((r) => ({ ...r, count: Number(r.count) })),
    campaignStats: {
      total: Number(campaignStats[0]?.total ?? 0),
      sent: Number(campaignStats[0]?.sent ?? 0),
      totalRecipients: Number(campaignStats[0]?.totalRecipients ?? 0),
      totalOpens: Number(campaignStats[0]?.totalOpens ?? 0),
    },
  };
}

// ─── Financial Dashboard (Admin Only) ────────────────────────────────────────
export async function getFinancialDashboard() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [estimatedRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(or(eq(payments.status, "completed"), eq(payments.status, "pending")));

  const [collectedRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "completed"));

  const [pendingRevenue] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.status, "pending"));

  const [totalExpensesAll] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(expenses);

  const [monthlyCollected] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(
      and(
        eq(payments.status, "completed"),
        gte(payments.paidAt, startOfMonth),
        lte(payments.paidAt, endOfMonth)
      )
    );

  const expensesByCategory = await db
    .select({ category: expenses.category, total: sql<number>`SUM(amount)` })
    .from(expenses)
    .groupBy(expenses.category);

  const revenueByMethod = await db
    .select({ method: payments.method, total: sql<number>`SUM(amount)` })
    .from(payments)
    .where(eq(payments.status, "completed"))
    .groupBy(payments.method);

  const recentPayments = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(10);

  return {
    estimatedRevenue: Number(estimatedRevenue?.total ?? 0),
    collectedRevenue: Number(collectedRevenue?.total ?? 0),
    pendingRevenue: Number(pendingRevenue?.total ?? 0),
    totalExpenses: Number(totalExpensesAll?.total ?? 0),
    netProfit:
      Number(collectedRevenue?.total ?? 0) - Number(totalExpensesAll?.total ?? 0),
    monthlyCollected: Number(monthlyCollected?.total ?? 0),
    expensesByCategory: expensesByCategory.map((r) => ({
      ...r,
      total: Number(r.total),
    })),
    revenueByMethod: revenueByMethod.map((r) => ({ ...r, total: Number(r.total) })),
    recentPayments,
  };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
export async function seedDemoData() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Programs
  await db.insert(programs).values([
    { name: "Inglés para Niños", type: "children", description: "Programa para edades 5-12 años", durationHours: 80, priceUsd: "299.00", maxStudents: 6, modality: "hybrid", status: "active" },
    { name: "Inglés para Adolescentes", type: "teens", description: "Preparación universitaria y profesional", durationHours: 100, priceUsd: "349.00", maxStudents: 6, modality: "hybrid", status: "active" },
    { name: "Inglés para Adultos", type: "adults", description: "Inglés práctico para trabajo y vida diaria", durationHours: 80, priceUsd: "299.00", maxStudents: 6, modality: "hybrid", status: "active" },
    { name: "Inglés de Negocios", type: "business", description: "Inglés empresarial avanzado", durationHours: 60, priceUsd: "499.00", maxStudents: 6, modality: "online", status: "active" },
    { name: "Polyglot Enrichment", type: "polyglot", description: "Programa multilingüe", durationHours: 20, priceUsd: "999.00", maxStudents: 6, modality: "online", status: "active" },
    { name: "Full Immersion Mérida", type: "immersion", description: "Inmersión total en Mérida, México", durationHours: 160, priceUsd: "9999.00", maxStudents: 6, modality: "onsite", status: "active" },
    { name: "Homeschool Private English", type: "homeschool", description: "Clases privadas para homeschool", durationHours: 4, priceUsd: "99.00", maxStudents: 1, modality: "online", status: "active" },
  ]).onDuplicateKeyUpdate({ set: { name: sql`name` } });

  // Instructors
  await db.insert(instructors).values([
    { name: "María González", email: "maria@liota.edu", phone: "+52 999 123 4567", campus: "merida", specialization: "Inglés para Niños", certifications: "CELTA, TESOL", status: "active" },
    { name: "James Wilson", email: "james@liota.edu", phone: "+1 214 555 0101", campus: "dallas", specialization: "Business English", certifications: "DELTA, MBA", status: "active" },
    { name: "Sarah Johnson", email: "sarah@liota.edu", phone: "+1 720 555 0202", campus: "denver", specialization: "Academic English", certifications: "CELTA, MA Linguistics", status: "active" },
    { name: "Klaus Weber", email: "klaus@liota.edu", phone: "+43 1 555 0303", campus: "vienna", specialization: "Immersion Programs", certifications: "DELTA, PhD Applied Linguistics", status: "active" },
    { name: "Ana Martínez", email: "ana@liota.edu", phone: "+52 999 987 6543", campus: "online", specialization: "Online Teaching", certifications: "CELTA, Digital Education", status: "active" },
  ]).onDuplicateKeyUpdate({ set: { name: sql`name` } });

  // Students
  await db.insert(students).values([
    { firstName: "Sofía", lastName: "Ramírez", email: "sofia.r@email.com", phone: "+52 999 111 2222", ageGroup: "children", programId: 1, campus: "merida", mcerLevel: "A1", enrollmentStatus: "active", parentName: "Carlos Ramírez", parentEmail: "carlos.r@email.com", tags: "niños,activo" },
    { firstName: "Diego", lastName: "López", email: "diego.l@email.com", phone: "+52 999 333 4444", ageGroup: "teens", programId: 2, campus: "merida", mcerLevel: "A2", enrollmentStatus: "active", parentName: "Ana López", parentEmail: "ana.l@email.com", tags: "adolescentes,activo" },
    { firstName: "Jennifer", lastName: "Smith", email: "jennifer.s@email.com", phone: "+1 214 555 1111", ageGroup: "adults", programId: 4, campus: "dallas", mcerLevel: "B1", enrollmentStatus: "active", tags: "negocios,activo" },
    { firstName: "Michael", lastName: "Brown", email: "michael.b@email.com", phone: "+1 720 555 2222", ageGroup: "adults", programId: 3, campus: "denver", mcerLevel: "B2", enrollmentStatus: "active", tags: "adultos,activo" },
    { firstName: "Emma", lastName: "García", email: "emma.g@email.com", phone: "+1 214 555 3333", ageGroup: "teens", programId: 2, campus: "dallas", mcerLevel: "A1", enrollmentStatus: "trial", parentName: "Roberto García", tags: "adolescentes,prueba" },
    { firstName: "Lucas", lastName: "Hernández", email: "lucas.h@email.com", phone: "+52 999 555 6666", ageGroup: "children", programId: 1, campus: "merida", mcerLevel: "A1", enrollmentStatus: "active", parentName: "María Hernández", tags: "niños,activo" },
    { firstName: "Isabella", lastName: "Martínez", email: "isabella.m@email.com", phone: "+43 1 555 7777", ageGroup: "adults", programId: 5, campus: "vienna", mcerLevel: "C1", enrollmentStatus: "active", tags: "polyglot,activo" },
    { firstName: "Alejandro", lastName: "Torres", email: "alejandro.t@email.com", phone: "+52 999 888 9999", ageGroup: "adults", programId: 6, campus: "merida", mcerLevel: "B2", enrollmentStatus: "active", tags: "inmersión,activo" },
    { firstName: "Valentina", lastName: "Cruz", email: "valentina.c@email.com", phone: "+1 720 555 4444", ageGroup: "teens", programId: 2, campus: "online", mcerLevel: "A2", enrollmentStatus: "active", parentName: "Pedro Cruz", tags: "adolescentes,online" },
    { firstName: "Mateo", lastName: "Flores", email: "mateo.f@email.com", phone: "+52 999 000 1111", ageGroup: "children", programId: 7, campus: "online", mcerLevel: "A1", enrollmentStatus: "trial", parentName: "Laura Flores", tags: "homeschool,prueba" },
  ]).onDuplicateKeyUpdate({ set: { firstName: sql`firstName` } });

  // Leads
  await db.insert(leads).values([
    { firstName: "Roberto", lastName: "Sánchez", email: "roberto.s@email.com", phone: "+52 999 222 3333", ageGroup: "children", interestedProgram: "children", preferredCampus: "merida", stage: "new_lead", source: "website", notes: "Interesado en programa de niños" },
    { firstName: "Patricia", lastName: "Morales", email: "patricia.m@email.com", phone: "+1 214 555 5555", ageGroup: "adults", interestedProgram: "business", preferredCampus: "dallas", stage: "contacted", source: "referral", notes: "Necesita inglés para trabajo" },
    { firstName: "Carlos", lastName: "Jiménez", email: "carlos.j@email.com", phone: "+1 720 555 6666", ageGroup: "teens", interestedProgram: "teens", preferredCampus: "denver", stage: "trial_scheduled", source: "social_media", trialDate: new Date("2026-04-15") as any, notes: "Clase de prueba agendada" },
    { firstName: "Laura", lastName: "Vega", email: "laura.v@email.com", phone: "+52 999 444 5555", ageGroup: "adults", interestedProgram: "adults", preferredCampus: "online", stage: "trial_done", source: "google", notes: "Muy interesada, espera propuesta" },
    { firstName: "Fernando", lastName: "Reyes", email: "fernando.r@email.com", phone: "+43 1 555 8888", ageGroup: "adults", interestedProgram: "immersion", preferredCampus: "vienna", stage: "proposal_sent", source: "website", notes: "Propuesta enviada para programa de inmersión" },
    { firstName: "Daniela", lastName: "Castillo", email: "daniela.c@email.com", phone: "+52 999 666 7777", ageGroup: "children", interestedProgram: "children", preferredCampus: "merida", stage: "new_lead", source: "whatsapp", notes: "Preguntó por horarios" },
  ]).onDuplicateKeyUpdate({ set: { firstName: sql`firstName` } });

  // Payments
  const paymentData = [
    { studentId: 1, programId: 1, amount: "299.00", currency: "USD", method: "paypal" as const, status: "completed" as const, description: "Pago programa Inglés para Niños - Sofía Ramírez", invoiceNumber: "INV-2026-001", paidAt: new Date("2026-01-15") },
    { studentId: 2, programId: 2, amount: "349.00", currency: "USD", method: "card" as const, status: "completed" as const, description: "Pago programa Adolescentes - Diego López", invoiceNumber: "INV-2026-002", paidAt: new Date("2026-01-20") },
    { studentId: 3, programId: 4, amount: "499.00", currency: "USD", method: "paypal" as const, status: "completed" as const, description: "Pago Business English - Jennifer Smith", invoiceNumber: "INV-2026-003", paidAt: new Date("2026-02-01") },
    { studentId: 4, programId: 3, amount: "299.00", currency: "USD", method: "card" as const, status: "completed" as const, description: "Pago Inglés Adultos - Michael Brown", invoiceNumber: "INV-2026-004", paidAt: new Date("2026-02-10") },
    { studentId: 6, programId: 1, amount: "299.00", currency: "USD", method: "transfer" as const, status: "completed" as const, description: "Pago programa Niños - Lucas Hernández", invoiceNumber: "INV-2026-005", paidAt: new Date("2026-02-15") },
    { studentId: 7, programId: 5, amount: "999.00", currency: "USD", method: "paypal" as const, status: "completed" as const, description: "Pago Polyglot Enrichment - Isabella Martínez", invoiceNumber: "INV-2026-006", paidAt: new Date("2026-03-01") },
    { studentId: 8, programId: 6, amount: "9999.00", currency: "USD", method: "card" as const, status: "completed" as const, description: "Pago Full Immersion - Alejandro Torres", invoiceNumber: "INV-2026-007", paidAt: new Date("2026-03-05") },
    { studentId: 9, programId: 2, amount: "349.00", currency: "USD", method: "paypal" as const, status: "completed" as const, description: "Pago Adolescentes Online - Valentina Cruz", invoiceNumber: "INV-2026-008", paidAt: new Date("2026-03-15") },
    { studentId: 1, programId: 1, amount: "299.00", currency: "USD", method: "paypal" as const, status: "pending" as const, description: "Segundo pago programa Niños - Sofía Ramírez", invoiceNumber: "INV-2026-009", dueDate: new Date("2026-04-15") as any },
    { studentId: 3, programId: 4, amount: "499.00", currency: "USD", method: "card" as const, status: "pending" as const, description: "Renovación Business English - Jennifer Smith", invoiceNumber: "INV-2026-010", dueDate: new Date("2026-04-20") as any },
  ];
  await db.insert(payments).values(paymentData).onDuplicateKeyUpdate({ set: { description: sql`description` } });

  // Expenses
  await db.insert(expenses).values([
    { category: "Renta", description: "Renta oficina Mérida - Marzo 2026", amount: "1200.00", currency: "USD", campus: "merida", date: new Date("2026-03-01") as any },
    { category: "Renta", description: "Renta oficina Dallas - Marzo 2026", amount: "2500.00", currency: "USD", campus: "dallas", date: new Date("2026-03-01") as any },
    { category: "Renta", description: "Renta oficina Denver - Marzo 2026", amount: "2200.00", currency: "USD", campus: "denver", date: new Date("2026-03-01") as any },
    { category: "Salarios", description: "Salarios instructores - Marzo 2026", amount: "8500.00", currency: "USD", campus: "general", date: new Date("2026-03-31") as any },
    { category: "Tecnología", description: "Plataformas IA y software educativo", amount: "450.00", currency: "USD", campus: "general", date: new Date("2026-03-15") as any },
    { category: "Marketing", description: "Publicidad Google y redes sociales", amount: "800.00", currency: "USD", campus: "general", date: new Date("2026-03-20") as any },
    { category: "Materiales", description: "Libros y materiales didácticos", amount: "320.00", currency: "USD", campus: "merida", date: new Date("2026-03-10") as any },
  ]).onDuplicateKeyUpdate({ set: { description: sql`description` } });

  // Campaigns
  await db.insert(campaigns).values([
    { name: "Matrícula 2026 - Niños", subject: "¡Inscribe a tu hijo en LIOTA! Plazas limitadas", body: "Estimado padre/madre,\n\nLe informamos que tenemos disponibilidad en nuestros programas de inglés para niños...", templateType: "promotion", segmentProgram: "children", segmentCampus: "all", segmentAgeGroup: "children", status: "sent", recipientCount: 145, openCount: 87, clickCount: 34, sentAt: new Date("2026-01-10") },
    { name: "Recordatorio de Clase - Adultos", subject: "Recordatorio: Tu clase de inglés es mañana", body: "Hola,\n\nTe recordamos que mañana tienes clase de inglés...", templateType: "reminder", segmentProgram: "adults", segmentCampus: "all", segmentAgeGroup: "adults", status: "sent", recipientCount: 89, openCount: 72, clickCount: 28, sentAt: new Date("2026-02-14") },
    { name: "Newsletter Febrero 2026", subject: "Novedades LIOTA - Febrero 2026", body: "Estimada comunidad LIOTA,\n\nEste mes tenemos emocionantes novedades...", templateType: "newsletter", segmentProgram: "all", segmentCampus: "all", segmentAgeGroup: "all", status: "sent", recipientCount: 412, openCount: 198, clickCount: 67, sentAt: new Date("2026-02-28") },
    { name: "Oferta Especial Business English", subject: "20% de descuento en Business English - Solo esta semana", body: "Profesional,\n\nPor tiempo limitado ofrecemos un 20% de descuento...", templateType: "promotion", segmentProgram: "business", segmentCampus: "all", segmentAgeGroup: "adults", status: "draft", recipientCount: 0, openCount: 0, clickCount: 0 },
    { name: "Bienvenida Nuevos Estudiantes", subject: "¡Bienvenido a la familia LIOTA!", body: "Querido estudiante,\n\nEs un placer darte la bienvenida a LIOTA...", templateType: "welcome", segmentProgram: "all", segmentCampus: "all", segmentAgeGroup: "all", status: "draft", recipientCount: 0, openCount: 0, clickCount: 0 },
  ]).onDuplicateKeyUpdate({ set: { name: sql`name` } });

  // Assessments
  await db.insert(assessments).values([
    { studentId: 1, assessmentDate: new Date("2026-01-10") as any, mcerLevel: "A1", speakingScore: 45, listeningScore: 50, readingScore: 55, writingScore: 40, overallScore: 48, assessedBy: "María González", notes: "Inicio de programa" },
    { studentId: 2, assessmentDate: new Date("2026-01-12") as any, mcerLevel: "A2", speakingScore: 65, listeningScore: 70, readingScore: 68, writingScore: 62, overallScore: 66, assessedBy: "María González", notes: "Buen progreso" },
    { studentId: 3, assessmentDate: new Date("2026-02-01") as any, mcerLevel: "B1", speakingScore: 75, listeningScore: 78, readingScore: 80, writingScore: 72, overallScore: 76, assessedBy: "James Wilson", notes: "Lista para B2" },
    { studentId: 4, assessmentDate: new Date("2026-02-05") as any, mcerLevel: "B2", speakingScore: 85, listeningScore: 88, readingScore: 90, writingScore: 82, overallScore: 86, assessedBy: "Sarah Johnson", notes: "Excelente progreso" },
    { studentId: 7, assessmentDate: new Date("2026-03-01") as any, mcerLevel: "C1", speakingScore: 92, listeningScore: 95, readingScore: 94, writingScore: 90, overallScore: 93, assessedBy: "Klaus Weber", notes: "Nivel avanzado confirmado" },
  ]).onDuplicateKeyUpdate({ set: { notes: sql`notes` } });

  // Contacts
  await db.insert(contacts).values([
    { type: "parent", firstName: "Carlos", lastName: "Ramírez", email: "carlos.r@email.com", phone: "+52 999 111 2222", relatedStudentId: 1, notes: "Padre de Sofía, muy involucrado", tags: "padre,activo", lastContactedAt: new Date("2026-04-01") },
    { type: "parent", firstName: "Ana", lastName: "López", email: "ana.l@email.com", phone: "+52 999 333 4444", relatedStudentId: 2, notes: "Madre de Diego, pide reportes mensuales", tags: "padre,reportes", lastContactedAt: new Date("2026-03-28") },
    { type: "student", firstName: "Jennifer", lastName: "Smith", email: "jennifer.s@email.com", phone: "+1 214 555 1111", relatedStudentId: 3, notes: "Estudiante adulta, muy motivada", tags: "adulto,negocios", lastContactedAt: new Date("2026-04-05") },
    { type: "partner", firstName: "Hans", lastName: "Mueller", email: "hans.m@ggofor.at", phone: "+43 1 555 9999", notes: "Socio programa Viena - GGofor it Sports", tags: "socio,viena", lastContactedAt: new Date("2026-03-15") },
  ]).onDuplicateKeyUpdate({ set: { firstName: sql`firstName` } });

  return { success: true, message: "Demo data seeded successfully" };
}

// ─── Scholarships ─────────────────────────────────────────────────────────────

export async function getScholarships(filters: { studentId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(scholarships).$dynamic();
  const conditions = [];
  if (filters.studentId) conditions.push(eq(scholarships.studentId, filters.studentId));
  if (filters.status) conditions.push(eq(scholarships.status, filters.status as any));
  if (conditions.length > 0) q = q.where(and(...conditions));
  return q.orderBy(desc(scholarships.createdAt));
}

export async function createScholarship(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(scholarships).values(data);
}

export async function updateScholarship(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(scholarships).set(data).where(eq(scholarships.id, id));
}

export async function deleteScholarship(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(scholarships).where(eq(scholarships.id, id));
}

// ─── Language Packages ────────────────────────────────────────────────────────
export async function getLanguagePackages(filters: { type?: string; campus?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(languagePackages).$dynamic();
  const conditions = [];
  if (filters.type) conditions.push(eq(languagePackages.type, filters.type as any));
  if (filters.campus) conditions.push(eq(languagePackages.campus, filters.campus as any));
  if (filters.isActive !== undefined) conditions.push(eq(languagePackages.isActive, filters.isActive));
  if (conditions.length > 0) q = q.where(and(...conditions));
  return q.orderBy(languagePackages.name);
}

export async function createLanguagePackage(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(languagePackages).values(data);
}

export async function updateLanguagePackage(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(languagePackages).set(data).where(eq(languagePackages.id, id));
}

export async function deleteLanguagePackage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(languagePackages).where(eq(languagePackages.id, id));
}

// ─── Camps ────────────────────────────────────────────────────────────────────
export async function getCamps(filters: { season?: string; year?: number; campus?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(camps).$dynamic();
  const conditions = [];
  if (filters.season) conditions.push(eq(camps.season, filters.season as any));
  if (filters.year) conditions.push(eq(camps.year, filters.year));
  if (filters.campus) conditions.push(eq(camps.campus, filters.campus as any));
  if (filters.status) conditions.push(eq(camps.status, filters.status as any));
  if (conditions.length > 0) q = q.where(and(...conditions));
  return q.orderBy(camps.startDate);
}

export async function createCamp(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(camps).values(data);
}

export async function updateCamp(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(camps).set(data).where(eq(camps.id, id));
}

export async function deleteCamp(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(camps).where(eq(camps.id, id));
}

// ─── Special Events ───────────────────────────────────────────────────────────
export async function getSpecialEvents(filters: { type?: string; campus?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  let q = db.select().from(specialEvents).$dynamic();
  const conditions = [];
  if (filters.type) conditions.push(eq(specialEvents.type, filters.type as any));
  if (filters.campus) conditions.push(eq(specialEvents.campus, filters.campus as any));
  if (filters.status) conditions.push(eq(specialEvents.status, filters.status as any));
  if (conditions.length > 0) q = q.where(and(...conditions));
  return q.orderBy(specialEvents.date);
}

export async function createSpecialEvent(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(specialEvents).values(data);
}

export async function updateSpecialEvent(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(specialEvents).set(data).where(eq(specialEvents.id, id));
}

export async function deleteSpecialEvent(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(specialEvents).where(eq(specialEvents.id, id));
}

// ─── WhatsApp Templates ──────────────────────────────────────────────────────
export async function getWhatsappTemplates(filters?: { category?: string; language?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(whatsappTemplates);
  const conditions = [];
  if (filters?.category && filters.category !== "all") conditions.push(eq(whatsappTemplates.category, filters.category as any));
  if (filters?.language && filters.language !== "all") conditions.push(eq(whatsappTemplates.language, filters.language as any));
  if (filters?.status && filters.status !== "all") conditions.push(eq(whatsappTemplates.status, filters.status as any));
  if (conditions.length > 0) return (q as any).where(and(...conditions)).orderBy(desc(whatsappTemplates.createdAt));
  return q.orderBy(desc(whatsappTemplates.createdAt));
}
export async function createWhatsappTemplate(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(whatsappTemplates).values(data);
}
export async function updateWhatsappTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(whatsappTemplates).set({ ...data, updatedAt: new Date() }).where(eq(whatsappTemplates.id, id));
}
export async function deleteWhatsappTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
}

// ─── Voice Templates ─────────────────────────────────────────────────────────
export async function getVoiceTemplates(filters?: { category?: string; language?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(voiceTemplates);
  const conditions = [];
  if (filters?.category && filters.category !== "all") conditions.push(eq(voiceTemplates.category, filters.category as any));
  if (filters?.language && filters.language !== "all") conditions.push(eq(voiceTemplates.language, filters.language as any));
  if (filters?.status && filters.status !== "all") conditions.push(eq(voiceTemplates.status, filters.status as any));
  if (conditions.length > 0) return (q as any).where(and(...conditions)).orderBy(desc(voiceTemplates.createdAt));
  return q.orderBy(desc(voiceTemplates.createdAt));
}
export async function createVoiceTemplate(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(voiceTemplates).values(data);
}
export async function updateVoiceTemplate(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(voiceTemplates).set({ ...data, updatedAt: new Date() }).where(eq(voiceTemplates.id, id));
}
export async function deleteVoiceTemplate(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(voiceTemplates).where(eq(voiceTemplates.id, id));
}

// ─── Webhook Events ───────────────────────────────────────────────────────────
export async function getWebhookEvents(filters?: { source?: string; status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(webhookEvents);
  const conditions = [];
  if (filters?.source && filters.source !== "all") conditions.push(eq(webhookEvents.source, filters.source));
  if (filters?.status && filters.status !== "all") conditions.push(eq(webhookEvents.status, filters.status as any));
  const query = conditions.length > 0 ? (q as any).where(and(...conditions)) : q;
  return query.orderBy(desc(webhookEvents.createdAt)).limit(filters?.limit ?? 100);
}
export async function createWebhookEvent(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(webhookEvents).values(data);
}
export async function updateWebhookEvent(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(webhookEvents).set(data).where(eq(webhookEvents.id, id));
}

// ─── Sync Jobs ────────────────────────────────────────────────────────────────
export async function getSyncJobs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(syncJobs).orderBy(syncJobs.name);
}
export async function createSyncJob(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(syncJobs).values(data);
}
export async function updateSyncJob(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(syncJobs).set({ ...data, updatedAt: new Date() }).where(eq(syncJobs.id, id));
}
export async function deleteSyncJob(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(syncJobs).where(eq(syncJobs.id, id));
}

// ─── Error Logs ───────────────────────────────────────────────────────────────
export async function getErrorLogs(filters?: { level?: string; source?: string; resolved?: boolean; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(errorLogs);
  const conditions = [];
  if (filters?.level && filters.level !== "all") conditions.push(eq(errorLogs.level, filters.level as any));
  if (filters?.source) conditions.push(like(errorLogs.source, `%${filters.source}%`));
  if (filters?.resolved !== undefined) conditions.push(eq(errorLogs.resolved, filters.resolved));
  const query = conditions.length > 0 ? (q as any).where(and(...conditions)) : q;
  return query.orderBy(desc(errorLogs.createdAt)).limit(filters?.limit ?? 200);
}
export async function createErrorLog(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(errorLogs).values(data);
}
export async function resolveErrorLog(id: number, resolvedBy: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(errorLogs).set({ resolved: true, resolvedAt: new Date(), resolvedBy }).where(eq(errorLogs.id, id));
}
export async function deleteErrorLog(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(errorLogs).where(eq(errorLogs.id, id));
}

// ─── Inbound Webhooks ─────────────────────────────────────────────────────────
export async function getInboundWebhooks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inboundWebhooks).orderBy(desc(inboundWebhooks.createdAt));
}
export async function createInboundWebhook(data: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(inboundWebhooks).values(data);
}
export async function updateInboundWebhook(id: number, data: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(inboundWebhooks).set({ ...data, updatedAt: new Date() }).where(eq(inboundWebhooks.id, id));
}
export async function deleteInboundWebhook(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(inboundWebhooks).where(eq(inboundWebhooks.id, id));
}

// ─── Admin Helpers ────────────────────────────────────────────────────────────
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "instructor" | "coordinator" | "receptionist") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: role as any, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalStudents: 0, totalLeads: 0, totalPayments: 0, totalCampaigns: 0, totalClasses: 0 };
  const [userCount] = await db.select({ count: sql`COUNT(*)` }).from(users);
  const [studentCount] = await db.select({ count: sql`COUNT(*)` }).from(students);
  const [leadCount] = await db.select({ count: sql`COUNT(*)` }).from(leads);
  const [paymentCount] = await db.select({ count: sql`COUNT(*)` }).from(payments);
  const [campaignCount] = await db.select({ count: sql`COUNT(*)` }).from(campaigns);
  const [classCount] = await db.select({ count: sql`COUNT(*)` }).from(classes);
  return {
    totalUsers: Number(userCount?.count ?? 0),
    totalStudents: Number(studentCount?.count ?? 0),
    totalLeads: Number(leadCount?.count ?? 0),
    totalPayments: Number(paymentCount?.count ?? 0),
    totalCampaigns: Number(campaignCount?.count ?? 0),
    totalClasses: Number(classCount?.count ?? 0),
  };
}
