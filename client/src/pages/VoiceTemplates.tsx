import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mic, Plus, Edit2, Trash2, Loader2, Play, Clock, Volume2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PRESET_SCRIPTS = [
  {
    name: "Class Reminder Call",
    category: "reminder" as const,
    language: "en" as const,
    scriptText: "Hello, this is LIOTA Institute calling for [Student Name]. This is a friendly reminder that your [Class Name] class is scheduled for [Date] at [Time]. Please make sure to be on time and have your materials ready. If you need to reschedule, please call us at your earliest convenience. Thank you and have a great day!",
    duration: 25,
    voiceType: "female" as const,
    status: "active" as const,
  },
  {
    name: "Payment Due Reminder",
    category: "payment_due" as const,
    language: "en" as const,
    scriptText: "Hello, this is LIOTA Institute. We are calling to remind [Student Name] that a payment of [Amount] for the [Program] program is due on [Due Date]. You can pay via Stripe, Zelle, Dolla App, or PayPal. Please contact our office if you need assistance with your payment plan. Thank you!",
    duration: 22,
    voiceType: "neutral" as const,
    status: "active" as const,
  },
  {
    name: "Welcome Call",
    category: "welcome" as const,
    language: "en" as const,
    scriptText: "Hello [Student Name], welcome to LIOTA Institute - Language Institute Of The Americas! We are so excited to have you join our community. Your enrollment in the [Program] program has been confirmed. Your first class will be on [Date] at [Time]. If you have any questions before your first class, please don't hesitate to call us. We look forward to helping you achieve your language goals!",
    duration: 30,
    voiceType: "female" as const,
    status: "active" as const,
  },
  {
    name: "Class Cancelled Notice",
    category: "class_cancelled" as const,
    language: "en" as const,
    scriptText: "Hello [Student Name], this is LIOTA Institute. We regret to inform you that your [Class Name] class scheduled for [Date] at [Time] has been cancelled due to [Reason]. Your class will be rescheduled to [New Date] at [New Time]. We apologize for any inconvenience. Please call us if you have any questions.",
    duration: 20,
    voiceType: "neutral" as const,
    status: "active" as const,
  },
  {
    name: "Promotional Offer",
    category: "promotion" as const,
    language: "en" as const,
    scriptText: "Hello [Name], this is LIOTA Institute with an exciting offer! For a limited time, we are offering [Discount]% off on all [Program] enrollments. This offer is valid until [Expiry Date]. Don't miss this opportunity to start your language learning journey with certified instructors and small group classes. Call us today or visit languageinstituteoftheamericas.com to enroll!",
    duration: 28,
    voiceType: "female" as const,
    status: "draft" as const,
  },
  {
    name: "Recordatorio de Clase",
    category: "reminder" as const,
    language: "es" as const,
    scriptText: "Hello, this is LIOTA Institute calling for [Student Name]. This is a reminder that your [Class Name] class is scheduled for [Date] at [Time]. Please make sure to arrive on time and have your materials ready. If you need to reschedule, please call us as soon as possible. Thank you and have a wonderful day!",
    duration: 25,
    voiceType: "female" as const,
    status: "active" as const,
  },
];

const categoryColors: Record<string, string> = {
  reminder: "bg-cyan-50 text-cyan-700 border-cyan-200",
  welcome: "bg-emerald-50 text-emerald-700 border-emerald-200",
  payment_due: "bg-red-50 text-red-700 border-red-200",
  class_cancelled: "bg-orange-50 text-orange-700 border-orange-200",
  promotion: "bg-amber-50 text-amber-700 border-amber-200",
  follow_up: "bg-blue-50 text-blue-700 border-blue-200",
  emergency: "bg-red-100 text-red-800 border-red-300",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  archived: "bg-slate-100 text-slate-600",
};

type FormState = {
  name: string;
  category: "reminder"|"welcome"|"payment_due"|"class_cancelled"|"promotion"|"follow_up"|"emergency"|"other";
  language: "en"|"es"|"both";
  scriptText: string;
  duration?: number;
  voiceType: "male"|"female"|"neutral";
  status: "draft"|"active"|"archived";
};

const emptyForm: FormState = {
  name: "", category: "reminder", language: "en",
  scriptText: "", voiceType: "neutral", status: "draft",
};

export default function VoiceTemplates() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showPresets, setShowPresets] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data: templates = [], isLoading, refetch } = trpc.voice.list.useQuery({ category: filterCategory });

  const createMutation = trpc.voice.create.useMutation({
    onSuccess: () => { toast.success("Voice template created"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.voice.update.useMutation({
    onSuccess: () => { toast.success("Template updated"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.voice.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const openEdit = (tmpl: any) => {
    setForm({ name: tmpl.name, category: tmpl.category, language: tmpl.language, scriptText: tmpl.scriptText, duration: tmpl.duration ?? undefined, voiceType: tmpl.voiceType ?? "neutral", status: tmpl.status });
    setEditId(tmpl.id);
    setShowForm(true);
  };

  const loadPreset = (preset: typeof PRESET_SCRIPTS[0]) => {
    setForm({ name: preset.name, category: preset.category, language: preset.language, scriptText: preset.scriptText, duration: preset.duration, voiceType: preset.voiceType, status: preset.status });
    setShowPresets(false);
    setShowForm(true);
  };

  const simulatePlay = (id: number) => {
    setPlayingId(id);
    setTimeout(() => setPlayingId(null), 3000);
    toast.info("Voice preview simulation (connect TTS API for real playback)");
  };

  const activeCount = (templates as any[]).filter((t: any) => t.status === "active").length;
  const totalDuration = (templates as any[]).reduce((s: number, t: any) => s + (t.duration ?? 0), 0);
  const totalUsage = (templates as any[]).reduce((s: number, t: any) => s + (t.usageCount ?? 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mic className="w-6 h-6 text-violet-600" /> Voice Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Automated voice call scripts for student outreach</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPresets(true)} className="gap-2">
            <Volume2 className="w-4 h-4" /> Load Preset
          </Button>
          <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Script
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scripts", value: (templates as any[]).length, color: "text-violet-600" },
          { label: "Active", value: activeCount, color: "text-green-600" },
          { label: "Total Duration", value: `${totalDuration}s`, color: "text-blue-600" },
          { label: "Total Calls", value: totalUsage.toLocaleString(), color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["reminder","welcome","payment_due","class_cancelled","promotion","follow_up","emergency","other"].map(c => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (templates as any[]).length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <Mic className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No voice templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Load Preset" to add pre-built call scripts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(templates as any[]).map((tmpl: any) => (
            <Card key={tmpl.id} className="border border-border hover:shadow-md transition-all group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{tmpl.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className={`text-xs border ${categoryColors[tmpl.category] ?? ""}`}>
                        {tmpl.category.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs border">
                        {tmpl.language === "en" ? "English" : tmpl.language === "es" ? "Spanish" : "Bilingual"}
                      </Badge>
                      <Badge className={`text-xs ${statusColors[tmpl.status] ?? ""}`}>
                        {tmpl.status}
                      </Badge>
                      {tmpl.duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{tmpl.duration}s
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-violet-600" onClick={() => simulatePlay(tmpl.id)}>
                      {playingId === tmpl.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(tmpl)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(tmpl.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4 font-mono leading-relaxed">{tmpl.scriptText}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground capitalize">Voice: {tmpl.voiceType ?? "neutral"}</span>
                  <span className="text-xs text-muted-foreground">Used {tmpl.usageCount ?? 0} times</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Presets Dialog */}
      <Dialog open={showPresets} onOpenChange={setShowPresets}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Load Preset Voice Script</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            {PRESET_SCRIPTS.map((preset, i) => (
              <div key={i} className="border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-all" onClick={() => loadPreset(preset)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{preset.name}</p>
                  <Badge variant="outline" className={`text-xs border ${categoryColors[preset.category] ?? ""}`}>{preset.category.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{preset.language === "en" ? "English" : "Spanish"}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{preset.duration}s</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{preset.scriptText}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Voice Script" : "New Voice Script"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Script Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Class Reminder EN" />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["reminder","welcome","payment_due","class_cancelled","promotion","follow_up","emergency","other"].map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Language *</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="both">Bilingual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Voice Type</Label>
                <Select value={form.voiceType} onValueChange={(v) => setForm({ ...form, voiceType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duration (seconds)</Label>
                <Input type="number" value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g., 30" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Script Text * <span className="text-muted-foreground font-normal">(use [Variable] for dynamic content)</span></Label>
                <Textarea value={form.scriptText} onChange={(e) => setForm({ ...form, scriptText: e.target.value })} placeholder="Hello [Student Name], this is LIOTA Institute calling..." rows={6} className="font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.scriptText || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editId ? "Save Changes" : "Create Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Voice Script</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
