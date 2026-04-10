/**
 * Session 9 Tests
 * - Certificate generation (mocked S3)
 * - Question analytics aggregation
 * - Submission notes CRUD + RBAC
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock S3 storagePut so certificate tests don't hit real S3
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/cert-123.pdf", key: "certificates/cert-123.pdf" }),
  storageGet: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/cert-123.pdf", key: "certificates/cert-123.pdf" }),
}));

// Mock pdfkit so no actual PDF is generated in tests
vi.mock("pdfkit", () => {
  const EventEmitter = require("events");
  return {
    default: class MockPDF extends EventEmitter {
      page = { width: 841, height: 595 };
      fontSize() { return this; }
      font() { return this; }
      fillColor() { return this; }
      strokeColor() { return this; }
      text() { return this; }
      rect() { return this; }
      roundedRect() { return this; }
      moveTo() { return this; }
      lineTo() { return this; }
      lineWidth() { return this; }
      fill() { return this; }
      stroke() { return this; }
      end() { this.emit("data", Buffer.from("fake-pdf")); this.emit("end"); }
    },
  };
});

const adminCtx = { user: { id: 1, role: "admin" as const, name: "Admin", email: "admin@liota.institute", openId: "admin-1" } };
const staffCtx = { user: { id: 2, role: "instructor" as const, name: "Staff", email: "staff@liota.institute", openId: "staff-1" } };

describe("Certificate Generator", () => {
  it("generateCertificate returns a URL string", async () => {
    const { generateCertificate } = await import("./certificateGenerator");
    const url = await generateCertificate({
      studentName: "Maria Lopez",
      cefrLevel: "B2",
      testTitle: "General English Placement Test",
      score: 72,
      completedAt: new Date("2025-06-15"),
      submissionId: 42,
    });
    expect(typeof url).toBe("string");
    expect(url).toContain("https://");
  });
});

describe("placementTests.getQuestionAnalytics", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as any);
    await expect(caller.placementTests.getQuestionAnalytics({ testId: 1 })).rejects.toThrow();
  });

  it("returns an array for a valid testId (may be empty if no test exists)", async () => {
    const caller = appRouter.createCaller(adminCtx as any);
    const result = await caller.placementTests.getQuestionAnalytics({ testId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("placementTests.listNotes", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as any);
    await expect(caller.placementTests.listNotes({ submissionId: 1 })).rejects.toThrow();
  });

  it("returns an array for a valid submissionId", async () => {
    const caller = appRouter.createCaller(adminCtx as any);
    const result = await caller.placementTests.listNotes({ submissionId: 999999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("placementTests.addNote", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as any);
    await expect(caller.placementTests.addNote({ submissionId: 1, content: "test" })).rejects.toThrow();
  });

  it("rejects empty content", async () => {
    const caller = appRouter.createCaller(staffCtx as any);
    await expect(caller.placementTests.addNote({ submissionId: 1, content: "" })).rejects.toThrow();
  });

  it("rejects content over 2000 chars", async () => {
    const caller = appRouter.createCaller(staffCtx as any);
    await expect(caller.placementTests.addNote({ submissionId: 1, content: "x".repeat(2001) })).rejects.toThrow();
  });
});

describe("placementTests.deleteNote", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller({ user: null } as any);
    await expect(caller.placementTests.deleteNote({ id: 1 })).rejects.toThrow();
  });

  it("returns NOT_FOUND for non-existent note", async () => {
    const caller = appRouter.createCaller(adminCtx as any);
    await expect(caller.placementTests.deleteNote({ id: 999999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
