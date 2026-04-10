import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@liota.institute",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email: "user@liota.institute",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("metaLeads procedures", () => {
  it("should list meta leads (returns array)", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.metaLeads.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should get meta leads stats with correct shape", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const stats = await caller.metaLeads.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("new");
    expect(stats).toHaveProperty("contacted");
    expect(stats).toHaveProperty("enrolled");
    expect(stats).toHaveProperty("lost");
    expect(typeof stats.total).toBe("number");
  });

  it("should allow regular user to list meta leads", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.metaLeads.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject non-admin from syncFromMeta", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.metaLeads.syncFromMeta({ formId: "123", accessToken: "token" })
    ).rejects.toThrow();
  });
});

describe("socialCredentials procedures", () => {
  it("should list social credentials (returns array)", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.socialCredentials.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow regular user to list social credentials", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.socialCredentials.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject non-admin from upsert", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.socialCredentials.upsert({ platform: "meta" })
    ).rejects.toThrow();
  });

  it("should reject non-admin from delete", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.socialCredentials.delete({ id: 999 })
    ).rejects.toThrow();
  });

  it("should allow admin to upsert and then delete a credential", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());

    // Upsert a test credential
    const upsertResult = await caller.socialCredentials.upsert({
      platform: "tiktok",
      handle: "test_vitest_handle",
      notes: "Test credential for vitest - safe to delete",
    });
    expect(upsertResult.success).toBe(true);

    // List and find the new credential
    const list = await caller.socialCredentials.list();
    const created = list.find((c: any) => c.platform === "tiktok" && c.handle === "test_vitest_handle");
    expect(created).toBeDefined();

    // Delete it to clean up
    if (created) {
      const deleteResult = await caller.socialCredentials.delete({ id: created.id });
      expect(deleteResult.success).toBe(true);
    }
  });
});

describe("outreach procedures", () => {
  it("should list outreach history (returns array)", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.outreach.history({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow regular user to view outreach history", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    const result = await caller.outreach.history({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject invalid email in sendEmail", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.outreach.sendEmail({
        recipients: [{ email: "not-an-email" }],
        subject: "Test",
        body: "Test body",
        delayMs: 0,
      })
    ).rejects.toThrow();
  });
});
