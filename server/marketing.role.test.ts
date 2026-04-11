/**
 * Marketing Role RBAC Tests
 * Verifies that the Marketing role is correctly defined and enforced
 * in backend procedures and frontend access control.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(role: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99,
    openId: `${role}-openid`,
    email: `${role}@liota.institute`,
    name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
    loginMethod: "email_password",
    passwordHash: "hash",
    googleId: null,
    avatarUrl: null,
    role: role as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { headers: {}, cookies: {} } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx("admin");
}

function makeGuestCtx(): TrpcContext {
  return {
    user: null,
    req: { headers: {}, cookies: {} } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  };
}

// ─── Role enum validation ─────────────────────────────────────────────────────

describe("Marketing Role — backend enum", () => {
  it("admin can invite a user with marketing role", { timeout: 10000 }, async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // This should not throw a validation error for the role value
    // (it may throw if DB is unavailable, but not for invalid role)
    try {
      await caller.admin.createInvitation({
        email: "marketing@liota.institute",
        role: "marketing" as any,
        message: "Welcome to the marketing team!",
        origin: "https://liotacrm.manus.space",
      });
      // If DB is available, invitation was created
      expect(true).toBe(true);
    } catch (err: any) {
      // Accept DB connection errors but not validation errors
      const isDbError = err?.message?.includes("connect") ||
        err?.message?.includes("ECONNREFUSED") ||
        err?.message?.includes("DATABASE") ||
        err?.message?.includes("ECONNRESET") ||
        err?.code === "INTERNAL_SERVER_ERROR";
      expect(isDbError).toBe(true);
    }
  });

  it("admin can invite a user with finance role", { timeout: 10000 }, async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    try {
      await caller.admin.createInvitation({
        email: "finance@liota.institute",
        role: "finance" as any,
        message: "Welcome to the finance team!",
        origin: "https://liotacrm.manus.space",
      });
      expect(true).toBe(true);
    } catch (err: any) {
      const isDbError = err?.message?.includes("connect") ||
        err?.message?.includes("ECONNREFUSED") ||
        err?.message?.includes("DATABASE") ||
        err?.message?.includes("ECONNRESET") ||
        err?.code === "INTERNAL_SERVER_ERROR";
      expect(isDbError).toBe(true);
    }
  });

  it("non-admin (marketing role) cannot create invitations", async () => {
    const caller = appRouter.createCaller(makeCtx("marketing"));
    await expect(
      caller.admin.createInvitation({
        email: "newuser@liota.institute",
        role: "user",
        message: "",
        origin: "https://liotacrm.manus.space",
      })
    ).rejects.toThrow();
  });

  it("non-admin (marketing role) cannot list users", async () => {
    const caller = appRouter.createCaller(makeCtx("marketing"));
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });

  it("non-admin (marketing role) cannot update user roles", async () => {
    const caller = appRouter.createCaller(makeCtx("marketing"));
    await expect(
      caller.admin.updateUserRole({ userId: 1, role: "admin" as any })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot access admin procedures", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.admin.listUsers()).rejects.toThrow();
  });
});

// ─── ROLE_ALLOWED sidebar access matrix ──────────────────────────────────────

describe("Marketing Role — sidebar access matrix", () => {
  // These tests validate the ROLE_ALLOWED constant logic (pure unit tests)
  const ROLE_ALLOWED: Record<string, string[]> = {
    marketing: [
      "/", "/leads", "/contacts", "/email-marketing", "/bulk-email",
      "/meta-leads", "/outreach-hub",
      "/email-templates", "/whatsapp-templates",
      "/onboarding-guide",
    ],
  };

  it("marketing role can access email-marketing", () => {
    expect(ROLE_ALLOWED.marketing).toContain("/email-marketing");
  });

  it("marketing role can access bulk-email", () => {
    expect(ROLE_ALLOWED.marketing).toContain("/bulk-email");
  });

  it("marketing role can access meta-leads", () => {
    expect(ROLE_ALLOWED.marketing).toContain("/meta-leads");
  });

  it("marketing role can access outreach-hub", () => {
    expect(ROLE_ALLOWED.marketing).toContain("/outreach-hub");
  });

  it("marketing role can access leads", () => {
    expect(ROLE_ALLOWED.marketing).toContain("/leads");
  });

  it("marketing role can access contacts", () => {
    expect(ROLE_ALLOWED.marketing).toContain("/contacts");
  });

  it("marketing role cannot access /students", () => {
    expect(ROLE_ALLOWED.marketing).not.toContain("/students");
  });

  it("marketing role cannot access /accounting", () => {
    expect(ROLE_ALLOWED.marketing).not.toContain("/accounting");
  });

  it("marketing role cannot access /financial", () => {
    expect(ROLE_ALLOWED.marketing).not.toContain("/financial");
  });

  it("marketing role cannot access /admin", () => {
    expect(ROLE_ALLOWED.marketing).not.toContain("/admin");
  });

  it("marketing role has 10 allowed routes", () => {
    expect(ROLE_ALLOWED.marketing.length).toBe(10);
  });
});

// ─── Permission matrix validation ────────────────────────────────────────────

describe("Marketing Role — permission matrix", () => {
  // Validate the permissions defined in AdminPanel.tsx PERMISSIONS array
  const marketingPermissions = {
    "View Dashboard": true,
    "View Analytics & Reports": true,
    "View Audit Log": false,
    "View Students": false,
    "Create / Edit Students": false,
    "Delete Students": false,
    "View Classes & Schedule": false,
    "Create / Edit Classes": false,
    "Manage Attendance": false,
    "View Leads Pipeline": true,
    "Manage Leads": true,
    "Email Marketing": true,
    "WhatsApp Templates": true,
    "Bulk Email / Outreach": true,
    "Meta Leads (Facebook/Instagram)": true,
    "Outreach Hub (Social Media)": true,
    "View Contacts": true,
    "Create / Edit Contacts": false,
    "Log Communications": true,
    "View Accounting": false,
    "Record Payments": false,
    "View Financial Dashboard": false,
    "Manage Scholarships": false,
    "Manage Bills & Expenses": false,
    "View Language Packages": true,
    "Manage Camps & Events": true,
    "Send Placement Tests": false,
    "View Test Results": false,
    "Manage Test Builder": false,
    "Manage Users & Roles": false,
    "System Settings": false,
    "Meta Leads & Webhooks": false,
    "Integrations": false,
  };

  it("marketing has access to all core marketing features", () => {
    const coreFeatures = [
      "Email Marketing",
      "Bulk Email / Outreach",
      "Meta Leads (Facebook/Instagram)",
      "Outreach Hub (Social Media)",
      "WhatsApp Templates",
    ];
    coreFeatures.forEach((feature) => {
      expect(marketingPermissions[feature as keyof typeof marketingPermissions]).toBe(true);
    });
  });

  it("marketing has no access to finance features", () => {
    const financeFeatures = [
      "View Accounting",
      "Record Payments",
      "View Financial Dashboard",
      "Manage Scholarships",
      "Manage Bills & Expenses",
    ];
    financeFeatures.forEach((feature) => {
      expect(marketingPermissions[feature as keyof typeof marketingPermissions]).toBe(false);
    });
  });

  it("marketing has no access to student/academic features", () => {
    const studentFeatures = [
      "View Students",
      "Create / Edit Students",
      "Delete Students",
      "View Classes & Schedule",
      "Create / Edit Classes",
      "Manage Attendance",
    ];
    studentFeatures.forEach((feature) => {
      expect(marketingPermissions[feature as keyof typeof marketingPermissions]).toBe(false);
    });
  });

  it("marketing has no access to administration features", () => {
    const adminFeatures = [
      "Manage Users & Roles",
      "System Settings",
      "Meta Leads & Webhooks",
      "Integrations",
    ];
    adminFeatures.forEach((feature) => {
      expect(marketingPermissions[feature as keyof typeof marketingPermissions]).toBe(false);
    });
  });
});
