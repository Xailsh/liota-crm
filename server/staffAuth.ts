/**
 * Staff Authentication Module
 *
 * Handles two additional sign-in methods for invited staff:
 *   1. Email + Password  (bcrypt hash stored in users.passwordHash)
 *   2. Google OAuth 2.0  (googleId stored in users.googleId)
 *
 * Both methods issue the same session cookie as Manus OAuth (via sdk.signSession).
 */
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users, invitations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOpenId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function issueSessionCookie(req: Request, res: Response, openId: string, name: string): Promise<void> {
  const token = await sdk.signSession({ openId, appId: ENV.appId, name });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

// ─── POST /api/staff-auth/set-password ───────────────────────────────────────
// Accept an invitation token + new password → create/update user → issue session
router.post("/set-password", async (req: Request, res: Response) => {
  const { token, password, name } = req.body as {
    token: string;
    password: string;
    name?: string;
  };

  if (!token || !password) {
    return res.status(400).json({ error: "token and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  // Validate invitation
  const [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!inv) return res.status(404).json({ error: "Invitation not found" });
  if (inv.status === "revoked") return res.status(403).json({ error: "Invitation has been revoked" });
  if (inv.status === "accepted") return res.status(409).json({ error: "Invitation already accepted" });
  if (new Date(inv.expiresAt) < new Date()) return res.status(403).json({ error: "Invitation has expired" });

  const passwordHash = await bcrypt.hash(password, 12);
  const displayName = name || inv.email.split("@")[0];

  // Check if user already exists with this email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, inv.email))
    .limit(1);

  let openId: string;
  let userRole = inv.role;

  if (existingUser) {
    // Update existing user with password
    await db
      .update(users)
      .set({
        passwordHash,
        loginMethod: "email_password",
        name: name || existingUser.name,
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, existingUser.id));
    openId = existingUser.openId;
    userRole = existingUser.role;
  } else {
    // Create new user
    openId = generateOpenId("staff_pw");
    await db.insert(users).values({
      openId,
      email: inv.email,
      name: displayName,
      loginMethod: "email_password",
      passwordHash,
      role: inv.role,
      lastSignedIn: new Date(),
    });
  }

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(invitations.token, token));

  await issueSessionCookie(req, res, openId, displayName);
  return res.json({ success: true, role: userRole });
});

// ─── POST /api/staff-auth/login ──────────────────────────────────────────────
// Email + password login (for existing staff users)
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Update lastSignedIn
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  await issueSessionCookie(req, res, user.openId, user.name || email);
  return res.json({ success: true, role: user.role, name: user.name });
});

// ─── GET /api/staff-auth/google ──────────────────────────────────────────────
// Redirect to Google OAuth (with optional invite token in state)
router.get("/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ error: "Google OAuth not configured. Please add GOOGLE_CLIENT_ID." });
  }

  const host = req.get("host") ?? "";
  const protocol = req.headers["x-forwarded-proto"] ?? req.protocol;
  const redirectUri = `${protocol}://${host}/api/staff-auth/google/callback`;

  const stateData: Record<string, string> = {
    origin: (req.query.origin as string) || `${protocol}://${host}`,
  };
  if (req.query.inviteToken) {
    stateData.inviteToken = req.query.inviteToken as string;
  }
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ─── GET /api/staff-auth/google/callback ─────────────────────────────────────
// Google OAuth callback — exchange code for tokens, upsert user, issue session
router.get("/google/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`/?error=google_auth_failed`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.redirect(`/?error=google_not_configured`);
  }

  let inviteToken: string | undefined;
  let origin = "";
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64").toString());
    inviteToken = decoded.inviteToken;
    origin = decoded.origin || "";
  } catch {
    // ignore malformed state
  }

  try {
    const host = req.get("host") ?? "";
    const protocol = req.headers["x-forwarded-proto"] ?? req.protocol;
    const redirectUri = `${protocol}://${host}/api/staff-auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      console.error("[Google OAuth] Token exchange failed:", tokenData);
      return res.redirect(`${origin}/?error=google_token_failed`);
    }

    // Fetch user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json() as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    if (!googleUser.email) {
      return res.redirect(`${origin}/?error=google_no_email`);
    }

    const db = await getDb();
    if (!db) return res.redirect(`${origin}/?error=db_unavailable`);

    // Find existing user by email
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, googleUser.email))
      .limit(1);

    let openId: string;
    let userRole: string = "user";
    let displayName = googleUser.name;

    if (existingUser) {
      // Update Google info on existing user
      await db
        .update(users)
        .set({
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
          loginMethod: "google",
          name: existingUser.name || googleUser.name,
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, existingUser.id));
      openId = existingUser.openId;
      userRole = existingUser.role;
      displayName = existingUser.name || googleUser.name;
    } else {
      // New user — must have a valid invitation
      if (!inviteToken) {
        return res.redirect(`${origin}/?error=no_invitation`);
      }

      const [inv] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, inviteToken))
        .limit(1);

      if (!inv || inv.status !== "pending" || new Date(inv.expiresAt) < new Date()) {
        return res.redirect(`${origin}/?error=invalid_invitation`);
      }

      if (inv.email.toLowerCase() !== googleUser.email.toLowerCase()) {
        return res.redirect(`${origin}/?error=email_mismatch`);
      }

      // Create new user
      openId = generateOpenId("staff_google");
      await db.insert(users).values({
        openId,
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        avatarUrl: googleUser.picture,
        loginMethod: "google",
        role: inv.role,
        lastSignedIn: new Date(),
      });

      // Mark invitation accepted
      await db
        .update(invitations)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(invitations.token, inviteToken));

      userRole = inv.role;
    }

    await issueSessionCookie(req, res, openId, displayName);
    return res.redirect(origin ? `${origin}/` : "/");
  } catch (err) {
    console.error("[Google OAuth] Callback error:", err);
    return res.redirect(`${origin}/?error=google_auth_error`);
  }
});

export { router as staffAuthRouter };
