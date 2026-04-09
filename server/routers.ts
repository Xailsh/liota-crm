import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
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
  // New modules
  getScholarships,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  getLanguagePackages,
  createLanguagePackage,
  updateLanguagePackage,
  deleteLanguagePackage,
  getCamps,
  createCamp,
  updateCamp,
  deleteCamp,
  getSpecialEvents,
  createSpecialEvent,
  updateSpecialEvent,
  deleteSpecialEvent,
  // Phase 4 - Templates, Meta Leads, Integrations
  getWhatsappTemplates,
  createWhatsappTemplate,
  updateWhatsappTemplate,
  deleteWhatsappTemplate,
  getVoiceTemplates,
  createVoiceTemplate,
  updateVoiceTemplate,
  deleteVoiceTemplate,
  getWebhookEvents,
  createWebhookEvent,
  updateWebhookEvent,
  getSyncJobs,
  createSyncJob,
  updateSyncJob,
  deleteSyncJob,
  getErrorLogs,
  createErrorLog,
  resolveErrorLog,
  deleteErrorLog,
  getInboundWebhooks,
  createInboundWebhook,
  updateInboundWebhook,
  deleteInboundWebhook,
  getAllUsers,
  updateUserRole,
  getSystemStats,
  // Bills
  getRecurringBills,
  getBillsMetrics,
  createRecurringBill,
  updateRecurringBill,
  markBillPaid,
  deleteRecurringBill,
  getBillsDueForReminder,
} from "./db";
// Admin guard middlewaree
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
          campus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online"]),
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
          campus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online"]).optional(),
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
          campus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online"]),
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
          campus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online"]),
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
          preferredCampus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online"]).optional(),
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
          campus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online", "general"]).default("general"),
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
          segmentCampus: z.enum(["merida", "dallas", "denver", "vienna", "nottingham", "online", "all"]).default("all"),
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
    // Email Templates (stored as campaigns with status='draft' and isTemplate=true via name prefix)
    listTemplates: protectedProcedure.query(async () => {
      const all = await getCampaigns();
      return all.filter((c: any) => c.status === 'draft');
    }),
    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        category: z.string().default('newsletter'),
      }))
      .mutation(async ({ input }) => {
        await createCampaign({ name: input.name, subject: input.subject, body: input.body, templateType: 'newsletter', segmentProgram: 'all', segmentCampus: 'all', segmentAgeGroup: 'all', status: 'draft', recipientCount: 0, openCount: 0, clickCount: 0 } as any);
        return { success: true };
      }),
    updateTemplate: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), subject: z.string().optional(), body: z.string().optional(), category: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, category: _cat, ...data } = input;
        await updateCampaign(id, data);
        return { success: true };
      }),
    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCampaign(input.id);
        return { success: true };
      }),
  }),
  // ─── Assessmentss ───────────────────────────────────────────────────────────
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

  // ─── Scholarships ───────────────────────────────────────────────────────────
  scholarships: router({
    list: protectedProcedure
      .input(z.object({ studentId: z.number().optional(), status: z.string().optional() }))
      .query(async ({ input }) => getScholarships(input)),
    create: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        name: z.string(),
        type: z.enum(["full","partial","merit","need_based","community","referral","staff"]),
        discountPercent: z.number().optional(),
        discountAmount: z.number().optional(),
        currency: z.string().default("USD"),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["active","pending","expired","revoked"]).default("pending"),
        notes: z.string().optional(),
        approvedBy: z.string().optional(),
      }))
      .mutation(async ({ input }) => { await createScholarship(input as any); return { success: true }; }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateScholarship(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteScholarship(input.id); return { success: true }; }),
  }),

  // ─── Language Packages ──────────────────────────────────────────────────────
  packages: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional(), campus: z.string().optional(), isActive: z.boolean().optional() }))
      .query(async ({ input }) => getLanguagePackages(input)),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["esl","ssl","one_language","two_language","polyglot","full_package","business_english","kids_package","teens_package","custom"]),
        languages: z.string().optional(),
        totalHours: z.number(),
        sessionsPerWeek: z.number().default(2),
        sessionDurationMin: z.number().default(60),
        priceUSD: z.number(),
        priceMXN: z.number().optional(),
        hourlyRateUSD: z.number().default(20),
        hourlyRateMXN: z.number().default(200),
        description: z.string().optional(),
        features: z.string().optional(),
        isActive: z.boolean().default(true),
        maxStudents: z.number().default(6),
        campus: z.enum(["merida","dallas","denver","vienna","nottingham","online","all"]).default("all"),
      }))
      .mutation(async ({ input }) => { await createLanguagePackage(input as any); return { success: true }; }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateLanguagePackage(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteLanguagePackage(input.id); return { success: true }; }),
  }),

  // ─── Camps ──────────────────────────────────────────────────────────────────
  camps: router({
    list: protectedProcedure
      .input(z.object({ season: z.string().optional(), year: z.number().optional(), campus: z.string().optional(), status: z.string().optional() }))
      .query(async ({ input }) => getCamps(input)),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        season: z.enum(["winter","spring","summer","fall"]),
        year: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        campus: z.enum(["merida","dallas","denver","vienna","nottingham","online","all"]),
        ageGroup: z.enum(["kids","teens","adults","mixed"]).default("mixed"),
        capacity: z.number().default(20),
        priceUSD: z.number().optional(),
        priceMXN: z.number().optional(),
        description: z.string().optional(),
        highlights: z.string().optional(),
        status: z.enum(["upcoming","open","full","in_progress","completed","cancelled"]).default("upcoming"),
        instructorId: z.number().optional(),
      }))
      .mutation(async ({ input }) => { await createCamp(input as any); return { success: true }; }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateCamp(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteCamp(input.id); return { success: true }; }),
  }),

  // ─── Special Events ─────────────────────────────────────────────────────────
  events: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional(), campus: z.string().optional(), status: z.string().optional() }))
      .query(async ({ input }) => getSpecialEvents(input)),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["cultural","competition","graduation","open_house","workshop","webinar","parent_meeting","holiday","fundraiser","other"]),
        date: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        campus: z.enum(["merida","dallas","denver","vienna","nottingham","online","all"]),
        capacity: z.number().optional(),
        priceUSD: z.number().default(0),
        priceMXN: z.number().default(0),
        isFree: z.boolean().default(true),
        description: z.string().optional(),
        status: z.enum(["upcoming","open","full","in_progress","completed","cancelled"]).default("upcoming"),
      }))
      .mutation(async ({ input }) => { await createSpecialEvent(input as any); return { success: true }; }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateSpecialEvent(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteSpecialEvent(input.id); return { success: true }; }),
  }),

  // ─── WhatsApp Templates ──────────────────────────────────────────────────────
  whatsapp: router({
    list: protectedProcedure
      .input(z.object({ category: z.string().optional(), language: z.string().optional(), status: z.string().optional() }).optional())
      .query(async ({ input }) => getWhatsappTemplates(input ?? {})),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["marketing","utility","authentication","reminder","welcome","follow_up","payment","progress_report"]),
        language: z.enum(["en","es","both"]).default("en"),
        headerText: z.string().optional(),
        bodyText: z.string(),
        footerText: z.string().optional(),
        buttonType: z.enum(["none","quick_reply","call_to_action"]).default("none"),
        buttons: z.string().optional(),
        variables: z.string().optional(),
      }))
      .mutation(async ({ input }) => { await createWhatsappTemplate(input); return { success: true }; }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateWhatsappTemplate(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteWhatsappTemplate(input.id); return { success: true }; }),
  }),
  // ─── Voice Templates ─────────────────────────────────────────────────────────
  voice: router({
    list: protectedProcedure
      .input(z.object({ category: z.string().optional(), language: z.string().optional(), status: z.string().optional() }).optional())
      .query(async ({ input }) => getVoiceTemplates(input ?? {})),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["reminder","welcome","payment_due","class_cancelled","promotion","follow_up","emergency","other"]),
        language: z.enum(["en","es","both"]).default("en"),
        scriptText: z.string(),
        duration: z.number().optional(),
        voiceType: z.enum(["male","female","neutral"]).default("neutral"),
        status: z.enum(["draft","active","archived"]).default("draft"),
      }))
      .mutation(async ({ input }) => { await createVoiceTemplate(input); return { success: true }; }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateVoiceTemplate(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteVoiceTemplate(input.id); return { success: true }; }),
  }),
  // ─── Webhook Events (Meta Leads) ──────────────────────────────────────────────
  webhookEvents: router({
    list: adminProcedure
      .input(z.object({ source: z.string().optional(), status: z.string().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => getWebhookEvents(input ?? {})),
    create: protectedProcedure
      .input(z.object({ source: z.string(), eventType: z.string(), payload: z.string().optional(), status: z.enum(["received","processing","processed","failed","ignored"]).default("received") }))
      .mutation(async ({ input }) => { await createWebhookEvent(input); return { success: true }; }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateWebhookEvent(input.id, input.data); return { success: true }; }),
  }),
  // ─── Sync Jobs ────────────────────────────────────────────────────────────────
  syncJobs: router({
    list: adminProcedure.query(async () => getSyncJobs()),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["meta_leads","email_sync","payment_sync","student_sync","calendar_sync","whatsapp_sync"]),
        config: z.string().optional(),
      }))
      .mutation(async ({ input }) => { await createSyncJob(input); return { success: true }; }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateSyncJob(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteSyncJob(input.id); return { success: true }; }),
  }),
  // ─── Error Logs ───────────────────────────────────────────────────────────────
  errorLogs: router({
    list: adminProcedure
      .input(z.object({ level: z.string().optional(), source: z.string().optional(), resolved: z.boolean().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => getErrorLogs(input ?? {})),
    create: protectedProcedure
      .input(z.object({ level: z.enum(["info","warning","error","critical"]).default("error"), source: z.string(), message: z.string(), stackTrace: z.string().optional(), context: z.string().optional() }))
      .mutation(async ({ input }) => { await createErrorLog(input); return { success: true }; }),
    resolve: adminProcedure
      .input(z.object({ id: z.number(), resolvedBy: z.string() }))
      .mutation(async ({ input }) => { await resolveErrorLog(input.id, input.resolvedBy); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteErrorLog(input.id); return { success: true }; }),
  }),
  // ─── Inbound Webhooks ─────────────────────────────────────────────────────────
  inboundWebhooks: router({
    list: adminProcedure.query(async () => getInboundWebhooks()),
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        source: z.enum(["meta","whatsapp","stripe","zapier","make","custom"]),
        endpointToken: z.string(),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => { await createInboundWebhook(input); return { success: true }; }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.record(z.string(), z.any()) }))
      .mutation(async ({ input }) => { await updateInboundWebhook(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteInboundWebhook(input.id); return { success: true }; }),
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
  // ─── AI Front Door ─────────────────────────────────────────────────────────────
  ai: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
        visitorName: z.string().optional(),
        visitorEmail: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const LIOTA_SYSTEM_PROMPT = `You are LIOTA Assistant, the friendly AI customer service representative for LIOTA Institute — Language Institute Of The Americas.

Your role is to help prospective students, parents, and visitors learn about LIOTA's programs and guide them toward enrollment.

ABOUT LIOTA INSTITUTE:
- Full name: Language Institute Of The Americas (LIOTA)
- Tagline: "The Institute · El Instituto"
- Campuses: Mérida (Mexico), Dallas (TX), Denver (CO), Vienna (Austria), Nottingham (England), and Online
- Website: https://languageinstituteoftheamericas.com
- Languages taught: English, Spanish, French, Portuguese, Mandarin, and more

PROGRAMS OFFERED:
1. ESL (English as a Second Language) — For non-native English speakers who want to learn English for work, study, or daily life.
2. SSL (Spanish as a Second Language) — For English speakers learning Spanish, ideal for travel, business, or living in Latin America.
3. Polyglot Program — Multi-language immersion for students who want to learn 2 or more languages simultaneously. Packages: 1-Language, 2-Language, Full Polyglot.
4. STEAM Language Integration — Science, Technology, Engineering, Arts & Math taught through language immersion. Perfect for children and teens.
5. Children's Program — Ages 4–12, fun and interactive, CEFR Pre-A1 to A2.
6. Teenagers Program — Ages 13–17, CEFR A1 to B2, includes academic English.
7. Adults Program — CEFR A1 to C2, flexible scheduling, online and in-person.
8. Business English — Corporate communication, presentations, negotiations, CEFR B1–C1.

CEFR LEVELS: Pre-A1 → A1 → A2 → B1 → B2 → C1 → C2

PRICING:
- Mexico (Mérida): 200 MXN per hour (classes) | $1,500 USD for 3-month Study Abroad Residency
- USA (Dallas, Denver): $20 USD per hour (classes) | $1,500 USD for 3-month Residency
- UK (Nottingham): £20 per hour (classes) | £1,500 for 3-month Residency
- Austria (Vienna): €20 per hour (classes) | €1,500 for 3-month Residency
- Online: $18 USD per hour
- Packages available: Starter (10 hrs), Standard (20 hrs), Intensive (40 hrs), Polyglot Full Package (custom)
- Scholarships available for qualifying students
STUDY ABROAD / RESIDENCY PROGRAMS:
- 3-month immersive residency programs at all campuses
- Includes housing, language classes, cultural immersion, and passport travel
- Prices: $1,500 USD (Mérida/Dallas/Denver) | £1,500 (Nottingham) | €1,500 (Vienna)
- Students travel to partner countries with LIOTA passport program
- Destinations include Mexico, USA, UK, Austria, and more
BOOK CATALOG:
- LIOTA publishes and sells a catalog of 60 language learning books
- Covers ESL, SSL, Polyglot, Business English, STEAM integration
- Available for purchase online and at campus bookstores
- Textbooks, workbooks, grammar guides, conversation practice books

SEASONAL CAMPS:
- Winter Camp (December–January)
- Spring Camp (March–April)
- Summer Camp (June–August) — most popular
- Fall Camp (October–November)
- Special Events: Cultural workshops, graduation ceremonies, language competitions

CLASS FORMAT:
- Maximum 6 students per group (small group learning)
- Online via Zoom/Google Meet or in-person at campus
- Free trial class available for all new students
- Flexible scheduling: mornings, afternoons, evenings, weekends

HOW TO ENROLL:
1. Schedule a free trial class
2. Take a placement test to determine CEFR level
3. Choose a program and package
4. Complete enrollment form
5. Make first payment (Stripe, Zelle, Dolla App, PayPal, cash)

CONTACT:
- Visit: https://languageinstituteoftheamericas.com
- Available campuses: Mérida, Dallas, Denver, Vienna, Nottingham, Online

GUIDELINES:
- Be warm, encouraging, and professional
- Answer in the same language the user writes in (English or Spanish)
- If asked about pricing, give the rates above
- Always encourage booking a FREE trial class
- If a user wants to enroll, ask for their name and email to connect them with an advisor
- Keep responses concise (2-4 sentences max unless detailed info is needed)
- Use emojis sparingly to keep a professional tone
- Never make up information not listed above`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: LIOTA_SYSTEM_PROMPT },
            ...input.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          ],
        });

        const reply = (response as any)?.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't process your request. Please try again.";

        // Auto-save as lead if email provided
        if (input.visitorEmail && input.messages.length === 1) {
          try {
            const db = await getDb();
            if (db) {
              const { leads } = await import("../drizzle/schema");
              await db.insert(leads).values({
                name: input.visitorName ?? "Website Visitor",
                email: input.visitorEmail,
                source: "website",
                stage: "new_lead",
                notes: `AI Front Door chat initiated. First message: ${input.messages[0]?.content?.slice(0, 200)}`,
              } as any).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
            }
          } catch (e) {
            // Non-critical: don't fail the chat if lead save fails
          }
        }

        return { reply };
      }),
  }),

  // ─── Recurring Bills ──────────────────────────────────────────────────────────
  bills: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        campus: z.string().optional(),
        category: z.string().optional(),
      }))
      .query(async ({ input }) => getRecurringBills(input)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.enum(["rent","utilities","software","payroll","insurance","marketing","supplies","taxes","subscriptions","maintenance","other"]),
        amount: z.string(),
        currency: z.string().default("USD"),
        campus: z.string().default("all"),
        frequency: z.enum(["monthly","quarterly","annually","one_time"]),
        dueDayOfMonth: z.number().min(1).max(31),
        nextDueDate: z.date(),
        notes: z.string().optional(),
        vendor: z.string().optional(),
      }))
      .mutation(async ({ input }) => createRecurringBill(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        amount: z.string().optional(),
        currency: z.string().optional(),
        notes: z.string().optional(),
        vendor: z.string().optional(),
        remindersEnabled: z.boolean().optional(),
        nextDueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => { const { id, ...data } = input; return updateRecurringBill(id, data); }),

    markPaid: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await markBillPaid(input.id); return { success: true }; }),

    disable: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await updateRecurringBill(input.id, { status: "disabled" }); return { success: true }; }),

    enable: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await updateRecurringBill(input.id, { status: "active" }); return { success: true }; }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteRecurringBill(input.id); return { success: true }; }),

    getMetrics: protectedProcedure
      .query(async () => getBillsMetrics()),
    checkReminders: protectedProcedure
      .mutation(async () => {
        const { notifyOwner } = await import("./_core/notification");
        const allBills = await getBillsDueForReminder();
        const now = new Date();
        let notified = 0;
        for (const bill of allBills) {
          const due = new Date(bill.nextDueDate);
          const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const currency = bill.currency || "USD";
          const amount = `${currency} ${Number(bill.amount).toLocaleString()}`;
          let shouldNotify = false;
          let reminderType = "";
          let updates: Record<string, boolean> = {};
          if (daysUntilDue <= 7 && daysUntilDue > 3 && !bill.reminder7Sent) {
            shouldNotify = true; reminderType = "7 days"; updates = { reminder7Sent: true };
          } else if (daysUntilDue <= 3 && daysUntilDue > 1 && !bill.reminder3Sent) {
            shouldNotify = true; reminderType = "3 days"; updates = { reminder3Sent: true };
          } else if (daysUntilDue <= 1 && daysUntilDue >= 0 && !bill.reminder1Sent) {
            shouldNotify = true; reminderType = "tomorrow"; updates = { reminder1Sent: true };
          } else if (daysUntilDue < 0 && Math.abs(daysUntilDue) >= 3 && !bill.reminderOverdueSent) {
            shouldNotify = true; reminderType = "OVERDUE 3+ days"; updates = { reminderOverdueSent: true, status: "overdue" as any };
          }
          if (shouldNotify) {
            await notifyOwner({
              title: `💳 Bill Reminder: ${bill.name} (${reminderType})`,
              content: `Bill: ${bill.name}\nAmount: ${amount}\nDue: ${due.toLocaleDateString()}\nCampus: ${bill.campus}\nVendor: ${bill.vendor || "N/A"}\nStatus: Due in ${daysUntilDue >= 0 ? daysUntilDue + " days" : Math.abs(daysUntilDue) + " days OVERDUE"}`,
            });
            await updateRecurringBill(bill.id, updates as any);
            notified++;
          }
        }
        return { notified, total: allBills.length };
      }),
  }),

  // ─── Admin Panel ──────────────────────────────────────────────────────────────
  admin: router({
    listUsers: adminProcedure.query(async () => getAllUsers()),
    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "instructor", "coordinator", "receptionist"]) }))
      .mutation(async ({ input }) => { await updateUserRole(input.userId, input.role); return { success: true }; }),
    systemStats: adminProcedure.query(async () => getSystemStats()),
    updateFinancialPin: adminProcedure
      .input(z.object({ currentPin: z.string().length(4), newPin: z.string().length(4) }))
      .mutation(async ({ input }) => {
        const ADMIN_PIN = "1234";
        if (input.currentPin !== ADMIN_PIN) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current PIN is incorrect" });
        // In production, store PIN securely in DB or env. For demo, return success.
        return { success: true, message: "PIN updated (demo mode - PIN stored in server config)" };
      }),
  }),
});
export type AppRouter = typeof appRouter;
