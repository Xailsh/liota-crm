/**
 * Drip Email Sequence Router
 *
 * Manages drip sequences, steps, enrollments, and the runDue job.
 * Sequences auto-enroll new leads and send timed follow-up emails.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendEmail } from "../email";
import {
  dripSequences,
  dripSteps,
  dripEnrollments,
  leads,
  users,
} from "../../drizzle/schema";
import { eq, and, lte, inArray } from "drizzle-orm";

// ─── Helper: Build drip email HTML ───────────────────────────────────────────
function buildDripEmailHtml(opts: {
  subject: string;
  bodyHtml: string;
  recipientName?: string;
  unsubscribeToken?: string;
}): string {
  let body = opts.bodyHtml
    .replace(/\{\{name\}\}/g, opts.recipientName ?? "")
    .replace(/\{\{first_name\}\}/g, opts.recipientName?.split(" ")[0] ?? "")
    .replace(/\{\{full_name\}\}/g, opts.recipientName ?? "");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 28px 40px; text-align: center;">
      <h1 style="color: #f59e0b; margin: 0; font-size: 26px; letter-spacing: 2px;">LIOTA</h1>
      <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Language Institute of The Americas</p>
    </div>
    <div style="padding: 36px 40px;">
      <div style="color: #374151; line-height: 1.8; font-size: 15px;">${body}</div>
    </div>
    <div style="background: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © 2026 Language Institute of The Americas (LIOTA)<br>
        <a href="https://liota.institute" style="color: #f59e0b;">liota.institute</a> |
        <a href="mailto:contact@liota.institute" style="color: #f59e0b;">contact@liota.institute</a>
      </p>
      ${opts.unsubscribeToken ? `<p style="margin: 8px 0 0; font-size: 11px; color: #9ca3af;">
        <a href="https://liotacrm-yzzjutco.manus.space/api/drip/unsubscribe?token=${opts.unsubscribeToken}" style="color: #9ca3af;">Unsubscribe</a>
      </p>` : ""}
    </div>
  </div>
</body>
</html>`;
}

// ─── Default LIOTA Drip Sequence Seed ────────────────────────────────────────
const DEFAULT_SEQUENCE_NAME = "LIOTA New Lead Nurture";
const DEFAULT_STEPS = [
  {
    dayOffset: 0,
    orderIndex: 0,
    subject: "Welcome to LIOTA Institute, {{first_name}}! 🌟",
    bodyHtml: `<p>Dear {{name}},</p>
<p>Welcome to <strong>LIOTA Institute</strong> — Language Institute Of The Americas!</p>
<p>We're so excited you reached out. Whether you're looking to learn English, Spanish, French, Portuguese, or become a true polyglot, we have the perfect program for you.</p>
<p>Here's what makes LIOTA special:</p>
<ul>
  <li>Expert native-speaking instructors</li>
  <li>CEFR-aligned curriculum (A1–C2)</li>
  <li>Campuses in Mérida, Dallas, Denver, Vienna, Nottingham &amp; Online</li>
  <li>Flexible scheduling — mornings, evenings, weekends</li>
  <li>STEAM-integrated learning for children &amp; teens</li>
</ul>
<p>Your journey to multilingual fluency starts now. We'll be in touch soon to schedule a free consultation!</p>
<p>Warm regards,<br><strong>The LIOTA Institute Team</strong></p>`,
  },
  {
    dayOffset: 3,
    orderIndex: 1,
    subject: "{{first_name}}, discover all our programs at LIOTA",
    bodyHtml: `<p>Dear {{name}},</p>
<p>It's been a few days since you connected with us, and we wanted to share more about what LIOTA Institute offers:</p>
<ul>
  <li>🌟 <strong>ESL</strong> — English as a Second Language (A1–C2)</li>
  <li>🌟 <strong>SSL</strong> — Spanish as a Second Language (A1–C2)</li>
  <li>🌟 <strong>Polyglot Program</strong> — Master 3+ languages simultaneously</li>
  <li>🌟 <strong>Business Language</strong> — Professional communication skills</li>
  <li>🌟 <strong>STEAM Integration</strong> — Language + Science/Technology/Arts</li>
  <li>🌟 <strong>Seasonal Camps</strong> — Immersive Winter, Spring, Summer &amp; Fall camps</li>
</ul>
<p>Our rates are designed to be accessible:</p>
<ul>
  <li>Mexico: 200 MXN/hour</li>
  <li>USA: $20 USD/hour</li>
</ul>
<p>Ready to take the next step? Reply to this email or call us to learn more.</p>
<p>Warm regards,<br><strong>The LIOTA Team</strong></p>`,
  },
  {
    dayOffset: 7,
    orderIndex: 2,
    subject: "FREE Trial Class — Claim yours today, {{first_name}}!",
    bodyHtml: `<p>Dear {{name}},</p>
<p>We'd love to invite you to a completely <strong>FREE trial class</strong> at LIOTA Institute!</p>
<p>This is your chance to:</p>
<ul>
  <li>✅ Meet one of our expert instructors</li>
  <li>✅ Experience our teaching methodology firsthand</li>
  <li>✅ Get a personalized language assessment</li>
  <li>✅ Ask all your questions about programs and pricing</li>
</ul>
<p>No commitment required — just show up and see if LIOTA is the right fit for you!</p>
<p>Reply to this email or contact us at <a href="mailto:contact@liota.institute">contact@liota.institute</a> to schedule your free trial.</p>
<p>Warm regards,<br><strong>The LIOTA Team</strong></p>`,
  },
  {
    dayOffset: 14,
    orderIndex: 3,
    subject: "{{first_name}}, your language journey awaits — enroll today!",
    bodyHtml: `<p>Dear {{name}},</p>
<p>We've been thinking about you! Two weeks ago you expressed interest in LIOTA Institute, and we want to make sure you don't miss out on the opportunity to transform your language skills.</p>
<p><strong>Why enroll now?</strong></p>
<ul>
  <li>🎓 Classes starting every month</li>
  <li>💰 Flexible payment plans available</li>
  <li>🌍 Join students from 30+ countries</li>
  <li>📜 Receive CEFR-recognized certificates</li>
</ul>
<p>Our enrollment team is ready to help you find the perfect program, schedule, and campus (or online option) for your needs.</p>
<p><strong>Ready to start?</strong> Reply to this email or visit us at <a href="https://liota.institute">liota.institute</a></p>
<p>We look forward to welcoming you to the LIOTA family!</p>
<p>Warm regards,<br><strong>The LIOTA Institute Team</strong></p>`,
  },
];

// ─── Helper: Seed default sequence if none exists ─────────────────────────────
async function ensureDefaultSequence() {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select({ id: dripSequences.id })
    .from(dripSequences)
    .where(eq(dripSequences.isDefault, true))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  // Create default sequence
  const [seq] = await db.insert(dripSequences).values({
    name: DEFAULT_SEQUENCE_NAME,
    description: "Automatic 4-email nurture sequence for new leads (Day 0, 3, 7, 14)",
    isActive: true,
    isDefault: true,
  }).$returningId();

  const seqId = seq.id;

  // Insert steps
  for (const step of DEFAULT_STEPS) {
    await db.insert(dripSteps).values({
      sequenceId: seqId,
      dayOffset: step.dayOffset,
      orderIndex: step.orderIndex,
      subject: step.subject,
      bodyHtml: step.bodyHtml,
    });
  }

  return seqId;
}

// ─── Helper: Enroll a lead into a sequence ────────────────────────────────────
export async function enrollLeadInDrip(opts: {
  leadId: number;
  leadEmail: string;
  leadName: string;
  sequenceId?: number;
}) {
  const db = await getDb();
  if (!db) return;

  const seqId = opts.sequenceId ?? (await ensureDefaultSequence());
  if (!seqId) return;

  // Check if already enrolled in this sequence
  const existing = await db
    .select({ id: dripEnrollments.id })
    .from(dripEnrollments)
    .where(
      and(
        eq(dripEnrollments.leadId, opts.leadId),
        eq(dripEnrollments.sequenceId, seqId)
      )
    )
    .limit(1);

  if (existing.length > 0) return; // Already enrolled

  // Get first step to determine nextSendAt
  const firstStep = await db
    .select({ dayOffset: dripSteps.dayOffset })
    .from(dripSteps)
    .where(eq(dripSteps.sequenceId, seqId))
    .orderBy(dripSteps.orderIndex)
    .limit(1);

  const dayOffset = firstStep[0]?.dayOffset ?? 0;
  const nextSendAt = new Date();
  nextSendAt.setDate(nextSendAt.getDate() + dayOffset);

  await db.insert(dripEnrollments).values({
    leadId: opts.leadId,
    sequenceId: seqId,
    leadEmail: opts.leadEmail,
    leadName: opts.leadName,
    status: "active",
    currentStepIndex: 0,
    nextSendAt,
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const dripRouter = router({
  // List all sequences
  listSequences: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const seqs = await db.select().from(dripSequences).orderBy(dripSequences.createdAt);
    // Get step counts and enrollment counts
    const result = await Promise.all(
      seqs.map(async (seq) => {
        const steps = await db
          .select({ id: dripSteps.id })
          .from(dripSteps)
          .where(eq(dripSteps.sequenceId, seq.id));
        const enrollments = await db
          .select({ id: dripEnrollments.id, status: dripEnrollments.status })
          .from(dripEnrollments)
          .where(eq(dripEnrollments.sequenceId, seq.id));
        return {
          ...seq,
          stepCount: steps.length,
          activeEnrollments: enrollments.filter((e) => e.status === "active").length,
          completedEnrollments: enrollments.filter((e) => e.status === "completed").length,
          totalEnrollments: enrollments.length,
        };
      })
    );
    return result;
  }),

  // Get sequence with steps
  getSequence: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [seq] = await db
        .select()
        .from(dripSequences)
        .where(eq(dripSequences.id, input.id))
        .limit(1);
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });
      const steps = await db
        .select()
        .from(dripSteps)
        .where(eq(dripSteps.sequenceId, input.id))
        .orderBy(dripSteps.orderIndex);
      return { ...seq, steps };
    }),

  // Create sequence
  createSequence: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "marketing"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // If setting as default, unset others
      if (input.isDefault) {
        await db.update(dripSequences).set({ isDefault: false });
      }
      const [seq] = await db.insert(dripSequences).values(input).$returningId();
      return { success: true, id: seq.id };
    }),

  // Update sequence
  updateSequence: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "marketing"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      if (data.isDefault) {
        await db.update(dripSequences).set({ isDefault: false });
      }
      await db.update(dripSequences).set(data).where(eq(dripSequences.id, id));
      return { success: true };
    }),

  // Delete sequence
  deleteSequence: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(dripSequences).where(eq(dripSequences.id, input.id));
      return { success: true };
    }),

  // List steps for a sequence
  listSteps: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(dripSteps)
        .where(eq(dripSteps.sequenceId, input.sequenceId))
        .orderBy(dripSteps.orderIndex);
    }),

  // Create step
  createStep: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number(),
        dayOffset: z.number().min(0),
        subject: z.string().min(1).max(500),
        bodyHtml: z.string().min(1),
        orderIndex: z.number().default(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "marketing"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [step] = await db.insert(dripSteps).values(input).$returningId();
      return { success: true, id: step.id };
    }),

  // Update step
  updateStep: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        dayOffset: z.number().min(0).optional(),
        subject: z.string().min(1).max(500).optional(),
        bodyHtml: z.string().min(1).optional(),
        orderIndex: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "marketing"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...data } = input;
      await db.update(dripSteps).set(data).where(eq(dripSteps.id, id));
      return { success: true };
    }),

  // Delete step
  deleteStep: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "marketing"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(dripSteps).where(eq(dripSteps.id, input.id));
      return { success: true };
    }),

  // Enroll a lead manually
  enroll: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        sequenceId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "marketing", "coordinator"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Fetch lead info
      const [lead] = await db
        .select({ firstName: leads.firstName, lastName: leads.lastName, email: leads.email })
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      if (!lead.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Lead has no email address" });
      await enrollLeadInDrip({
        leadId: input.leadId,
        leadEmail: lead.email,
        leadName: `${lead.firstName} ${lead.lastName}`.trim(),
        sequenceId: input.sequenceId,
      });
      return { success: true };
    }),

  // List enrollments
  listEnrollments: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number().optional(),
        status: z.enum(["active", "completed", "paused", "unsubscribed"]).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [];
      if (input.sequenceId) conditions.push(eq(dripEnrollments.sequenceId, input.sequenceId));
      if (input.status) conditions.push(eq(dripEnrollments.status, input.status));
      const query = db.select().from(dripEnrollments).orderBy(dripEnrollments.enrolledAt).limit(input.limit);
      if (conditions.length > 0) {
        return query.where(and(...conditions));
      }
      return query;
    }),

  // Seed default sequence
  seedDefault: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin")
      throw new TRPCError({ code: "FORBIDDEN" });
    const seqId = await ensureDefaultSequence();
    return { success: true, sequenceId: seqId };
  }),

  // Run due emails (admin-triggered or can be called by a cron-like mechanism)
  runDue: protectedProcedure.mutation(async ({ ctx }) => {
    if (!["admin", "marketing"].includes(ctx.user.role ?? ""))
      throw new TRPCError({ code: "FORBIDDEN" });
    return runDueEmails();
  }),
});

// ─── runDueEmails: exported for use by webhook handler ────────────────────────
export async function runDueEmails(): Promise<{ sent: number; failed: number; skipped: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0, skipped: 0 };

  const now = new Date();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  // Find active enrollments where nextSendAt <= now
  const dueEnrollments = await db
    .select()
    .from(dripEnrollments)
    .where(
      and(
        eq(dripEnrollments.status, "active"),
        lte(dripEnrollments.nextSendAt, now)
      )
    );

  for (const enrollment of dueEnrollments) {
    try {
      // Get the sequence steps ordered
      const steps = await db
        .select()
        .from(dripSteps)
        .where(eq(dripSteps.sequenceId, enrollment.sequenceId))
        .orderBy(dripSteps.orderIndex);

      if (steps.length === 0) {
        skipped++;
        continue;
      }

      const currentStep = steps[enrollment.currentStepIndex];
      if (!currentStep) {
        // All steps completed
        await db
          .update(dripEnrollments)
          .set({ status: "completed", completedAt: now })
          .where(eq(dripEnrollments.id, enrollment.id));
        skipped++;
        continue;
      }

      // Send the email
      const html = buildDripEmailHtml({
        subject: currentStep.subject,
        bodyHtml: currentStep.bodyHtml,
        recipientName: enrollment.leadName,
        unsubscribeToken: `${enrollment.id}-${enrollment.leadId}`,
      });

      const result = await sendEmail({
        to: enrollment.leadEmail,
        subject: currentStep.subject
          .replace(/\{\{first_name\}\}/g, enrollment.leadName.split(" ")[0])
          .replace(/\{\{name\}\}/g, enrollment.leadName),
        html,
      });

      if (result.success) {
        sent++;
        const nextStepIndex = enrollment.currentStepIndex + 1;
        const nextStep = steps[nextStepIndex];

        if (nextStep) {
          // Schedule next step
          const nextSendAt = new Date();
          nextSendAt.setDate(nextSendAt.getDate() + (nextStep.dayOffset - currentStep.dayOffset));
          await db
            .update(dripEnrollments)
            .set({ currentStepIndex: nextStepIndex, nextSendAt })
            .where(eq(dripEnrollments.id, enrollment.id));
        } else {
          // Mark as completed
          await db
            .update(dripEnrollments)
            .set({ status: "completed", completedAt: now })
            .where(eq(dripEnrollments.id, enrollment.id));
        }
      } else {
        failed++;
        console.error(`[Drip] Failed to send email to ${enrollment.leadEmail}:`, result.error);
      }
    } catch (err) {
      failed++;
      console.error(`[Drip] Error processing enrollment ${enrollment.id}:`, err);
    }
  }

  console.log(`[Drip] runDue complete: sent=${sent} failed=${failed} skipped=${skipped}`);
  return { sent, failed, skipped };
}
