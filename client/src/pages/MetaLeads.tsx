import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Zap, RefreshCw, AlertTriangle, BookOpen, CheckCircle, XCircle, Clock,
  Loader2, Play, Pause, Trash2, Eye, AlertCircle, Info, Shield, Bot, Code2, Brain, Globe, Copy, Plus
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Setup Guide ─────────────────────────────────────────────────────────────
function SetupGuide() {
  const steps = [
    {
      step: 1, title: "Create a Meta Business Account",
      description: "Go to business.facebook.com and create or verify your Meta Business account. This is required to access the Meta Leads API.",
      status: "info" as const,
      link: "https://business.facebook.com",
    },
    {
      step: 2, title: "Set Up a Facebook Page",
      description: "Create or connect a Facebook Page for LIOTA Institute. This page will be used to run lead generation ads.",
      status: "info" as const,
    },
    {
      step: 3, title: "Create a Meta App",
      description: "Go to developers.facebook.com and create a new app. Select 'Business' type and add the 'Leads Access' product.",
      status: "info" as const,
      link: "https://developers.facebook.com",
    },
    {
      step: 4, title: "Configure Webhook",
      description: "In your Meta App settings, add a webhook subscription for 'leadgen' events. Use the Inbound Webhook URL from the Integrations section.",
      status: "info" as const,
    },
    {
      step: 5, title: "Add Page Subscription",
      description: "Subscribe your Facebook Page to receive lead notifications. Go to your app's Webhooks section and subscribe to the page.",
      status: "info" as const,
    },
    {
      step: 6, title: "Create Lead Gen Forms",
      description: "In Meta Ads Manager, create Lead Generation campaigns with instant forms. Customize fields to capture name, email, phone, and program interest.",
      status: "info" as const,
      link: "https://www.facebook.com/adsmanager",
    },
    {
      step: 7, title: "Test the Integration",
      description: "Use Meta's Lead Ads Testing Tool to send a test lead and verify it appears in the Webhook Events tab.",
      status: "info" as const,
    },
    {
      step: 8, title: "Configure Sync Jobs",
      description: "Set up automated sync jobs to pull leads from Meta and create them in the LIOTA CRM pipeline automatically.",
      status: "info" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-800">Meta Leads Integration</p>
            <p className="text-sm text-blue-700 mt-1">This integration allows LIOTA Institute to automatically capture leads from Facebook and Instagram ads directly into the CRM pipeline. Follow the steps below to set up the connection.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <Card key={step.step} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{step.step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  {step.link && (
                    <a href={step.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                      {step.link} →
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Webhook Events ───────────────────────────────────────────────────────────
function WebhookEventsTab() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [viewPayload, setViewPayload] = useState<string | null>(null);

  const { data: events = [], isLoading, refetch } = trpc.webhookEvents.list.useQuery({ status: filterStatus, source: filterSource === "all" ? undefined : filterSource, limit: 100 });
  const updateMutation = trpc.webhookEvents.update.useMutation({
    onSuccess: () => { toast.success("Event updated"); refetch(); },
  });

  const statusColors: Record<string, string> = {
    received: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    processed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    ignored: "bg-gray-100 text-gray-600",
  };

  const markProcessed = (id: number) => {
    updateMutation.mutate({ id, data: { status: "processed", processedAt: new Date() } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["received","processing","processed","failed","ignored"].map(s => (
                <SelectItem key={s} value={s}>{s.replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {["meta","whatsapp","stripe","zapier","make","custom"].map(s => (
                <SelectItem key={s} value={s}>{s.replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (events as any[]).length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No webhook events yet</p>
            <p className="text-sm text-muted-foreground mt-1">Events will appear here when webhooks are received</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(events as any[]).map((event: any) => (
            <Card key={event.id} className="border border-border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge className={`text-xs shrink-0 ${statusColors[event.status] ?? ""}`}>{event.status}</Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.eventType}</p>
                      <p className="text-xs text-muted-foreground">Source: {event.source} · {new Date(event.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {event.payload && (
                      <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setViewPayload(event.payload)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {event.status !== "processed" && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600" onClick={() => markProcessed(event.id)}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                {event.errorMessage && (
                  <p className="text-xs text-red-600 mt-1 bg-red-50 rounded p-1">{event.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewPayload} onOpenChange={(o) => { if (!o) setViewPayload(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Webhook Payload</DialogTitle></DialogHeader>
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto whitespace-pre-wrap">{viewPayload ? (() => { try { return JSON.stringify(JSON.parse(viewPayload), null, 2); } catch { return viewPayload; } })() : ""}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sync Jobs ────────────────────────────────────────────────────────────────
function SyncJobsTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "meta_leads" as const, config: "" });

  const { data: jobs = [], isLoading, refetch } = trpc.syncJobs.list.useQuery();
  const createMutation = trpc.syncJobs.create.useMutation({
    onSuccess: () => { toast.success("Sync job created"); setShowForm(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.syncJobs.update.useMutation({
    onSuccess: () => { toast.success("Job updated"); refetch(); },
  });
  const deleteMutation = trpc.syncJobs.delete.useMutation({
    onSuccess: () => { toast.success("Job deleted"); refetch(); },
  });

  const statusColors: Record<string, string> = {
    idle: "bg-gray-100 text-gray-600",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    paused: "bg-yellow-100 text-yellow-700",
  };

  const toggleJob = (job: any) => {
    const newStatus = job.status === "running" ? "paused" : "running";
    updateMutation.mutate({ id: job.id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Automated data synchronization jobs between Meta and LIOTA CRM</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Job
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (jobs as any[]).length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No sync jobs configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(jobs as any[]).map((job: any) => (
            <Card key={job.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${job.status === "running" ? "bg-green-500 animate-pulse" : job.status === "failed" ? "bg-red-500" : "bg-gray-400"}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{job.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{job.type.replace(/_/g, " ")}</Badge>
                        <Badge className={`text-xs ${statusColors[job.status] ?? ""}`}>{job.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {job.lastRunAt ? `Last run: ${new Date(job.lastRunAt).toLocaleString()}` : "Never run"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processed: {job.recordsProcessed ?? 0} · Failed: {job.recordsFailed ?? 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => toggleJob(job)}>
                      {job.status === "running" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteMutation.mutate({ id: job.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {job.errorMessage && (
                  <p className="text-xs text-red-600 mt-2 bg-red-50 rounded p-1">{job.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Sync Job</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Job Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Meta Leads Daily Sync" />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["meta_leads","email_sync","payment_sync","student_sync","calendar_sync","whatsapp_sync"].map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Error Logs ───────────────────────────────────────────────────────────────
function ErrorLogsTab() {
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterResolved, setFilterResolved] = useState("all");
  const { data: logs = [], isLoading, refetch } = trpc.errorLogs.list.useQuery({
    level: filterLevel,
    resolved: filterResolved === "all" ? undefined : filterResolved === "true",
    limit: 100,
  });
  const resolveMutation = trpc.errorLogs.resolve.useMutation({
    onSuccess: () => { toast.success("Error resolved"); refetch(); },
  });
  const deleteMutation = trpc.errorLogs.delete.useMutation({
    onSuccess: () => { toast.success("Log deleted"); refetch(); },
  });

  const levelColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-900 font-bold",
  };
  const levelIcons: Record<string, React.ReactNode> = {
    info: <Info className="w-4 h-4 text-blue-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
    error: <XCircle className="w-4 h-4 text-red-600" />,
    critical: <Shield className="w-4 h-4 text-red-800" />,
  };

  const unresolvedCount = (logs as any[]).filter((l: any) => !l.resolved).length;
  const criticalCount = (logs as any[]).filter((l: any) => l.level === "critical" && !l.resolved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">{criticalCount} critical unresolved</span>
            </div>
          )}
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {["info","warning","error","critical"].map(l => (
                <SelectItem key={l} value={l}>{l.replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResolved} onValueChange={setFilterResolved}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="false">Unresolved</SelectItem>
              <SelectItem value="true">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (logs as any[]).length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-muted-foreground">No error logs found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(logs as any[]).map((log: any) => (
            <Card key={log.id} className={`border ${log.resolved ? "border-border opacity-60" : log.level === "critical" ? "border-red-300" : "border-border"}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="shrink-0 mt-0.5">{levelIcons[log.level]}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${levelColors[log.level] ?? ""}`}>{log.level}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{log.source}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                        {log.resolved && <Badge className="text-xs bg-green-100 text-green-700">Resolved</Badge>}
                      </div>
                      <p className="text-sm text-foreground mt-1">{log.message}</p>
                      {log.stackTrace && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">Stack trace</summary>
                          <pre className="text-xs text-muted-foreground mt-1 bg-muted rounded p-2 overflow-auto whitespace-pre-wrap">{log.stackTrace}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!log.resolved && (
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-green-600" onClick={() => resolveMutation.mutate({ id: log.id, resolvedBy: "admin" })}>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteMutation.mutate({ id: log.id })}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Front Door Tab ───────────────────────────────────────────────────────
function AiFrontDoorTab() {
  const [copied, setCopied] = useState(false);
  const embedSnippet = `<!-- LIOTA Institute AI Front Door -->
<script src="https://liotacrm-yzzjutco.manus.space/ai-widget.js" data-app-id="liota-ai" async></script>
<div id="liota-ai-widget"></div>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const knowledgeBase = [
    { topic: "ESL Program", description: "English as a Second Language, A1–C2 levels, all ages, online & on-site" },
    { topic: "SSL Program", description: "Spanish as a Second Language, A1–C2 levels, Mérida campus focus" },
    { topic: "Polyglot Program", description: "3+ languages simultaneously, advanced learners, immersive approach" },
    { topic: "STEAM Integration", description: "Language learning combined with Science, Technology, Engineering, Arts, Math" },
    { topic: "Business Language", description: "Professional communication for corporate clients, B1–C2" },
    { topic: "Seasonal Camps", description: "Winter, Spring, Summer, Fall immersive camps for children & teens" },
    { topic: "Campuses", description: "Mérida (MXN), Dallas (USD), Denver (USD), Vienna (EUR), Online" },
    { topic: "Pricing", description: "200 MXN/hr in Mexico · $20 USD/hr in USA · Packages available" },
    { topic: "CEFR Levels", description: "A1, A2, B1, B2, C1, C2 — all levels accepted, placement test available" },
    { topic: "Enrollment", description: "Open enrollment year-round, free trial class available" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Front Door</h2>
            <p className="text-sm text-muted-foreground mt-1">
              An AI-powered customer service chatbot for the LIOTA Institute website. It answers questions about programs,
              pricing, enrollment, and campuses — and captures leads automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Embed snippet */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Embed on Your Website</span>
          </div>
          <span className="text-xs text-muted-foreground">2-line snippet — paste before &lt;/body&gt;</span>
        </div>
        <div className="relative">
          <pre className="text-xs bg-gray-950 text-green-400 p-4 overflow-x-auto font-mono leading-relaxed">{embedSnippet}</pre>
          <button
            onClick={copySnippet}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Knowledge base */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">AI Knowledge Base</span>
          <span className="ml-auto text-xs text-muted-foreground">{knowledgeBase.length} topics loaded</span>
        </div>
        <div className="divide-y divide-border">
          {knowledgeBase.map((item) => (
            <div key={item.topic} className="flex items-start gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-foreground">{item.topic}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Supported Languages</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["English", "Español", "Français", "Português", "Deutsch", "العربية", "Русский", "Maya Yucateca"].map((lang) => (
            <span key={lang} className="px-3 py-1 rounded-full bg-muted text-xs font-medium">{lang}</span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">The AI automatically detects the visitor's language and responds accordingly.</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Sandbox Mode:</strong> The AI widget is currently in sandbox mode. To activate it on your live website,
          add the embed snippet above to your LIOTA Institute website HTML.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MetaLeads() {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" /> Meta Leads
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Facebook & Instagram lead capture integration and monitoring</p>
      </div>

       <Tabs defaultValue="setup">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup" className="gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Setup Guide
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" /> Webhooks
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Sync Jobs
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Error Logs
          </TabsTrigger>
          <TabsTrigger value="ai-front-door" className="gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> AI Front Door
          </TabsTrigger>
        </TabsList>
        <TabsContent value="setup" className="mt-4">
          <SetupGuide />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4">
          <WebhookEventsTab />
        </TabsContent>
        <TabsContent value="sync" className="mt-4">
          <SyncJobsTab />
        </TabsContent>
        <TabsContent value="errors" className="mt-4">
          <ErrorLogsTab />
        </TabsContent>
        <TabsContent value="ai-front-door" className="mt-4">
          <AiFrontDoorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
