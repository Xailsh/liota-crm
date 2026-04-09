import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3, TrendingUp, Users, Mail, DollarSign, MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const CAMPUS_COLORS: Record<string, string> = {
  merida: "#6366f1", dallas: "#10b981", denver: "#f59e0b", vienna: "#ec4899", online: "#3b82f6",
};
const MCER_COLORS: Record<string, string> = {
  A1: "#94a3b8", A2: "#60a5fa", B1: "#2dd4bf", B2: "#4ade80", C1: "#fbbf24", C2: "#a78bfa",
};
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#ef4444"];
const stageShortLabels: Record<string, string> = {
  new_lead: "New Lead", contacted: "Contacted", trial_scheduled: "Trial Sched.",
  trial_done: "Trial Done", proposal_sent: "Proposal", enrolled: "Enrolled", lost: "Lost",
};

export default function Analytics() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const campusData = (analytics?.studentsByCampus ?? []);
  const programData = (analytics?.studentsByProgram ?? []).map((p: any) => ({
    program: (p.ageGroup ?? p.program ?? "").charAt(0).toUpperCase() + (p.ageGroup ?? p.program ?? "").slice(1),
    count: p.count,
  }));
  const mcerData: any[] = [];
  const revenueByProgram: any[] = [];
  const leadsByStage = (analytics?.leadsByStage ?? []).map((l: any) => ({
    ...l, stage: stageShortLabels[l.stage] ?? l.stage,
  }));
  const campaignStats = analytics?.campaignStats;
  const monthlyRevenue = (analytics?.revenueByMonth ?? []).map((m: any) => ({
    month: m.month, revenue: Number(m.total),
  }));
  const totalStudents = campusData.reduce((s: number, c: any) => s + c.count, 0);
  const sentCampaigns = campaignStats?.sent ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Reports &amp; Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Retention, revenue, campaigns, and enrollment statistics</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Retention Rate", value: "87%", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Students", value: totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Campaigns Sent", value: sentCampaigns, icon: Mail, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Total Recipients", value: (campaignStats?.totalRecipients ?? 0).toLocaleString(), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border border-border card-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 1: Students by Campus + Students by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Students by Campus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet. Load demo data from the Dashboard.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={campusData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="campus" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {campusData.map((entry: any, index: number) => (
                      <Cell key={entry.campus} fill={CAMPUS_COLORS[entry.campus] ?? PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Distribution by Program</CardTitle>
          </CardHeader>
          <CardContent>
            {programData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie data={programData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="program">
                      {programData.map((entry: any, index: number) => (
                        <Cell key={entry.program} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {programData.map((entry: any, index: number) => (
                    <div key={entry.program} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{entry.program}</span>
                      <span className="font-semibold ml-auto">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Monthly Revenue + CEFR Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No revenue data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">CEFR Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {mcerData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No level data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mcerData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {mcerData.map((entry: any) => (
                      <Cell key={entry.level} fill={MCER_COLORS[entry.level] ?? "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Leads Funnel + Revenue by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Leads Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsByStage.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No lead data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leadsByStage} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Revenue by Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByProgram.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No financial data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByProgram} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="program" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Campaign Performance */}
      {(campaignStats?.total ?? 0) > 0 && (
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Email Campaign Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Campaigns", value: campaignStats?.total ?? 0 },
                { label: "Sent", value: campaignStats?.sent ?? 0 },
                { label: "Total Recipients", value: (campaignStats?.totalRecipients ?? 0).toLocaleString() },
                { label: "Total Opens", value: (campaignStats?.totalOpens ?? 0).toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Global open rate</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${campaignStats && campaignStats.totalRecipients > 0
                      ? Math.round((campaignStats.totalOpens / campaignStats.totalRecipients) * 100)
                      : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {campaignStats && campaignStats.totalRecipients > 0
                  ? Math.round((campaignStats.totalOpens / campaignStats.totalRecipients) * 100)
                  : 0}% open rate
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
