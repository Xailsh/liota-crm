import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap, Users2, DollarSign, Shield, Zap,
  CheckCircle2, Clock, AlertCircle, BarChart3, Users,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Role checklist item counts (must match OnboardingGuide.tsx) ──────────────
const ROLE_TOTAL_ITEMS: Record<string, number> = {
  instructor: 27,    // 6 sections × ~4-6 items
  coordinator: 28,   // 7 sections × ~4-5 items
  sales: 24,         // 6 sections × ~4 items
  finance: 20,       // 5 sections × ~4 items
  admin: 32,         // 8 sections × ~4 items
};

const ROLE_COLORS: Record<string, string> = {
  instructor: "bg-blue-100 text-blue-700 border-blue-200",
  coordinator: "bg-green-100 text-green-700 border-green-200",
  sales: "bg-orange-100 text-orange-700 border-orange-200",
  finance: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-red-100 text-red-700 border-red-200",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  instructor: GraduationCap,
  coordinator: Users2,
  sales: Zap,
  finance: DollarSign,
  admin: Shield,
};

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function StatusBadge({ pct }: { pct: number }) {
  if (pct === 100) return (
    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
      <CheckCircle2 className="w-3 h-3" /> Complete
    </Badge>
  );
  if (pct >= 50) return (
    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
      <Clock className="w-3 h-3" /> In Progress
    </Badge>
  );
  if (pct > 0) return (
    <Badge className="bg-orange-100 text-orange-700 border-orange-200 gap-1">
      <AlertCircle className="w-3 h-3" /> Started
    </Badge>
  );
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="w-3 h-3" /> Not Started
    </Badge>
  );
}

export default function OnboardingDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: allProgress, isLoading } = trpc.guide.getAllProgress.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  // Aggregate stats
  const stats = useMemo(() => {
    if (!allProgress) return null;
    const totalStaff = new Set(allProgress.map((r) => r.userId)).size;
    const completed = allProgress.filter((r) => {
      const total = ROLE_TOTAL_ITEMS[r.role] ?? 20;
      const done = (r.completedItems as string[]).filter((k) => k !== "__complete__").length;
      return done >= total;
    }).length;
    const inProgress = allProgress.filter((r) => {
      const done = (r.completedItems as string[]).filter((k) => k !== "__complete__").length;
      return done > 0;
    }).length - completed;
    const avgPct = allProgress.length === 0 ? 0 : Math.round(
      allProgress.reduce((sum, r) => {
        const total = ROLE_TOTAL_ITEMS[r.role] ?? 20;
        const done = (r.completedItems as string[]).filter((k) => k !== "__complete__").length;
        return sum + Math.min(100, Math.round((done / total) * 100));
      }, 0) / allProgress.length
    );
    return { totalStaff, completed, inProgress, avgPct };
  }, [allProgress]);

  // Group by user
  const byUser = useMemo(() => {
    if (!allProgress) return [];
    const map = new Map<number, {
      userId: number;
      name: string | null;
      email: string | null;
      userRole: string | null;
      entries: typeof allProgress;
    }>();
    for (const row of allProgress) {
      if (!map.has(row.userId)) {
        map.set(row.userId, {
          userId: row.userId,
          name: row.userName ?? null,
          email: row.userEmail ?? null,
          userRole: row.userRole ?? null,
          entries: [],
        });
      }
      map.get(row.userId)!.entries.push(row);
    }
    return Array.from(map.values()).sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  }, [allProgress]);

  if (!user) return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Onboarding Progress Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track how your team is progressing through the onboarding guide
          </p>
        </div>
        <button
          onClick={() => navigate("/onboarding-guide")}
          className="text-sm text-primary hover:underline"
        >
          View Onboarding Guide →
        </button>
      </div>

      {/* Summary stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100"><Users className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStaff}</p>
                  <p className="text-xs text-muted-foreground">Staff with progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Fully completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100"><Clock className="w-5 h-5 text-yellow-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgPct}%</p>
                  <p className="text-xs text-muted-foreground">Avg completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Per-user table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Staff Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : byUser.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No onboarding progress recorded yet</p>
              <p className="text-sm mt-1">Staff members will appear here once they start their onboarding checklist.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {byUser.map((staff) => {
                const RoleIcon = ROLE_ICONS[staff.userRole ?? ""] ?? Shield;
                return (
                  <div key={staff.userId} className="border rounded-lg p-4 space-y-3">
                    {/* Staff header */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                          {getInitials(staff.name, staff.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{staff.name || "Unnamed Staff"}</p>
                        <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                      </div>
                      {staff.userRole && (
                        <Badge className={`${ROLE_COLORS[staff.userRole] ?? "bg-gray-100 text-gray-700"} gap-1 text-xs`}>
                          <RoleIcon className="w-3 h-3" />
                          {staff.userRole.charAt(0).toUpperCase() + staff.userRole.slice(1)}
                        </Badge>
                      )}
                    </div>

                    {/* Checklist rows per role */}
                    <div className="space-y-2 pl-12">
                      {staff.entries.map((entry) => {
                        const total = ROLE_TOTAL_ITEMS[entry.role] ?? 20;
                        const done = (entry.completedItems as string[]).filter((k) => k !== "__complete__").length;
                        const pct = Math.min(100, Math.round((done / total) * 100));
                        const EntryIcon = ROLE_ICONS[entry.role] ?? Shield;
                        return (
                          <div key={entry.progressId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                <EntryIcon className="w-3 h-3" />
                                {entry.role.charAt(0).toUpperCase() + entry.role.slice(1)} guide
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{done}/{total} steps</span>
                                <StatusBadge pct={pct} />
                              </div>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                            {entry.updatedAt && (
                              <p className="text-xs text-muted-foreground/60">
                                Last updated: {new Date(entry.updatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
