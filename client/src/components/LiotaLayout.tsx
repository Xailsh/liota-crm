import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  TrendingUp,
  Users,
  Users2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

const navItems = [
  {
    group: "Principal",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard", description: "Vista general" },
    ],
  },
  {
    group: "Gestión Académica",
    items: [
      { href: "/students", icon: GraduationCap, label: "Estudiantes", description: "Perfiles y matrículas" },
      { href: "/classes", icon: BookOpen, label: "Clases y Programas", description: "Grupos y horarios" },
      { href: "/academic-progress", icon: TrendingUp, label: "Progreso Académico", description: "Evaluaciones MCER" },
    ],
  },
  {
    group: "Ventas y Marketing",
    items: [
      { href: "/leads", icon: Users2, label: "Pipeline de Leads", description: "Embudo de ventas" },
      { href: "/email-marketing", icon: Mail, label: "Email Marketing", description: "Campañas y plantillas" },
      { href: "/contacts", icon: Users, label: "Contactos", description: "Padres y estudiantes" },
    ],
  },
  {
    group: "Finanzas",
    items: [
      { href: "/accounting", icon: CreditCard, label: "Contabilidad", description: "Pagos y facturas" },
      { href: "/financial", icon: Lock, label: "Dashboard Financiero", description: "Solo administradores", adminOnly: true },
    ],
  },
  {
    group: "Reportes",
    items: [
      { href: "/analytics", icon: BarChart3, label: "Analíticas", description: "Estadísticas y reportes" },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">LIOTA CRM</p>
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_255)] via-[oklch(0.22_0.06_260)] to-[oklch(0.15_0.04_255)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[oklch(0.72_0.14_75)] flex items-center justify-center mx-auto shadow-lg">
                <Building2 className="w-8 h-8 text-[oklch(0.15_0.02_240)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  LIOTA CRM
                </h1>
                <p className="text-white/60 text-sm mt-1">Language Institute Of The Americas</p>
              </div>
            </div>
            <Separator className="bg-white/10" />
            <div className="space-y-2">
              <p className="text-white/80 text-sm">Sistema de gestión integral para la academia de inglés</p>
              <p className="text-white/50 text-xs">Inicia sesión para acceder al panel de administración</p>
            </div>
            <Button
              className="w-full bg-[oklch(0.72_0.14_75)] hover:bg-[oklch(0.65_0.14_75)] text-[oklch(0.15_0.02_240)] font-semibold h-11"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[oklch(0.72_0.14_75)] flex items-center justify-center flex-shrink-0 shadow-md">
            <Building2 className="w-5 h-5 text-[oklch(0.15_0.02_240)]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sidebar-foreground text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              LIOTA CRM
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">Language Institute</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navItems.map((group) => (
          <div key={group.group}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href;
                if ((item as any).adminOnly && user?.role !== "admin") return null;
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
        ))}
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
              {user?.name ?? "Usuario"}
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
                {user?.role === "admin" ? "Admin" : "Usuario"}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent flex-shrink-0"
            onClick={logout}
            title="Cerrar sesión"
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
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-foreground"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.72_0.14_75)] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[oklch(0.15_0.02_240)]" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>LIOTA CRM</span>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
