import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

// ─── Helpers ────────────────────────────────────────────────────────────────
function makeCtx(role: "admin" | "user" | "sales" | "instructor" | "coordinator") {
  return {
    user: {
      id: role === "admin" ? 1 : role === "sales" ? 2 : 3,
      role,
      name: `Test ${role}`,
      email: `${role}@test.com`,
      openId: `test-${role}`,
      loginMethod: "email_password",
      createdAt: new Date(),
      lastSignedIn: new Date(),
    },
  };
}

const adminCaller = appRouter.createCaller(makeCtx("admin") as any);
const salesCaller = appRouter.createCaller(makeCtx("sales") as any);
const userCaller = appRouter.createCaller(makeCtx("user") as any);

// ─── Onboarding Dashboard RBAC ───────────────────────────────────────────────
describe("guide.getAllProgress", () => {
  it("allows admin to call getAllProgress", async () => {
    const result = await adminCaller.guide.getAllProgress();
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks non-admin from calling getAllProgress", async () => {
    await expect(userCaller.guide.getAllProgress()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("blocks sales from calling getAllProgress", async () => {
    await expect(salesCaller.guide.getAllProgress()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

// ─── Language Packages - Sales Permissions ───────────────────────────────────
describe("packages.create - Sales role", () => {
  it("allows sales to create a package", async () => {
    const result = await salesCaller.packages.create({
      name: "Sales Test Package",
      type: "esl",
      totalHours: 20,
      priceUSD: 400,
      sessionsPerWeek: 2,
      sessionDurationMin: 60,
      hourlyRateUSD: 20,
      hourlyRateMXN: 200,
      isActive: true,
      maxStudents: 6,
      campus: "all",
    });
    expect(result.success).toBe(true);
  });

  it("blocks regular user from creating a package", async () => {
    await expect(
      userCaller.packages.create({
        name: "Unauthorized Package",
        type: "esl",
        totalHours: 20,
        priceUSD: 400,
        sessionsPerWeek: 2,
        sessionDurationMin: 60,
        hourlyRateUSD: 20,
        hourlyRateMXN: 200,
        isActive: true,
        maxStudents: 6,
        campus: "all",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows admin to create a package", async () => {
    const result = await adminCaller.packages.create({
      name: "Admin Test Package",
      type: "ssl",
      totalHours: 30,
      priceUSD: 600,
      sessionsPerWeek: 3,
      sessionDurationMin: 60,
      hourlyRateUSD: 20,
      hourlyRateMXN: 200,
      isActive: true,
      maxStudents: 8,
      campus: "merida",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Onboarding Progress Save/Get ────────────────────────────────────────────
describe("guide.saveProgress and getProgress", () => {
  it("allows admin to save progress (uses real DB user)", async () => {
    const result = await adminCaller.guide.saveProgress({
      role: "admin",
      completedItems: ["item-1", "item-2"],
    });
    expect(result.success).toBe(true);
  });

  it("allows admin to get their own progress", async () => {
    const result = await adminCaller.guide.getProgress({ role: "admin" });
    expect(result).toHaveProperty("completedItems");
    expect(Array.isArray(result.completedItems)).toBe(true);
  });

  it("allows admin to reset their progress", async () => {
    const result = await adminCaller.guide.resetProgress({ role: "admin" });
    expect(result.success).toBe(true);
  });
});
