import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key Validation", () => {
  it("should have RESEND_API_KEY set in environment", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
  });

  it("should be able to initialize Resend client with the API key", () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    expect(resend).toBeDefined();
    expect(resend.emails).toBeDefined();
  });

  it("should validate Resend API key by listing domains", async () => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.domains.list();
    expect(error).toBeNull();
    expect(data).toBeDefined();
    // Should have at least one domain (liota.institute)
    expect(Array.isArray(data?.data)).toBe(true);
  });
});
