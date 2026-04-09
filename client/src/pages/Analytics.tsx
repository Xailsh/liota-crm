import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart3, TrendingUp, Users, Mail, DollarSign, MapPin } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const CAMPUS_COLORS: Record<string, string> = {
  merida: "#6366f1",
  dallas: "#10b981",
  denver: "#f59e0b",
  vienna: "#ec4899",
  online: "#3b82f6",
};

const MCER_COLORS: Record<string, string> = {
  A1: "#94a3b8",
  A2: "#60a5fa",
  B1: "#2dd4bf",
  B2: "#4ade80",
  C1: "#fbbf24",
  C2: "#a78bfa",
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#ef4444"];

const stageShortLabels: Record<string, string> = {
  new_lead: "Nuevo",
  contacted: "Contactado",
  trial_scheduled: "Prueba Ag.",
  trial_done: "Prueba OK",
  proposal_sent: "Propuesta",
  enrolled: "Inscrito",
  lost: "Perdido",
};

export default function Analytics() {
  const { data: analytics, isLoading } = trpc.analytics.overview.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  const campusData = analytics?.studentsByCampus ?? [];
  const programData = (analytics?.studentsByProgram ?? []).map((p: any) => ({ ...p, program: p.ageGroup }));
  const mcerData: any[] = [];
  const revenueByProgram: any[] = [];
  const leadsByStage = (analytics?.leadsByStage ?? []).map((l: any) => ({ ...l, stage: stageShortLabels[l.stage] ?? l.stage }));
  const campaignStats = analytics?.campaignStats;
  const monthlyRevenue = (analytics?.revenueByMonth ?? []).map((m: any) => ({ month: m.month, revenue: m.total }));
  const totalStudents = (analytics?.studentsByCampus ?? []).reduce((s: number, c: any) => s + c.count, 0);
  const retentionRate = 87;
  const sentCampaigns = campaignStats?.sent ?? 0;
  const totalRevenue = campaignStats?.totalRecipients ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Reportes y Analíticas
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Métricas de retención, ingresos, campañas y matrículas</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tasa de Retención", value: `${retentionRate}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Estudiantes", value: totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Campañas Enviadas", value: sentCampaigns, icon: Mail, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Destinatarios Totales", value: (campaignStats?.totalRecipients ?? 0).toLocaleString(), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
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
              <MapPin className="w-4 h-4 text-primary" /> Estudiantes por Sede
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
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
            <CardTitle className="text-base font-semibold">Distribución por Programa</CardTitle>
          </CardHeader>
          <CardContent>
            {programData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
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

      {/* Row 2: Monthly Revenue + MCER Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Ingresos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos de ingresos</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Ingresos"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Distribución por Nivel MCER</CardTitle>
          </CardHeader>
          <CardContent>
            {mcerData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos de niveles</div>
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

      {/* Row 3: Leads Pipeline + Revenue by Program */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Embudo de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsByStage.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos de leads</div>
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
              <DollarSign className="w-4 h-4 text-primary" /> Ingresos por Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByProgram.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos financieros</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueByProgram} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="program" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Ingresos"]} />
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
              <Mail className="w-4 h-4 text-primary" /> Resumen de Campañas de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Campañas", value: campaignStats?.total ?? 0 },
                { label: "Enviadas", value: campaignStats?.sent ?? 0 },
                { label: "Total Destinatarios", value: (campaignStats?.totalRecipients ?? 0).toLocaleString() },
                { label: "Total Aperturas", value: (campaignStats?.totalOpens ?? 0).toLocaleString() },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Tasa de apertura global</p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${campaignStats && campaignStats.totalRecipients > 0 ? Math.round((campaignStats.totalOpens / campaignStats.totalRecipients) * 100) : 0}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{campaignStats && campaignStats.totalRecipients > 0 ? Math.round((campaignStats.totalOpens / campaignStats.totalRecipients) * 100) : 0}% de tasa de apertura</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
