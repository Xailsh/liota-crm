import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test Context Helpers ──────────────────────────────────────────────────────

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@liota.edu",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email: "student@liota.edu",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function makeGuestCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// ─── Auth Tests ────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("admin@liota.edu");
    expect(result?.role).toBe("admin");
  });

  it("clears session cookie on logout", async () => {
    const clearedCookies: string[] = [];
    const ctx = makeAdminCtx();
    (ctx.res as any).clearCookie = (name: string) => clearedCookies.push(name);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

// ─── Financial Dashboard Access Control Tests ──────────────────────────────────

describe("financial dashboard access control", () => {
  it("rejects non-admin users from financial dashboard", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.financial.dashboard({ pin: "1234" })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated users from financial dashboard", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.financial.dashboard({ pin: "1234" })
    ).rejects.toThrow();
  });

  it("rejects admin with wrong PIN", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.financial.dashboard({ pin: "0000" })
    ).rejects.toThrow("PIN incorrecto");
  });

  it("rejects admin verifyPin with wrong PIN", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.financial.verifyPin({ pin: "9999" })
    ).rejects.toThrow("PIN incorrecto");
  });

  it("validates PIN length - must be exactly 4 digits", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // PIN too short
    await expect(
      caller.financial.dashboard({ pin: "123" })
    ).rejects.toThrow();
    // PIN too long
    await expect(
      caller.financial.dashboard({ pin: "12345" })
    ).rejects.toThrow();
  });
});

// ─── Role-based Access Control Tests ──────────────────────────────────────────

describe("role-based access control", () => {
  it("admin can access dashboard metrics", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // Should not throw - admin has access
    const result = await caller.dashboard.metrics();
    // Result can be null if DB is not available in test env
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("regular user can access dashboard metrics", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.dashboard.metrics();
    expect(result === null || typeof result === "object").toBe(true);
  });

  it("unauthenticated user cannot access protected procedures", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.dashboard.metrics()).rejects.toThrow();
  });
});

// ─── Input Validation Tests ────────────────────────────────────────────────────

describe("input validation", () => {
  it("students.list accepts valid filters", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // Should not throw on valid input
    const result = await caller.students.list({
      search: "",
      campus: undefined,
      program: undefined,
      status: undefined,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("contacts.list accepts search and type filters", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.contacts.list({ search: "", type: "parent" });
    expect(Array.isArray(result)).toBe(true);
  });

  it("campaigns.list returns array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.campaigns.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("leads.list returns array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.leads.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("payments.list returns array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.payments.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("classes.list returns array", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.classes.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Analytics Tests ──────────────────────────────────────────────────────────

describe("analytics", () => {
  it("returns analytics overview for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.analytics.overview();
    // Can be null if DB not available, otherwise should have expected shape
    if (result !== null) {
      expect(result).toHaveProperty("studentsByCampus");
      expect(result).toHaveProperty("studentsByProgram");
      expect(result).toHaveProperty("leadsByStage");
      expect(result).toHaveProperty("campaignStats");
    }
  });
});
