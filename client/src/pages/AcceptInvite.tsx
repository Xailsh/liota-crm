import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle, Mail, Shield, AlertTriangle, RefreshCw } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663079010352/YzZjuTcos3se78oWJYxJkp/liota-logo_0110e626.jpeg";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  coordinator: "Coordinator",
  receptionist: "Receptionist",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  instructor: "bg-blue-100 text-blue-700 border-blue-200",
  coordinator: "bg-violet-100 text-violet-700 border-violet-200",
  receptionist: "bg-emerald-100 text-emerald-700 border-emerald-200",
  user: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const token = window.location.pathname.split("/invite/")[1] ?? "";

  const [step, setStep] = useState<"loading" | "choose" | "set-password" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { data: invitation, isLoading, error } = trpc.invitations.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  useEffect(() => {
    if (!token) { setStep("error"); setErrorMsg("Invalid invitation link — no token found."); return; }
    if (isLoading) return;
    if (error || !invitation) { setStep("error"); setErrorMsg((error as any)?.message || "Invitation not found or has expired."); return; }
    if ((invitation as any).status === "revoked") { setStep("error"); setErrorMsg("This invitation has been revoked."); return; }
    if ((invitation as any).status === "accepted") { setStep("error"); setErrorMsg("This invitation has already been accepted. Please sign in."); return; }
    if (new Date((invitation as any).expiresAt) < new Date()) { setStep("error"); setErrorMsg("This invitation has expired. Please ask an admin to send a new one."); return; }
    setStep("choose");
  }, [token, isLoading, error, invitation]);

  const handleGoogleSignIn = () => {
    const origin = window.location.origin;
    window.location.href = `/api/staff-auth/google?inviteToken=${encodeURIComponent(token)}&origin=${encodeURIComponent(origin)}`;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (password !== confirmPassword) { setSubmitError("Passwords do not match."); return; }
    if (password.length < 8) { setSubmitError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff-auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name: name || undefined }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Failed to set password."); }
      else { setStep("success"); setTimeout(() => { window.location.href = "/"; }, 2500); }
    } catch { setSubmitError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  const inv = invitation as any;

  if (step === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.18_0.05_255)] via-[oklch(0.22_0.06_260)] to-[oklch(0.15_0.04_255)]">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.18_0.05_255)] via-[oklch(0.22_0.06_260)] to-[oklch(0.15_0.04_255)] p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Invitation Invalid</h2>
            <p className="text-white/60 text-sm">{errorMsg}</p>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate("/")}>Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.18_0.05_255)] via-[oklch(0.22_0.06_260)] to-[oklch(0.15_0.04_255)] p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10 backdrop-blur-xl">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Welcome to LIOTA CRM!</h2>
            <p className="text-white/60 text-sm">Your account has been set up. Redirecting to the dashboard...</p>
            <Loader2 className="w-5 h-5 animate-spin text-white/40 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.18_0.05_255)] via-[oklch(0.22_0.06_260)] to-[oklch(0.15_0.04_255)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <img src={LOGO_URL} alt="LIOTA" className="w-20 h-20 object-contain mx-auto rounded-2xl shadow-lg" />
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>You're Invited!</h1>
              <p className="text-white/50 text-xs mt-1">LIOTA CRM — Language Institute Of The Americas</p>
            </div>
          </div>

          {inv && (
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Invited as</span>
                <Badge className={`text-xs border ${ROLE_COLORS[inv.role] || ROLE_COLORS.user}`}>
                  <Shield className="w-3 h-3 mr-1" />{ROLE_LABELS[inv.role] || inv.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50">Email</span>
                <span className="text-white/80 font-mono text-xs">{inv.email}</span>
              </div>
              {inv.invitedByName && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Invited by</span>
                  <span className="text-white/80 text-xs">{inv.invitedByName}</span>
                </div>
              )}
            </div>
          )}

          <Separator className="bg-white/10" />

          {step === "choose" && (
            <div className="space-y-3">
              <p className="text-white/60 text-xs text-center">Choose how you'd like to sign in</p>
              <Button variant="outline" className="w-full h-11 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white font-medium gap-2" onClick={handleGoogleSignIn}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full h-11 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white font-medium gap-2" onClick={() => setStep("set-password")}>
                <Mail className="w-4 h-4" />Set up with Email & Password
              </Button>
            </div>
          )}

          {step === "set-password" && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <button type="button" onClick={() => { setStep("choose"); setSubmitError(""); }} className="text-white/50 hover:text-white/80 text-xs flex items-center gap-1 transition-colors">← Back</button>
              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-xs mb-1 block">Your name (optional)</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.14_75)]" />
                </div>
                <div>
                  <label className="text-white/70 text-xs mb-1 block">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.14_75)]" />
                </div>
                <div>
                  <label className="text-white/70 text-xs mb-1 block">Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat password" className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.14_75)]" />
                </div>
              </div>
              {submitError && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs">{submitError}</p>
                </div>
              )}
              <Button type="submit" disabled={submitting} className="w-full bg-[oklch(0.72_0.14_75)] hover:bg-[oklch(0.65_0.14_75)] text-[oklch(0.15_0.02_240)] font-semibold h-11">
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Create Account & Sign In"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
