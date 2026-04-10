/**
 * Placement Tests Router
 * Handles test management, sending, scoring, and scheduling
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  placementTests,
  testQuestions,
  testSubmissions,
  testSchedules,
  students,
} from "../../drizzle/schema";
import { eq, desc, and, lte, isNull, or } from "drizzle-orm";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── CEFR Scoring Logic ───────────────────────────────────────────────────────
function mapScoreToCEFR(percent: number): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" {
  if (percent < 20) return "A1";
  if (percent < 35) return "A2";
  if (percent < 55) return "B1";
  if (percent < 70) return "B2";
  if (percent < 85) return "C1";
  return "C2";
}

function scoreAnswers(
  questions: Array<{ id: number; correctAnswer: string; points: number }>,
  answers: Record<string, string>
): { score: number; maxScore: number; percent: number } {
  let score = 0;
  let maxScore = 0;
  for (const q of questions) {
    maxScore += q.points;
    if (answers[String(q.id)] === q.correctAnswer) {
      score += q.points;
    }
  }
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percent };
}

// ─── Email Template ───────────────────────────────────────────────────────────
function buildTestEmail(opts: {
  recipientName: string;
  testTitle: string;
  testUrl: string;
  expiresAt: Date;
  durationMinutes: number;
}) {
  const expiry = opts.expiresAt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return {
    subject: `Your English Placement Test — ${opts.testTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%);padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#c9a84c;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">LIOTA Institute</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">English Placement Test</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;color:#374151;font-size:16px;">Hello <strong>${opts.recipientName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
            You have been invited to take the <strong>${opts.testTitle}</strong> English placement test. 
            This test helps us place you in the right program level for the best learning experience.
          </p>
          <!-- Test Info Box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 28px;">
            <tr>
              <td style="padding:16px 20px;border-right:1px solid #e2e8f0;">
                <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Duration</p>
                <p style="margin:4px 0 0;color:#1f2937;font-size:18px;font-weight:700;">${opts.durationMinutes} min</p>
              </td>
              <td style="padding:16px 20px;">
                <p style="margin:0;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Valid Until</p>
                <p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:600;">${expiry}</p>
              </td>
            </tr>
          </table>
          <!-- CTA Button -->
          <div style="text-align:center;margin:0 0 28px;">
            <a href="${opts.testUrl}" style="display:inline-block;background:#c9a84c;color:#1a1a1a;text-decoration:none;font-weight:700;font-size:16px;padding:14px 40px;border-radius:8px;letter-spacing:0.5px;">
              Start My Placement Test →
            </a>
          </div>
          <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">Or copy this link into your browser:</p>
          <p style="margin:0 0 28px;color:#3b82f6;font-size:12px;text-align:center;word-break:break-all;">${opts.testUrl}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            If you have any questions, reply to this email or contact us at 
            <a href="mailto:contact@liota.institute" style="color:#3b82f6;">contact@liota.institute</a>.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;">© 2025 Language Institute Of The Americas · LIOTA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

// ─── Default Test Questions Seed ──────────────────────────────────────────────
const DEFAULT_TESTS = [
  {
    title: "General English Placement Test",
    description: "Comprehensive 30-question test covering grammar, vocabulary, reading, and listening across all CEFR levels (A1–C2). Use this as your standard placement test for new students.",
    version: "v1",
    targetLevel: "mixed" as const,
    durationMinutes: 30,
    questions: [
      // A1 Questions
      { q: "She ___ a teacher.", opts: ["am", "is", "are", "be"], ans: "is", skill: "grammar", cefr: "A1" },
      { q: "What color is the sky?", opts: ["Green", "Red", "Blue", "Yellow"], ans: "Blue", skill: "vocabulary", cefr: "A1" },
      { q: "I ___ from Mexico.", opts: ["am", "is", "are", "be"], ans: "am", skill: "grammar", cefr: "A1" },
      { q: "How many days are in a week?", opts: ["5", "6", "7", "8"], ans: "7", skill: "vocabulary", cefr: "A1" },
      { q: "The opposite of 'big' is ___.", opts: ["tall", "small", "fast", "loud"], ans: "small", skill: "vocabulary", cefr: "A1" },
      // A2 Questions
      { q: "She ___ to school every day.", opts: ["go", "goes", "going", "gone"], ans: "goes", skill: "grammar", cefr: "A2" },
      { q: "We ___ dinner when he called.", opts: ["have", "had", "were having", "are having"], ans: "were having", skill: "grammar", cefr: "A2" },
      { q: "Choose the correct sentence:", opts: ["I have 25 years.", "I am 25 years old.", "I got 25 years.", "My age is 25 years."], ans: "I am 25 years old.", skill: "grammar", cefr: "A2" },
      { q: "What does 'frequently' mean?", opts: ["never", "sometimes", "often", "rarely"], ans: "often", skill: "vocabulary", cefr: "A2" },
      { q: "The train ___ at 9 AM tomorrow.", opts: ["leaves", "left", "leaving", "leave"], ans: "leaves", skill: "grammar", cefr: "A2" },
      // B1 Questions
      { q: "If I ___ rich, I would travel the world.", opts: ["am", "was", "were", "be"], ans: "were", skill: "grammar", cefr: "B1" },
      { q: "The report ___ by the manager yesterday.", opts: ["wrote", "was written", "has written", "is writing"], ans: "was written", skill: "grammar", cefr: "B1" },
      { q: "She suggested ___ to the cinema.", opts: ["to go", "going", "go", "went"], ans: "going", skill: "grammar", cefr: "B1" },
      { q: "What does 'ambiguous' mean?", opts: ["clear", "uncertain", "simple", "obvious"], ans: "uncertain", skill: "vocabulary", cefr: "B1" },
      { q: "By the time she arrived, we ___ for an hour.", opts: ["waited", "were waiting", "had been waiting", "have waited"], ans: "had been waiting", skill: "grammar", cefr: "B1" },
      // B2 Questions
      { q: "Despite ___ tired, she finished the project.", opts: ["be", "being", "been", "to be"], ans: "being", skill: "grammar", cefr: "B2" },
      { q: "The new policy ___ a significant impact on employees.", opts: ["has had", "had had", "was having", "have had"], ans: "has had", skill: "grammar", cefr: "B2" },
      { q: "Choose the most formal alternative for 'find out':", opts: ["discover", "look up", "check out", "dig up"], ans: "discover", skill: "vocabulary", cefr: "B2" },
      { q: "Not only ___ late, but he also forgot his presentation.", opts: ["he was", "was he", "he is", "is he"], ans: "was he", skill: "grammar", cefr: "B2" },
      { q: "What does 'mitigate' mean?", opts: ["worsen", "ignore", "reduce", "eliminate"], ans: "reduce", skill: "vocabulary", cefr: "B2" },
      // C1 Questions
      { q: "Had I known about the problem, I ___ earlier.", opts: ["would intervene", "would have intervened", "had intervened", "intervened"], ans: "would have intervened", skill: "grammar", cefr: "C1" },
      { q: "The author's prose is characterized by its ___.", opts: ["lucidity", "opacity", "verbosity", "ambiguity"], ans: "lucidity", skill: "vocabulary", cefr: "C1" },
      { q: "Which sentence uses the subjunctive correctly?", opts: ["I wish I was there.", "I wish I were there.", "I wish I am there.", "I wish I be there."], ans: "I wish I were there.", skill: "grammar", cefr: "C1" },
      { q: "What does 'sycophantic' mean?", opts: ["critical", "flattering to gain favor", "honest", "indifferent"], ans: "flattering to gain favor", skill: "vocabulary", cefr: "C1" },
      { q: "The legislation was passed ___ strong opposition.", opts: ["despite of", "in spite", "notwithstanding", "regardless"], ans: "notwithstanding", skill: "grammar", cefr: "C1" },
      // C2 Questions
      { q: "Which word best completes: 'The politician's ___ speech won few converts.'?", opts: ["eloquent", "bombastic", "succinct", "measured"], ans: "bombastic", skill: "vocabulary", cefr: "C2" },
      { q: "Identify the grammatically correct sentence:", opts: ["Whomever did this will be punished.", "Whoever did this will be punished.", "Who did this will be punished.", "Whom did this will be punished."], ans: "Whoever did this will be punished.", skill: "grammar", cefr: "C2" },
      { q: "What does 'pellucid' mean?", opts: ["murky", "translucently clear", "opaque", "colorful"], ans: "translucently clear", skill: "vocabulary", cefr: "C2" },
      { q: "The ___ of the argument rested on a single unproven assumption.", opts: ["crux", "apex", "nadir", "zenith"], ans: "crux", skill: "vocabulary", cefr: "C2" },
      { q: "Which sentence is grammatically correct?", opts: ["The data shows a clear trend.", "The data show a clear trend.", "Both are correct depending on context.", "Neither is correct."], ans: "Both are correct depending on context.", skill: "grammar", cefr: "C2" },
    ],
  },
];

export const placementTestsRouter = router({
  // ─── List all tests ──────────────────────────────────────────────────────
  list: protectedProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const tests = await db
      .select()
      .from(placementTests)
      .orderBy(desc(placementTests.createdAt));
    // Get question counts
    const counts = await db
      .select({ testId: testQuestions.testId })
      .from(testQuestions);
    const countMap: Record<number, number> = {};
    for (const c of counts) {
      countMap[c.testId] = (countMap[c.testId] || 0) + 1;
    }
    return tests.map((t) => ({ ...t, questionCount: countMap[t.id] || 0 }));
  }),

  // ─── Get test with questions ─────────────────────────────────────────────
  getWithQuestions: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [test] = await db
        .select()
        .from(placementTests)
        .where(eq(placementTests.id, input.id));
      if (!test) throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });
      const questions = await db
        .select()
        .from(testQuestions)
        .where(eq(testQuestions.testId, input.id))
        .orderBy(testQuestions.orderIndex);
      return { ...test, questions };
    }),

  // ─── Create test ─────────────────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      version: z.string().default("v1"),
      targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "mixed"]).default("mixed"),
      durationMinutes: z.number().int().min(5).max(180).default(30),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(placementTests).values(input);
      return { id: (result as any).insertId };
    }),

  // ─── Update test ─────────────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      version: z.string().optional(),
      targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2", "mixed"]).optional(),
      durationMinutes: z.number().int().min(5).max(180).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, ...data } = input;
      await db.update(placementTests).set(data).where(eq(placementTests.id, id));
      return { success: true };
    }),

  // ─── Delete test ─────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(placementTests).where(eq(placementTests.id, input.id));
      return { success: true };
    }),

  // ─── Upsert questions (replace all questions for a test) ─────────────────
  saveQuestions: protectedProcedure
    .input(z.object({
      testId: z.number(),
      questions: z.array(z.object({
        id: z.number().optional(),
        orderIndex: z.number(),
        questionText: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctAnswer: z.string().min(1),
        points: z.number().int().min(1).default(1),
        skill: z.enum(["grammar", "vocabulary", "reading", "listening", "writing"]),
        cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Delete existing questions
      await db.delete(testQuestions).where(eq(testQuestions.testId, input.testId));
      // Insert new questions
      if (input.questions.length > 0) {
        await db.insert(testQuestions).values(
          input.questions.map((q) => ({
            testId: input.testId,
            orderIndex: q.orderIndex,
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            points: q.points,
            skill: q.skill,
            cefrLevel: q.cefrLevel,
          }))
        );
      }
      return { success: true };
    }),

  // ─── Seed default tests ──────────────────────────────────────────────────
  seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const existing = await db.select().from(placementTests);
    if (existing.length > 0) return { message: "Tests already exist", count: existing.length };

    for (const testDef of DEFAULT_TESTS) {
      const [result] = await db.insert(placementTests).values({
        title: testDef.title,
        description: testDef.description,
        version: testDef.version,
        targetLevel: testDef.targetLevel,
        durationMinutes: testDef.durationMinutes,
      });
      const testId = (result as any).insertId;
      await db.insert(testQuestions).values(
        testDef.questions.map((q, i) => ({
          testId,
          orderIndex: i,
          questionText: q.q,
          options: JSON.stringify(q.opts),
          correctAnswer: q.ans,
          points: 1,
          skill: q.skill as any,
          cefrLevel: q.cefr as any,
        }))
      );
    }
    return { message: "Default tests seeded", count: DEFAULT_TESTS.length };
  }),

  // ─── Send test to student ────────────────────────────────────────────────
  sendToStudent: protectedProcedure
    .input(z.object({
      testId: z.number(),
      studentId: z.number().optional(),
      recipientEmail: z.string().email(),
      recipientName: z.string(),
      expiryDays: z.number().int().min(1).max(30).default(7),
      origin: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // Get test
      const [test] = await db
        .select()
        .from(placementTests)
        .where(eq(placementTests.id, input.testId));
      if (!test) throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });

      // Generate unique token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiryDays * 24 * 60 * 60 * 1000);
      const testUrl = `${input.origin}/test/${token}`;

      // Create submission record
      await db.insert(testSubmissions).values({
        testId: input.testId,
        studentId: input.studentId ?? null,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        token,
        status: "pending",
        expiresAt,
      });

      // Send email
      const { html, subject } = buildTestEmail({
        recipientName: input.recipientName,
        testTitle: test.title,
        testUrl,
        expiresAt,
        durationMinutes: test.durationMinutes,
      });

      const { error } = await resend.emails.send({
        from: "LIOTA Institute <contact@liota.institute>",
        to: input.recipientEmail,
        subject,
        html,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Email failed: ${error.message}`,
        });
      }

      return { success: true, token, testUrl };
    }),

  // ─── Get public test by token (no auth required) ─────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [submission] = await db
        .select()
        .from(testSubmissions)
        .where(eq(testSubmissions.token, input.token));

      if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Test not found" });
      if (submission.status === "completed") {
        return { status: "completed" as const, cefrResult: submission.cefrResult, percentScore: submission.percentScore };
      }
      if (submission.status === "expired" || new Date(submission.expiresAt) < new Date()) {
        await db.update(testSubmissions).set({ status: "expired" }).where(eq(testSubmissions.token, input.token));
        return { status: "expired" as const };
      }

      // Get test + questions (without correct answers)
      const [test] = await db.select().from(placementTests).where(eq(placementTests.id, submission.testId));
      const questions = await db
        .select({
          id: testQuestions.id,
          orderIndex: testQuestions.orderIndex,
          questionText: testQuestions.questionText,
          options: testQuestions.options,
          points: testQuestions.points,
          skill: testQuestions.skill,
          cefrLevel: testQuestions.cefrLevel,
        })
        .from(testQuestions)
        .where(eq(testQuestions.testId, submission.testId))
        .orderBy(testQuestions.orderIndex);

      // Mark as in_progress if first access
      if (submission.status === "pending") {
        await db.update(testSubmissions).set({ status: "in_progress", startedAt: new Date() }).where(eq(testSubmissions.token, input.token));
      }

      return {
        status: "active" as const,
        submission: {
          id: submission.id,
          recipientName: submission.recipientName,
          expiresAt: submission.expiresAt,
        },
        test: {
          id: test.id,
          title: test.title,
          durationMinutes: test.durationMinutes,
        },
        questions: questions.map((q) => ({
          ...q,
          options: JSON.parse(q.options) as string[],
        })),
      };
    }),

  // ─── Submit answers (public) ─────────────────────────────────────────────
  submitAnswers: publicProcedure
    .input(z.object({
      token: z.string(),
      answers: z.record(z.string(), z.string()), // { questionId: selectedAnswer }
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [submission] = await db
        .select()
        .from(testSubmissions)
        .where(eq(testSubmissions.token, input.token));

      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
      if (submission.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Test already submitted" });
      if (new Date(submission.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Test has expired" });

      // Get questions with correct answers
      const questions = await db
        .select()
        .from(testQuestions)
        .where(eq(testQuestions.testId, submission.testId));

      const { score, maxScore, percent } = scoreAnswers(questions, input.answers);
      const cefrResult = mapScoreToCEFR(percent);

      // Update submission
      await db.update(testSubmissions).set({
        status: "completed",
        score,
        maxScore,
        percentScore: percent,
        cefrResult,
        answers: JSON.stringify(input.answers),
        completedAt: new Date(),
      }).where(eq(testSubmissions.token, input.token));

      // Update student's CEFR level if linked
      if (submission.studentId) {
        await db.update(students).set({ mcerLevel: cefrResult }).where(eq(students.id, submission.studentId));
      }

      return { score, maxScore, percent, cefrResult };
    }),

  // ─── List submissions (admin) ────────────────────────────────────────────
  listSubmissions: protectedProcedure
    .input(z.object({
      studentId: z.number().optional(),
      testId: z.number().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(testSubmissions)
        .orderBy(desc(testSubmissions.createdAt));

      return rows.filter((r) => {
        if (input.studentId && r.studentId !== input.studentId) return false;
        if (input.testId && r.testId !== input.testId) return false;
        if (input.status && r.status !== input.status) return false;
        return true;
      });
    }),

  // ─── Test Schedules ──────────────────────────────────────────────────────
  listSchedules: protectedProcedure
    .input(z.object({ studentId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(testSchedules)
        .orderBy(desc(testSchedules.createdAt));
      if (input.studentId) return rows.filter((r) => r.studentId === input.studentId);
      return rows;
    }),

  createSchedule: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      testId: z.number(),
      scheduledAt: z.string(), // ISO date string
      isRecurring: z.boolean().default(false),
      intervalMonths: z.number().int().min(1).max(24).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const scheduledAt = new Date(input.scheduledAt);
      const nextSendAt = input.isRecurring && input.intervalMonths
        ? new Date(scheduledAt.getTime() + input.intervalMonths * 30 * 24 * 60 * 60 * 1000)
        : null;

      await db.insert(testSchedules).values({
        studentId: input.studentId,
        testId: input.testId,
        scheduledAt,
        isRecurring: input.isRecurring,
        intervalMonths: input.intervalMonths ?? null,
        nextSendAt,
        notes: input.notes ?? null,
        status: "active",
      });
      return { success: true };
    }),

  updateSchedule: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "paused", "completed", "cancelled"]).optional(),
      scheduledAt: z.string().optional(),
      isRecurring: z.boolean().optional(),
      intervalMonths: z.number().int().min(1).max(24).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "coordinator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, ...data } = input;
      const updateData: Record<string, any> = { ...data };
      if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
      await db.update(testSchedules).set(updateData).where(eq(testSchedules.id, id));
      return { success: true };
    }),

  deleteSchedule: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(testSchedules).where(eq(testSchedules.id, input.id));
      return { success: true };
    }),

  // ─── Run due schedules (called by cron or admin) ─────────────────────────
  runDueSchedules: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const now = new Date();

      const due = await db
        .select()
        .from(testSchedules)
        .where(and(
          eq(testSchedules.status, "active"),
          lte(testSchedules.scheduledAt, now)
        ));

      let sent = 0;
      let errors = 0;

      for (const schedule of due) {
        try {
          // Get student info
          const [student] = await db.select().from(students).where(eq(students.id, schedule.studentId));
          if (!student || !student.email) continue;

          const [test] = await db.select().from(placementTests).where(eq(placementTests.id, schedule.testId));
          if (!test) continue;

          // Generate token and send
          const token = crypto.randomBytes(32).toString("hex");
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const testUrl = `${input.origin}/test/${token}`;

          await db.insert(testSubmissions).values({
            testId: schedule.testId,
            studentId: schedule.studentId,
            recipientEmail: student.email,
            recipientName: `${student.firstName} ${student.lastName}`,
            token,
            status: "pending",
            expiresAt,
          });

          const { html, subject } = buildTestEmail({
            recipientName: `${student.firstName} ${student.lastName}`,
            testTitle: test.title,
            testUrl,
            expiresAt,
            durationMinutes: test.durationMinutes,
          });

          await resend.emails.send({
            from: "LIOTA Institute <contact@liota.institute>",
            to: student.email,
            subject,
            html,
          });

          // Update schedule
          if (schedule.isRecurring && schedule.intervalMonths) {
            const nextSendAt = new Date(now.getTime() + schedule.intervalMonths * 30 * 24 * 60 * 60 * 1000);
            await db.update(testSchedules).set({
              lastSentAt: now,
              scheduledAt: nextSendAt,
              nextSendAt,
            }).where(eq(testSchedules.id, schedule.id));
          } else {
            await db.update(testSchedules).set({
              lastSentAt: now,
              status: "completed",
            }).where(eq(testSchedules.id, schedule.id));
          }
          sent++;
        } catch {
          errors++;
        }
      }

      return { sent, errors, total: due.length };
    }),
});
