import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Mail,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  MapPin,
  ArrowUpRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const campusLabels: Record<string, string> = {
  merida: "Mérida",
  dallas: "Dallas",
  denver: "Denver",
  vienna: "Vienna",
  online: "Online",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  trial: "bg-blue-100 text-blue-700 border-blue-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  graduated: "bg-purple-100 text-purple-700 border-purple-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  trial: "Trial",
  inactive: "Inactive",
  graduated: "Graduated",
  suspended: "Suspended",
};

const stageLabels: Record<string, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  trial_scheduled: "Trial Scheduled",
  trial_done: "Trial Done",
  proposal_sent: "Proposal Sent",
  enrolled: "Enrolled",
  lost: "Lost",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: metrics, isLoading, refetch } = trpc.dashboard.metrics.useQuery();
  const seedMutation = trpc.dashboard.seed.useMutation({
    onSuccess: () => {
      toast.success("Demo data loaded successfully");
      refetch();
    },
    onError: (e) => toast.error("Error loading data: " + e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Students",
      value: metrics?.totalStudents ?? 0,
      sub: `${metrics?.activeStudents ?? 0} active · ${metrics?.trialStudents ?? 0} in trial`,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      title: "Monthly Revenue",
      value: `$${(metrics?.monthlyRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      sub: "USD · Completed payments",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Active Campaigns",
      value: metrics?.activeCampaigns ?? 0,
      sub: "Draft or scheduled",
      icon: Mail,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Scheduled Classes",
      value: metrics?.scheduledClasses ?? 0,
      sub: "Active and upcoming",
      icon: BookOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      title: "Active Leads",
      value: metrics?.totalLeads ?? 0,
      sub: "In the sales pipeline",
      icon: Users,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      title: "Satisfaction Rate",
      value: `${metrics?.satisfactionRate ?? 95}%`,
      sub: "Based on assessments",
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-100",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.name?.split(" ")[0] ?? "Administrator"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Control Panel · LIOTA Institute — Language Institute Of The Americas
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {(metrics?.totalStudents ?? 0) === 0 && (
            <Button
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="gap-2 text-xs bg-primary"
            >
              {seedMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              Load Demo Data
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="border border-border card-shadow hover:card-shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground leading-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary */}
      <Card className="border border-border card-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Financial Summary</CardTitle>
            <Badge variant="outline" className="text-xs">USD</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: metrics?.totalRevenue ?? 0, color: "text-emerald-600" },
              { label: "Pending to Collect", value: metrics?.pendingRevenue ?? 0, color: "text-amber-600" },
              { label: "Total Expenses", value: metrics?.totalExpenses ?? 0, color: "text-red-500" },
              { label: "Net Profit", value: (metrics?.totalRevenue ?? 0) - (metrics?.totalExpenses ?? 0), color: "text-blue-600" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold ${item.color}`}>
                  ${item.value.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Students */}
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Recent Students
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7" asChild>
                <a href="/students">View all <ArrowUpRight className="w-3 h-3" /></a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(metrics?.recentStudents ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No students yet. Load demo data to get started.
              </p>
            ) : (
              (metrics?.recentStudents ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {s.firstName[0]}{s.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.firstName} {s.lastName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{campusLabels[s.campus] ?? s.campus}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs border ${statusColors[s.enrollmentStatus] ?? ""} flex-shrink-0`}>
                    {statusLabels[s.enrollmentStatus] ?? s.enrollmentStatus}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Recent Leads
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1 h-7" asChild>
                <a href="/leads">View pipeline <ArrowUpRight className="w-3 h-3" /></a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(metrics?.recentLeads ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No leads yet.
              </p>
            ) : (
              (metrics?.recentLeads ?? []).map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-amber-700">
                        {lead.firstName[0]}{lead.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-muted-foreground">{lead.email ?? lead.phone ?? "—"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0 max-w-28 truncate">
                    {stageLabels[lead.stage] ?? lead.stage}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campus Overview */}
      <Card className="border border-border card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            LIOTA Campuses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "merida", label: "Mérida", country: "México 🇲🇽", color: "border-blue-200 bg-blue-50" },
              { key: "dallas", label: "Dallas", country: "Texas, USA 🇺🇸", color: "border-green-200 bg-green-50" },
              { key: "denver", label: "Denver", country: "Colorado, USA 🇺🇸", color: "border-purple-200 bg-purple-50" },
              { key: "vienna", label: "Vienna", country: "Austria 🇦🇹", color: "border-rose-200 bg-rose-50" },
              { key: "online", label: "Online", country: "Global 🌐", color: "border-amber-200 bg-amber-50" },
            ].map((campus) => (
              <div key={campus.key} className={`border rounded-xl p-3 ${campus.color} text-center`}>
                <p className="text-sm font-semibold text-foreground">{campus.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{campus.country}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
