import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  BarChart3, BookOpen, ChevronRight, CreditCard, GraduationCap,
  LayoutDashboard, Lock, LogOut, Mail, Menu, TrendingUp, Users, Users2, X,
  Award, Package, Tent, Star, MessageSquare, Mic, Zap, Link2, Shield,
  Globe, RefreshCw, AlertTriangle, Library, Plane, Receipt, HelpCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663079010352/YzZjuTcos3se78oWJYxJkp/liota-logo_0110e626.jpeg";

// Role-based access: which nav hrefs each role can see
// admin sees everything; roles not listed here fall back to full access
const ROLE_ALLOWED: Record<string, string[]> = {
  instructor: [
    "/", "/students", "/classes", "/academic-progress", "/placement-tests",
    "/email-templates", "/whatsapp-templates", "/voice-templates",
    "/onboarding-guide",
  ],
  coordinator: [
    "/", "/students", "/classes", "/academic-progress", "/placement-tests",
    "/leads", "/email-marketing", "/contacts", "/bulk-email", "/meta-leads",
    "/email-templates", "/whatsapp-templates", "/voice-templates",
    "/onboarding-guide",
  ],
  sales: [
    "/", "/leads", "/contacts", "/email-marketing", "/bulk-email",
    "/meta-leads", "/placement-tests",
    "/email-templates", "/whatsapp-templates",
    "/onboarding-guide",
  ],
  marketing: [
    "/", "/leads", "/contacts", "/email-marketing", "/bulk-email",
    "/meta-leads", "/outreach-hub",
    "/email-templates", "/whatsapp-templates",
    "/onboarding-guide",
  ],
  finance: [
    "/", "/accounting", "/bills", "/financial",
    "/scholarships", "/packages",
    "/onboarding-guide",
  ],
  receptionist: [
    "/", "/students", "/classes", "/contacts",
    "/leads", "/email-templates", "/onboarding-guide",
  ],
};

const buildNavItems = (t: (k: any) => string) => [
  {
    group: "Main",
    items: [
      { href: "/", icon: LayoutDashboard, label: t("dashboard"), description: "Overview" },
    ],
  },
  {
    group: t("students"),
    items: [
      { href: "/students", icon: GraduationCap, label: t("students"), description: "Profiles & enrollments" },
      { href: "/classes", icon: BookOpen, label: t("classes"), description: "Groups & schedules" },
      { href: "/academic-progress", icon: TrendingUp, label: t("academicProgress"), description: "CEFR assessments" },
      { href: "/placement-tests", icon: BookOpen, label: "Placement Tests", description: "Send & track CEFR tests" },
    ],
  },
  {
    group: "Sales & Marketing",
    items: [
      { href: "/leads", icon: Users2, label: t("leads"), description: "Sales funnel" },
      { href: "/email-marketing", icon: Mail, label: t("emailMarketing"), description: "Campaigns" },
      { href: "/contacts", icon: Users, label: t("contacts"), description: "Parents & students" },
    ],
  },
  {
    group: "Finance",
    items: [
      { href: "/accounting", icon: CreditCard, label: t("accounting"), description: "Payments & invoices" },
      { href: "/bills", icon: Receipt, label: "Bills & Expenses", description: "Recurring payments" },
      { href: "/financial", icon: Lock, label: t("financialDashboard"), description: "Admins only", adminOnly: true },
    ],
  },
  {
    group: "Programs & Events",
    items: [
      { href: "/scholarships", icon: Award, label: t("scholarships"), description: "Financial aid" },
      { href: "/packages", icon: Package, label: t("languagePackages"), description: "Pricing & bundles" },
      { href: "/camps", icon: Tent, label: t("camps"), description: "Seasonal camps" },
      { href: "/events", icon: Star, label: t("specialEvents"), description: "Graduations & workshops" },
      { href: "/book-catalog", icon: Library, label: "Book Catalog", description: "60 LIOTA books" },
      { href: "/study-abroad", icon: Plane, label: "Study Abroad", description: "Residency & travel" },
    ],
  },
  {
    group: t("templates"),
    items: [
      { href: "/email-templates", icon: Mail, label: t("emailTemplates"), description: "Email scripts" },
      { href: "/whatsapp-templates", icon: MessageSquare, label: t("whatsappTemplates"), description: "WhatsApp responses" },
      { href: "/voice-templates", icon: Mic, label: t("voiceTemplates"), description: "Call scripts" },
    ],
  },
  {
    group: t("metaLeads"),
    items: [
      { href: "/meta-leads", icon: Zap, label: t("metaLeads"), description: "Facebook & Instagram leads" },
    ],
  },
  {
    group: "Integrations & Admin",
    items: [
      { href: "/outreach-hub", icon: Zap, label: "Outreach Hub", description: "Social media connections" },
      { href: "/bulk-email", icon: Mail, label: "Bulk Email", description: "Mass outreach & campaigns" },
      { href: "/integrations", icon: Link2, label: t("integrations"), description: "Webhooks & connections" },
      { href: "/admin", icon: Shield, label: t("admin"), description: "System administration", adminOnly: true },
      { href: "/onboarding-guide", icon: HelpCircle, label: "Onboarding Guide", description: "Role-based staff instructions" },
      { href: "/onboarding-dashboard", icon: BarChart3, label: "Onboarding Progress", description: "Track staff onboarding", adminOnly: true },
    ],
  },
  {
    group: "Reports",
    items: [
      { href: "/analytics", icon: BarChart3, label: t("analytics"), description: "Stats & reports" },
    ],
  },
];

interface LiotaLayoutProps {
  children: React.ReactNode;
}

export default function LiotaLayout({ children }: LiotaLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  const navItems = buildNavItems(t);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={LOGO_URL} alt="LIOTA Institute" className="w-20 h-20 object-contain mx-auto rounded-xl" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">LIOTA CRM</p>
            <p className="text-sm text-muted-foreground">{t("loading")}</p>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen language={language} toggleLanguage={toggleLanguage} />;
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="LIOTA Institute" className="w-10 h-10 object-contain rounded-xl flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sidebar-foreground text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              LIOTA CRM
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">Language Institute</p>
          </div>
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            title={language === "en" ? "Switch to Spanish" : "Cambiar a Inglés"}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors shrink-0"
          >
            <Globe className="w-3 h-3 text-sidebar-foreground/60" />
            <span className="text-[10px] font-semibold text-sidebar-foreground/70 uppercase tracking-wide">
              {language === "en" ? "ES" : "EN"}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navItems.map((group) => {
          const allowedHrefs = user?.role && user.role !== "admin" && ROLE_ALLOWED[user.role]
            ? ROLE_ALLOWED[user.role]
            : null; // null = show all
          const visibleItems = group.items.filter((item) => {
            if ((item as any).adminOnly && user?.role !== "admin") return false;
            if (allowedHrefs && !allowedHrefs.includes(item.href)) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                        isActive
                          ? "bg-[oklch(0.72_0.14_75)] text-[oklch(0.15_0.02_240)]"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[oklch(0.15_0.02_240)]" : "")} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium leading-tight", isActive ? "text-[oklch(0.15_0.02_240)]" : "")}>{item.label}</p>
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0 text-[oklch(0.15_0.02_240)]" />}
                      {(item as any).adminOnly && !isActive && (
                        <Lock className="w-3 h-3 flex-shrink-0 text-sidebar-foreground/40" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-[oklch(0.72_0.14_75)] text-[oklch(0.15_0.02_240)] text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate leading-tight">
              {user?.name ?? "User"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1 py-0 h-4 border-0 font-medium",
                  user?.role === "admin"
                    ? "bg-[oklch(0.72_0.14_75)]/20 text-[oklch(0.72_0.14_75)]"
                    : "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "User"}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            onClick={logout}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar flex-shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-sidebar flex flex-col shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="LIOTA" className="w-7 h-7 object-contain rounded-lg" />
            <span className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>LIOTA CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="text-xs font-semibold text-muted-foreground hover:text-foreground uppercase">
              {language === "en" ? "ES" : "EN"}
            </button>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
// Shown when user is not authenticated. Offers three sign-in methods:
//   1. Manus OAuth (primary / admin)
//   2. Google Sign-In (for invited staff)
//   3. Email + Password (for invited staff)

function LoginScreen({
  language,
  toggleLanguage,
}: {
  language: string;
  toggleLanguage: () => void;
}) {
  const [mode, setMode] = useState<"main" | "email">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const en = language === "en";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/staff-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        // Reload to trigger auth re-check
        window.location.reload();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const origin = window.location.origin;
    window.location.href = `/api/staff-auth/google?origin=${encodeURIComponent(origin)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_255)] via-[oklch(0.22_0.06_260)] to-[oklch(0.15_0.04_255)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <img
              src={LOGO_URL}
              alt="LIOTA Institute"
              className="w-24 h-24 object-contain mx-auto rounded-2xl shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                LIOTA CRM
              </h1>
              <p className="text-white/60 text-sm mt-1">Language Institute Of The Americas</p>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {mode === "main" && (
            <div className="space-y-3">
              <p className="text-white/60 text-xs text-center">
                {en ? "Sign in to access the administration panel" : "Inicia sesión para acceder al panel de administración"}
              </p>

              {/* Primary: Manus OAuth */}
              <Button
                className="w-full bg-[oklch(0.72_0.14_75)] hover:bg-[oklch(0.65_0.14_75)] text-[oklch(0.15_0.02_240)] font-semibold h-11"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                {en ? "Sign In with Manus" : "Iniciar Sesión con Manus"}
              </Button>

              <div className="relative">
                <Separator className="bg-white/10" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-transparent px-2 text-white/30 text-xs">{en ? "or staff sign-in" : "o acceso de personal"}</span>
                </span>
              </div>

              {/* Google Sign-In */}
              <Button
                variant="outline"
                className="w-full h-11 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white font-medium gap-2"
                onClick={handleGoogleLogin}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {en ? "Continue with Google" : "Continuar con Google"}
              </Button>

              {/* Email + Password */}
              <Button
                variant="outline"
                className="w-full h-11 bg-white/5 border-white/15 text-white hover:bg-white/10 hover:text-white font-medium gap-2"
                onClick={() => setMode("email")}
              >
                <Mail className="w-4 h-4" />
                {en ? "Sign in with Email" : "Iniciar sesión con Email"}
              </Button>
            </div>
          )}

          {mode === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <button
                type="button"
                onClick={() => { setMode("main"); setError(""); }}
                className="text-white/50 hover:text-white/80 text-xs flex items-center gap-1 transition-colors"
              >
                ← {en ? "Back" : "Volver"}
              </button>

              <div className="space-y-3">
                <div>
                  <label className="text-white/70 text-xs mb-1 block">{en ? "Email address" : "Correo electrónico"}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@liota.institute"
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.14_75)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-xs mb-1 block">{en ? "Password" : "Contraseña"}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full h-10 px-3 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.14_75)] focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[oklch(0.72_0.14_75)] hover:bg-[oklch(0.65_0.14_75)] text-[oklch(0.15_0.02_240)] font-semibold h-11"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  en ? "Sign In" : "Iniciar Sesión"
                )}
              </Button>
            </form>
          )}

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1.5 mx-auto transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {en ? "Cambiar a Español" : "Switch to English"}
          </button>
        </div>
      </div>
    </div>
  );
}
