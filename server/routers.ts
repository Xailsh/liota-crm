import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAssessment,
  createCampaign,
  createClass,
  createCommunication,
  createContact,
  createExpense,
  createInstructor,
  createLead,
  createPayment,
  createProgram,
  createStudent,
  deleteContact,
  deleteCampaign,
  deleteLead,
  deleteStudent,
  getAnalytics,
  getAssessments,
  getCampaigns,
  getClasses,
  getCommunications,
  getContacts,
  getDashboardMetrics,
  getExpenses,
  getFinancialDashboard,
  getInstructors,
  getLeads,
  getPayments,
  getPrograms,
  getStudentById,
  getStudents,
  seedDemoData,
  updateCampaign,
  updateClass,
  updateContact,
  updateLead,
  updatePayment,
  updateProgram,
  updateStudent,
} from "./db";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    metrics: protectedProcedure.query(async () => {
      return await getDashboardMetrics();
    }),
    seed: protectedProcedure.mutation(async () => {
      return await seedDemoData();
    }),
  }),

  // ─── Students ──────────────────────────────────────────────────────────────
  students: router({
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          campus: z.string().optional(),
          ageGroup: z.string().optional(),
          enrollmentStatus: z.string().optional(),
          programId: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getStudents(input);
      }),
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getStudentById(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().optional(),
          dateOfBirth: z.string().optional(),
          ageGroup: z.enum(["children", "teens", "adults"]),
          programId: z.number().optional(),
          campus: z.enum(["merida", "dallas", "denver", "vienna", "online"]),
          mcerLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
          enrollmentStatus: z.enum(["active", "inactive", "trial", "graduated", "suspended"]).default("trial"),
          parentName: z.string().optional(),
          parentEmail: z.string().optional(),
          parentPhone: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createStudent(input as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          firstName: z.string().min(1).optional(),
          lastName: z.string().min(1).optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          ageGroup: z.enum(["children", "teens", "adults"]).optional(),
          programId: z.number().optional(),
          campus: z.enum(["merida", "dallas", "denver", "vienna", "online"]).optional(),
          mcerLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
          enrollmentStatus: z.enum(["active", "inactive", "trial", "graduated", "suspended"]).optional(),
          parentName: z.string().optional(),
          parentEmail: z.string().optional(),
          parentPhone: z.string().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateStudent(id, data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteStudent(input.id);
        return { success: true };
      }),
  }),

  // ─── Programs ──────────────────────────────────────────────────────────────
  programs: router({
    list: protectedProcedure.query(async () => {
      return await getPrograms();
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["children", "teens", "adults", "business", "polyglot", "immersion", "homeschool"]),
          description: z.string().optional(),
          durationHours: z.number().optional(),
          priceUsd: z.string().optional(),
          maxStudents: z.number().default(6),
          modality: z.enum(["online", "onsite", "hybrid"]).default("hybrid"),
        })
      )
      .mutation(async ({ input }) => {
        await createProgram(input as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          priceUsd: z.string().optional(),
          status: z.enum(["active", "inactive"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProgram(id, data as any);
        return { success: true };
      }),
  }),

  // ─── Instructors ───────────────────────────────────────────────────────────
  instructors: router({
    list: protectedProcedure.query(async () => {
      return await getInstructors();
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          campus: z.enum(["merida", "dallas", "denver", "vienna", "online"]),
          specialization: z.string().optional(),
          certifications: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createInstructor(input as any);
        return { success: true };
      }),
  }),

  // ─── Classes ───────────────────────────────────────────────────────────────
  classes: router({
    list: protectedProcedure
      .input(
        z.object({
          campus: z.string().optional(),
          status: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getClasses(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          programId: z.number().optional(),
          instructorId: z.number().optional(),
          campus: z.enum(["merida", "dallas", "denver", "vienna", "online"]),
          modality: z.enum(["online", "onsite"]).default("onsite"),
          maxStudents: z.number().default(6),
          schedule: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createClass(input as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          instructorId: z.number().optional(),
          status: z.enum(["scheduled", "active", "completed", "cancelled"]).optional(),
          currentStudents: z.number().optional(),
          schedule: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateClass(id, data as any);
        return { success: true };
      }),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    list: protectedProcedure
      .input(
        z.object({
          stage: z.string().optional(),
          campus: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getLeads(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().optional(),
          phone: z.string().optional(),
          ageGroup: z.enum(["children", "teens", "adults"]).optional(),
          interestedProgram: z.enum(["children", "teens", "adults", "business", "polyglot", "immersion", "homeschool"]).optional(),
          preferredCampus: z.enum(["merida", "dallas", "denver", "vienna", "online"]).optional(),
          stage: z.enum(["new_lead", "contacted", "trial_scheduled", "trial_done", "proposal_sent", "enrolled", "lost"]).default("new_lead"),
          source: z.string().optional(),
          notes: z.string().optional(),
          trialDate: z.string().optional(),
          assignedTo: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createLead(input as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          stage: z.enum(["new_lead", "contacted", "trial_scheduled", "trial_done", "proposal_sent", "enrolled", "lost"]).optional(),
          notes: z.string().optional(),
          trialDate: z.string().optional(),
          assignedTo: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateLead(id, data as any);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteLead(input.id);
        return { success: true };
      }),
  }),

  // ─── Payments ──────────────────────────────────────────────────────────────
  payments: router({
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          studentId: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getPayments(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          studentId: z.number(),
          programId: z.number().optional(),
          amount: z.string(),
          currency: z.string().default("USD"),
          method: z.enum(["paypal", "card", "cash", "transfer"]),
          status: z.enum(["pending", "completed", "failed", "refunded"]).default("pending"),
          description: z.string().optional(),
          invoiceNumber: z.string().optional(),
          dueDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createPayment(input as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
          paidAt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.paidAt) updateData.paidAt = new Date(data.paidAt);
        await updatePayment(id, updateData);
        return { success: true };
      }),
  }),

  // ─── Expenses ──────────────────────────────────────────────────────────────
  expenses: router({
    list: protectedProcedure
      .input(z.object({ campus: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await getExpenses(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          category: z.string().min(1),
          description: z.string().optional(),
          amount: z.string(),
          currency: z.string().default("USD"),
          campus: z.enum(["merida", "dallas", "denver", "vienna", "online", "general"]).default("general"),
          date: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await createExpense(input as any);
        return { success: true };
      }),
  }),

  // ─── Campaigns ─────────────────────────────────────────────────────────────
  campaigns: router({
    list: protectedProcedure.query(async () => {
      return await getCampaigns();
    }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          subject: z.string().min(1),
          body: z.string().min(1),
          templateType: z.enum(["promotion", "reminder", "newsletter", "welcome", "progress_report"]).default("newsletter"),
          segmentProgram: z.enum(["children", "teens", "adults", "business", "polyglot", "immersion", "homeschool", "all"]).default("all"),
          segmentCampus: z.enum(["merida", "dallas", "denver", "vienna", "online", "all"]).default("all"),
          segmentAgeGroup: z.enum(["children", "teens", "adults", "all"]).default("all"),
        })
      )
      .mutation(async ({ input }) => {
        await createCampaign({ ...input, status: "draft", recipientCount: 0, openCount: 0, clickCount: 0 } as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          subject: z.string().optional(),
          body: z.string().optional(),
          status: z.enum(["draft", "scheduled", "sent", "cancelled"]).optional(),
          recipientCount: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.status === "sent") {
          updateData.sentAt = new Date();
        }
        await updateCampaign(id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCampaign(input.id);
        return { success: true };
      }),
  }),

  // ─── Assessments ───────────────────────────────────────────────────────────
  assessments: router({
    list: protectedProcedure
      .input(z.object({ studentId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getAssessments(input?.studentId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          studentId: z.number(),
          assessmentDate: z.string(),
          mcerLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
          speakingScore: z.number().optional(),
          listeningScore: z.number().optional(),
          readingScore: z.number().optional(),
          writingScore: z.number().optional(),
          overallScore: z.number().optional(),
          notes: z.string().optional(),
          assessedBy: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createAssessment(input as any);
        // Also update student's MCER level
        await updateStudent(input.studentId, { mcerLevel: input.mcerLevel });
        return { success: true };
      }),
  }),

  // ─── Contacts ──────────────────────────────────────────────────────────────
  contacts: router({
    list: protectedProcedure
      .input(
        z.object({
          type: z.string().optional(),
          search: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return await getContacts(input);
      }),
    create: protectedProcedure
      .input(
        z.object({
          type: z.enum(["parent", "student", "lead", "partner"]).default("parent"),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().optional(),
          phone: z.string().optional(),
          relatedStudentId: z.number().optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createContact(input as any);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          notes: z.string().optional(),
          tags: z.string().optional(),
          lastContactedAt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.lastContactedAt) updateData.lastContactedAt = new Date(data.lastContactedAt);
        await updateContact(id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContact(input.id);
        return { success: true };
      }),
    communications: router({
      list: protectedProcedure
        .input(z.object({ contactId: z.number() }))
        .query(async ({ input }) => {
          return await getCommunications(input.contactId);
        }),
      create: protectedProcedure
        .input(
          z.object({
            contactId: z.number(),
            type: z.enum(["email", "phone", "whatsapp", "meeting", "note"]).default("note"),
            subject: z.string().optional(),
            content: z.string().optional(),
            direction: z.enum(["inbound", "outbound"]).default("outbound"),
          })
        )
        .mutation(async ({ input }) => {
          await createCommunication(input as any);
          await updateContact(input.contactId, { lastContactedAt: new Date() });
          return { success: true };
        }),
    }),
  }),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analytics: router({
    overview: protectedProcedure.query(async () => {
      return await getAnalytics();
    }),
  }),

  // ─── Financial Dashboard (Admin Only + PIN) ─────────────────────────────────
  financial: router({
    dashboard: adminProcedure
      .input(z.object({ pin: z.string().length(4) }))
      .query(async ({ input, ctx }) => {
        // PIN is validated on the frontend; server validates role only
        // The PIN "1234" is the default demo PIN (should be stored securely in production)
        const ADMIN_PIN = "1234";
        if (input.pin !== ADMIN_PIN) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorrecto" });
        }
        return await getFinancialDashboard();
      }),
    verifyPin: adminProcedure
      .input(z.object({ pin: z.string().length(4) }))
      .mutation(async ({ input }) => {
        const ADMIN_PIN = "1234";
        if (input.pin !== ADMIN_PIN) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorrecto" });
        }
        return { verified: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
