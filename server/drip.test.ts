import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB module
vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock email module
vi.mock("../server/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildLeadAssignmentEmail: vi.fn().mockReturnValue("<html>test</html>"),
}));

describe("Drip Sequence Router", () => {
  it("enrollLeadInDrip handles null DB gracefully", async () => {
    const { enrollLeadInDrip } = await import("./routers/drip");
    // Should not throw when DB is unavailable
    await expect(
      enrollLeadInDrip({ leadId: 1, leadEmail: "test@test.com", leadName: "Test User" })
    ).resolves.toBeUndefined();
  });

  it("runDueEmails handles null DB gracefully", async () => {
    const { runDueEmails } = await import("./routers/drip");
    const result = await runDueEmails();
    expect(result).toEqual({ sent: 0, failed: 0, skipped: 0 });
  });
});

describe("Lead Capture Router", () => {
  it("leadCapture router is exported correctly", async () => {
    const { leadCaptureRouter } = await import("./routers/leadCapture");
    expect(leadCaptureRouter).toBeDefined();
    expect(typeof leadCaptureRouter).toBe("object");
  });
});

describe("Meta Webhook", () => {
  it("metaWebhookRouter is exported correctly", async () => {
    const { metaWebhookRouter } = await import("./metaWebhook");
    expect(metaWebhookRouter).toBeDefined();
  });
});
