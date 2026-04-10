import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

const adminCtx = { user: { id: 1, openId: "owner", name: "Admin", email: "admin@liota.institute", role: "admin" as const }, req: {} as any, res: {} as any };
const userCtx = { user: { id: 2, openId: "user2", name: "Staff", email: "staff@liota.institute", role: "user" as const }, req: {} as any, res: {} as any };

const adminCaller = appRouter.createCaller(adminCtx);
const userCaller = appRouter.createCaller(userCtx);

describe("placementTests.list", () => {
  it("returns an array for authenticated users", async () => {
    const result = await userCaller.placementTests.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns an array for admin users", async () => {
    const result = await adminCaller.placementTests.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("placementTests.listSubmissions", () => {
  it("returns an array", async () => {
    const result = await adminCaller.placementTests.listSubmissions({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("placementTests.listSchedules", () => {
  it("returns an array", async () => {
    const result = await adminCaller.placementTests.listSchedules({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("placementTests.create (admin only)", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    await expect(
      userCaller.placementTests.create({
        title: "Test",
        version: "v1",
        targetLevel: "mixed",
        durationMinutes: 30,
      })
    ).rejects.toThrow();
  });
});

describe("placementTests.createSchedule (admin/coordinator only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    await expect(
      userCaller.placementTests.createSchedule({
        studentId: 1,
        testId: 1,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        isRecurring: false,
      })
    ).rejects.toThrow();
  });
});

describe("placementTests.getByToken", () => {
  it("throws NOT_FOUND for invalid token", async () => {
    await expect(
      userCaller.placementTests.getByToken({ token: "invalid-token-xyz-123" })
    ).rejects.toThrow();
  });
});

describe("placementTests.seedDefaults (admin only)", () => {
  it("throws FORBIDDEN for non-admin users", async () => {
    await expect(userCaller.placementTests.seedDefaults()).rejects.toThrow();
  });
});
