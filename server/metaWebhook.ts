/**
 * Meta Leads Webhook Handler
 *
 * GET  /api/meta/webhook  → hub.challenge verification (required by Meta)
 * POST /api/meta/webhook  → receives leadgen events, fetches lead details,
 *                           saves to meta_leads table, auto-creates CRM lead,
 *                           auto-assigns to marketing user, enrolls in drip sequence,
 *                           and sends email notification to marketing team.
 */
import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { metaLeads, leads, socialCredentials, users } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { sendEmail, buildLeadAssignmentEmail } from "./email";
import { enrollLeadInDrip } from "./routers/drip";
import { ENV } from "./_core/env";

const router = Router();

// ─── GET: Hub Challenge Verification ─────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "liota_meta_verify_2024";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Meta Webhook] Verification successful");
    res.status(200).send(challenge);
  } else {
    console.warn("[Meta Webhook] Verification failed — token mismatch");
    res.status(403).json({ error: "Forbidden: token mismatch" });
  }
});

// ─── POST: Receive Leadgen Events ─────────────────────────────────────────────
router.post("/", async (req: Request, res: Response) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.status(200).json({ status: "ok" });

  const db = await getDb();
  if (!db) {
    console.error("[Meta Webhook] No DB connection available");
    return;
  }

  try {
    const body = req.body as {
      object?: string;
      entry?: Array<{
        changes?: Array<{
          field: string;
          value?: {
            leadgen_id?: string;
            form_id?: string;
            page_id?: string;
          };
        }>;
      }>;
    };

    if (body.object !== "page") {
      console.log("[Meta Webhook] Ignoring non-page event:", body.object);
      return;
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;

        const leadgenId = change.value?.leadgen_id ?? "";
        const formId = change.value?.form_id ?? "";
        const pageId = change.value?.page_id ?? "";

        if (!leadgenId || !formId) {
          console.warn("[Meta Webhook] Missing leadgen_id or form_id in event");
          continue;
        }

        console.log(`[Meta Webhook] New lead: leadgen_id=${leadgenId} form_id=${formId}`);

        // Check for duplicate
        const existing = await db
          .select({ id: metaLeads.id })
          .from(metaLeads)
          .where(eq(metaLeads.leadId, leadgenId))
          .limit(1);

        if (existing.length > 0) {
          console.log(`[Meta Webhook] Duplicate lead ${leadgenId}, skipping`);
          continue;
        }

        // Fetch page access token from social_credentials
        let accessToken: string | null = null;
        try {
          const creds = await db
            .select({ accessToken: socialCredentials.accessToken })
            .from(socialCredentials)
            .where(eq(socialCredentials.platform, "meta"))
            .limit(1);

          if (creds.length > 0 && creds[0].accessToken) {
            accessToken = creds[0].accessToken;
          }
        } catch (e) {
          console.warn("[Meta Webhook] Could not fetch Meta credentials from DB:", e);
        }

        // Fetch lead details from Meta Graph API
        let fullName = "";
        let email = "";
        let phone = "";
        let rawData: string = JSON.stringify(change.value);

        if (accessToken) {
          try {
            const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`;
            const resp = await fetch(url);
            const leadData = await resp.json() as {
              field_data?: Array<{ name: string; values: string[] }>;
            };

            if (leadData.field_data) {
              rawData = JSON.stringify(leadData);
              for (const field of leadData.field_data) {
                const val = field.values?.[0] ?? "";
                const fieldName = field.name.toLowerCase();
                if (fieldName === "full_name" || fieldName === "name") {
                  fullName = val;
                } else if (fieldName === "first_name") {
                  fullName = fullName || val;
                } else if (fieldName === "last_name") {
                  fullName = fullName ? `${fullName} ${val}` : val;
                } else if (fieldName === "email") {
                  email = val;
                } else if (fieldName === "phone_number" || fieldName === "phone") {
                  phone = val;
                }
              }
            }
          } catch (e) {
            console.warn("[Meta Webhook] Could not fetch lead details from Graph API:", e);
          }
        } else {
          console.warn("[Meta Webhook] No Meta access token found — saving minimal lead data");
        }

        // Save to meta_leads table
        const [savedLead] = await db
          .insert(metaLeads)
          .values({
            formId,
            leadId: leadgenId,
            fullName: fullName || `Meta Lead ${leadgenId.slice(-6)}`,
            email: email || null,
            phone: phone || null,
            source: pageId ? `page:${pageId}` : "meta_webhook",
            status: "new",
            rawData,
            syncedAt: new Date(),
          })
          .$returningId();

        console.log(`[Meta Webhook] Saved meta_lead id=${savedLead.id}`);

        // Auto-create CRM lead record
        if (email || fullName) {
          const nameParts = (fullName || "Meta Lead").split(" ");
          const firstName = nameParts[0] ?? "Meta";
          const lastName = nameParts.slice(1).join(" ") || "Lead";

          try {
            // ── Auto-assign to first available marketing user ──────────────
            let assignedTo: string | null = null;
            try {
              const marketingUsers = await db
                .select({ id: users.id, name: users.name, email: users.email })
                .from(users)
                .where(inArray(users.role, ["marketing"]))
                .limit(5);

              if (marketingUsers.length > 0) {
                // Round-robin: pick based on current timestamp modulo count
                const idx = Date.now() % marketingUsers.length;
                const assignee = marketingUsers[idx];
                assignedTo = assignee.name ?? assignee.email ?? null;
              }
            } catch (e) {
              console.warn("[Meta Webhook] Could not find marketing users:", e);
            }

            const [newLead] = await db.insert(leads).values({
              firstName,
              lastName,
              email: email || null,
              phone: phone || null,
              source: "meta_ads",
              stage: "new_lead",
              assignedTo,
              notes: `Auto-created from Meta Lead Form ID: ${formId}\nLead ID: ${leadgenId}`,
            }).$returningId();

            console.log(`[Meta Webhook] Auto-created CRM lead id=${newLead.id} for ${fullName}, assigned to ${assignedTo ?? "unassigned"}`);

            // ── Auto-enroll in drip sequence ───────────────────────────────
            if (email) {
              try {
                await enrollLeadInDrip({
                  leadId: newLead.id,
                  leadEmail: email,
                  leadName: `${firstName} ${lastName}`.trim(),
                });
                console.log(`[Meta Webhook] Enrolled lead ${newLead.id} in drip sequence`);
              } catch (e) {
                console.warn("[Meta Webhook] Could not enroll in drip:", e);
              }
            }

            // ── Notify marketing team by email ─────────────────────────────
            try {
              const marketingEmails = await db
                .select({ email: users.email })
                .from(users)
                .where(inArray(users.role, ["marketing", "admin"]));

              const emailList = marketingEmails
                .map((u) => u.email)
                .filter((e): e is string => !!e);

              if (emailList.length > 0) {
                const html = buildLeadAssignmentEmail({
                  leadName: `${firstName} ${lastName}`,
                  leadEmail: email || undefined,
                  leadPhone: phone || undefined,
                  stage: "new_lead",
                  source: "Meta Ads / Facebook Lead Form",
                  notes: `Form ID: ${formId}\nLead ID: ${leadgenId}`,
                  assignedToName: assignedTo ?? undefined,
                  assignerName: "Meta Ads Webhook",
                  crmUrl: ENV.appUrl,
                });
                await sendEmail({
                  to: emailList,
                  subject: `📱 New Meta Lead: ${firstName} ${lastName}`,
                  html,
                });
                console.log(`[Meta Webhook] Notified ${emailList.length} marketing users`);
              }
            } catch (e) {
              console.warn("[Meta Webhook] Could not send marketing notification:", e);
            }

            // ── In-app notification to owner ───────────────────────────────
            try {
              const { notifyOwner } = await import("./_core/notification");
              await notifyOwner({
                title: `📱 New Meta Lead: ${firstName} ${lastName}`,
                content: `A new lead arrived from Meta Ads.\nEmail: ${email || "N/A"}\nPhone: ${phone || "N/A"}\nAssigned to: ${assignedTo ?? "unassigned"}`,
              });
            } catch (e) {
              console.warn("[Meta Webhook] Could not send owner notification:", e);
            }

          } catch (e) {
            console.warn("[Meta Webhook] Could not auto-create CRM lead:", e);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Meta Webhook] Error processing event:", err);
  }
});

export { router as metaWebhookRouter };
