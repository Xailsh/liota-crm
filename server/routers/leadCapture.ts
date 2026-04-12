/**
 * Lead Capture Form Router
 *
 * Public endpoint for the embeddable lead capture form.
 * On submission: saves to leadFormSubmissions, creates CRM lead,
 * auto-enrolls in drip sequence, notifies marketing team.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendEmail, buildLeadAssignmentEmail } from "../email";
import { ENV } from "../_core/env";
import {
  leadFormSubmissions,
  leads,
  users,
} from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { enrollLeadInDrip } from "./drip";

export const leadCaptureRouter = router({
  // Public: submit the lead capture form
  submit: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        email: z.string().email(),
        phone: z.string().max(50).optional(),
        interestedProgram: z.string().max(100).optional(),
        preferredCampus: z.string().max(100).optional(),
        hearAboutUs: z.string().max(200).optional(),
        source: z.string().max(100).default("website_form"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // 1. Save to leadFormSubmissions
      await db.insert(leadFormSubmissions).values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        interestedProgram: input.interestedProgram ?? null,
        preferredCampus: input.preferredCampus ?? null,
        hearAboutUs: input.hearAboutUs ?? null,
        source: input.source,
        ipAddress: (ctx as any)?.req?.ip ?? null,
      });

      // 2. Create CRM lead
      const programLabel = input.interestedProgram
        ? `Program: ${input.interestedProgram}`
        : "";
      const campusLabel = input.preferredCampus
        ? `Campus: ${input.preferredCampus}`
        : "";
      const hearLabel = input.hearAboutUs
        ? `Heard via: ${input.hearAboutUs}`
        : "";
      const notes = [programLabel, campusLabel, hearLabel]
        .filter(Boolean)
        .join("\n");

      const [newLead] = await db
        .insert(leads)
        .values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone ?? null,
          source: input.source,
          stage: "new_lead",
          notes: notes || null,
          interestedProgram: input.interestedProgram as any ?? null,
          preferredCampus: input.preferredCampus as any ?? null,
        })
        .$returningId();

      const leadId = newLead.id;

      // 3. Auto-enroll in default drip sequence
      try {
        await enrollLeadInDrip({
          leadId,
          leadEmail: input.email,
          leadName: `${input.firstName} ${input.lastName}`.trim(),
        });
      } catch (err) {
        console.warn("[LeadCapture] Could not enroll lead in drip:", err);
      }

      // 4. Notify marketing team by email
      try {
        const marketingUsers = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(inArray(users.role, ["marketing", "admin"]));

        const emails = marketingUsers
          .map((u) => u.email)
          .filter((e): e is string => !!e);

        if (emails.length > 0) {
          const html = buildLeadAssignmentEmail({
            leadName: `${input.firstName} ${input.lastName}`,
            leadEmail: input.email,
            leadPhone: input.phone,
            stage: "new_lead",
            source: input.source,
            notes: notes || undefined,
            assignerName: "Website Lead Form",
            crmUrl: ENV.appUrl,
          });
          await sendEmail({
            to: emails,
            subject: `🌐 New Website Lead: ${input.firstName} ${input.lastName}`,
            html,
          });
        }
      } catch (err) {
        console.warn("[LeadCapture] Could not notify marketing team:", err);
      }

      return { success: true, leadId };
    }),

  // Protected: list form submissions (admin/marketing/coordinator)
  listSubmissions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!["admin", "marketing", "coordinator"].includes(ctx.user.role ?? ""))
        throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return { submissions: [], total: 0 };
      const submissions = await db
        .select()
        .from(leadFormSubmissions)
        .orderBy(leadFormSubmissions.createdAt)
        .limit(input.limit)
        .offset(input.offset);
      return { submissions, total: submissions.length };
    }),

  // Protected: get stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (!["admin", "marketing", "coordinator"].includes(ctx.user.role ?? ""))
      throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { total: 0, today: 0, thisWeek: 0 };
    const all = await db.select({ id: leadFormSubmissions.id, createdAt: leadFormSubmissions.createdAt }).from(leadFormSubmissions);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    return {
      total: all.length,
      today: all.filter((s) => new Date(s.createdAt) >= todayStart).length,
      thisWeek: all.filter((s) => new Date(s.createdAt) >= weekStart).length,
    };
  }),
});
