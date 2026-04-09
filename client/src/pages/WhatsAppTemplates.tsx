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
import { MessageSquare, Plus, Edit2, Trash2, Loader2, Copy, CheckCircle, Globe, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PRESET_TEMPLATES: Array<{
  name: string;
  category: "marketing"|"utility"|"authentication"|"reminder"|"welcome"|"follow_up"|"payment"|"progress_report";
  language: "en"|"es"|"both";
  headerText?: string;
  bodyText: string;
  footerText?: string;
  buttonType: "none"|"quick_reply"|"call_to_action";
  variables?: string;
}> = [
  {
    name: "Welcome New Student",
    category: "welcome" as const,
    language: "en" as const,
    headerText: "Welcome to LIOTA Institute! 🎉",
    bodyText: "Hello {{1}}! We're thrilled to welcome you to LIOTA Institute - Language Institute Of The Americas.\n\nYour enrollment in the *{{2}}* program has been confirmed.\n\n📅 Your first class is on *{{3}}* at *{{4}}*\n📍 Campus: *{{5}}*\n\nIf you have any questions, don't hesitate to reach out. We're here to help you succeed!",
    footerText: "LIOTA Institute | languageinstituteoftheamericas.com",
    buttonType: "quick_reply" as const,
    variables: "student_name,program,date,time,campus",
  },
  {
    name: "Class Reminder",
    category: "reminder" as const,
    language: "en" as const,
    headerText: "Class Reminder 📚",
    bodyText: "Hi {{1}}! This is a friendly reminder that your *{{2}}* class is scheduled for:\n\n📅 *{{3}}* at *{{4}}*\n📍 *{{5}}*\n\nPlease make sure to:\n✅ Be on time\n✅ Have your materials ready\n✅ Check your internet connection (for online classes)\n\nSee you soon!",
    footerText: "LIOTA Institute",
    buttonType: "none" as const,
    variables: "student_name,class_name,date,time,location",
  },
  {
    name: "Payment Due Reminder",
    category: "payment" as const,
    language: "en" as const,
    headerText: "Payment Reminder 💳",
    bodyText: "Hello {{1}},\n\nThis is a reminder that your payment of *{{2}}* for the *{{3}}* program is due on *{{4}}*.\n\nPayment methods available:\n💳 Stripe (Credit/Debit Card)\n💚 Zelle: liotainstitute@email.com\n📱 Dolla App (Mexico)\n💰 PayPal\n\nPlease contact us if you need assistance with your payment plan.",
    footerText: "LIOTA Finance Department",
    buttonType: "call_to_action" as const,
    variables: "student_name,amount,program,due_date",
  },
  {
    name: "Progress Report Ready",
    category: "progress_report" as const,
    language: "en" as const,
    headerText: "Progress Report Available 📊",
    bodyText: "Dear {{1}},\n\nGreat news! The progress report for *{{2}}* is now available.\n\n📈 Current CEFR Level: *{{3}}*\n⭐ Overall Score: *{{4}}*\n📝 Period: *{{5}}*\n\nYour student has shown excellent dedication and improvement. Keep up the great work!\n\nContact your instructor for a detailed review.",
    footerText: "LIOTA Academic Team",
    buttonType: "none" as const,
    variables: "parent_name,student_name,cefr_level,score,period",
  },
  {
    name: "Free Trial Class Invitation",
    category: "marketing" as const,
    language: "en" as const,
    headerText: "Free Trial Class Invitation 🌟",
    bodyText: "Hello {{1}}!\n\nWe'd like to invite you to a *FREE trial class* at LIOTA Institute!\n\n🗓️ Date: *{{2}}*\n⏰ Time: *{{3}}*\n💻 Format: *{{4}}*\n\nDiscover why hundreds of students trust LIOTA to reach their language goals.\n\n✨ Certified instructors\n✨ Small groups (max 6 students)\n✨ Online & in-person options\n✨ Programs for all ages\n\nReply YES to confirm your spot!",
    footerText: "LIOTA Institute | Free Trial",
    buttonType: "quick_reply" as const,
    variables: "prospect_name,date,time,format",
  },
  {
    name: "Bienvenida Nuevo Estudiante",
    category: "welcome" as const,
    language: "es" as const,
    headerText: "Welcome to LIOTA Institute! 🎉",
    bodyText: "Hi {{1}}! We're excited to welcome you to LIOTA Institute - Language Institute Of The Americas.\n\nYour enrollment in the *{{2}}* program has been confirmed.\n\n📅 Your first class is on *{{3}}* at *{{4}}*\n📍 Campus: *{{5}}*\n\nIf you have any questions, don't hesitate to contact us. We're here to help you succeed!",
    footerText: "LIOTA Institute | languageinstituteoftheamericas.com",
    buttonType: "quick_reply" as const,
    variables: "nombre_estudiante,programa,fecha,hora,sede",
  },
  {
    name: "Recordatorio de Clase",
    category: "reminder" as const,
    language: "es" as const,
    headerText: "Recordatorio de Clase 📚",
    bodyText: "¡Hola {{1}}! Te recordamos que tu clase de *{{2}}* está programada para:\n\n📅 *{{3}}* a las *{{4}}*\n📍 *{{5}}*\n\nPor favor asegúrate de:\n✅ Llegar a tiempo\n✅ Tener tus materiales listos\n✅ Verificar tu conexión a internet (para clases online)\n\n¡Hasta pronto!",
    footerText: "LIOTA Institute",
    buttonType: "none" as const,
    variables: "nombre_estudiante,nombre_clase,fecha,hora,ubicacion",
  },
  {
    name: "Recordatorio de Pago",
    category: "payment" as const,
    language: "es" as const,
    headerText: "Recordatorio de Pago 💳",
    bodyText: "Hola {{1}},\n\nTe recordamos que tu pago de *{{2}}* por el programa *{{3}}* vence el *{{4}}*.\n\nMétodos de pago disponibles:\n💳 Stripe (Tarjeta de Crédito/Débito)\n💚 Zelle: liotainstitute@email.com\n📱 Dolla App\n💰 PayPal\n\nContáctanos si necesitas ayuda con tu plan de pagos.",
    footerText: "Departamento Financiero LIOTA",
    buttonType: "call_to_action" as const,
    variables: "nombre_estudiante,monto,programa,fecha_vencimiento",
  },
];

const categoryColors: Record<string, string> = {
  marketing: "bg-amber-50 text-amber-700 border-amber-200",
  utility: "bg-blue-50 text-blue-700 border-blue-200",
  authentication: "bg-purple-50 text-purple-700 border-purple-200",
  reminder: "bg-cyan-50 text-cyan-700 border-cyan-200",
  welcome: "bg-emerald-50 text-emerald-700 border-emerald-200",
  follow_up: "bg-orange-50 text-orange-700 border-orange-200",
  payment: "bg-red-50 text-red-700 border-red-200",
  progress_report: "bg-teal-50 text-teal-700 border-teal-200",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

type FormState = {
  name: string;
  category: "marketing"|"utility"|"authentication"|"reminder"|"welcome"|"follow_up"|"payment"|"progress_report";
  language: "en"|"es"|"both";
  headerText: string;
  bodyText: string;
  footerText: string;
  buttonType: "none"|"quick_reply"|"call_to_action";
  buttons: string;
  variables: string;
};
const emptyForm: FormState = {
  name: "", category: "reminder", language: "en",
  headerText: "", bodyText: "", footerText: "", buttonType: "none",
  buttons: "", variables: "",
};
export default function WhatsAppTemplates() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLang, setFilterLang] = useState("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const { data: templates = [], isLoading, refetch } = trpc.whatsapp.list.useQuery({ category: filterCategory, language: filterLang });

  const createMutation = trpc.whatsapp.create.useMutation({
    onSuccess: () => { toast.success("Template created"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.whatsapp.update.useMutation({
    onSuccess: () => { toast.success("Template updated"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.whatsapp.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const openEdit = (t: any) => {
    setForm({ name: t.name, category: t.category, language: t.language, headerText: t.headerText ?? "", bodyText: t.bodyText, footerText: t.footerText ?? "", buttonType: t.buttonType ?? "none", buttons: t.buttons ?? "", variables: t.variables ?? "" });
    setEditId(t.id);
    setShowForm(true);
  };

  const copyBody = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied to clipboard");
  };

  const loadPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setForm({ name: preset.name, category: preset.category, language: preset.language, headerText: preset.headerText ?? "", bodyText: preset.bodyText, footerText: preset.footerText ?? "", buttonType: preset.buttonType, buttons: "", variables: preset.variables ?? "" });
    setShowPresets(false);
    setShowForm(true);
  };

  const approvedCount = (templates as any[]).filter((t: any) => t.status === "approved").length;
  const draftCount = (templates as any[]).filter((t: any) => t.status === "draft").length;
  const totalUsage = (templates as any[]).reduce((s: number, t: any) => s + (t.usageCount ?? 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-600" /> WhatsApp Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pre-built response templates for student communications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPresets(true)} className="gap-2">
            <Copy className="w-4 h-4" /> Load Preset
          </Button>
          <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Templates", value: (templates as any[]).length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Approved", value: approvedCount, color: "text-green-600", bg: "bg-green-50" },
          { label: "Drafts", value: draftCount, color: "text-gray-600", bg: "bg-gray-50" },
          { label: "Total Sends", value: totalUsage.toLocaleString(), color: "text-violet-600", bg: "bg-violet-50" },
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
            {["marketing","utility","authentication","reminder","welcome","follow_up","payment","progress_report"].map(c => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLang} onValueChange={setFilterLang}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All Languages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="both">Bilingual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (templates as any[]).length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Load Preset" to add pre-built templates</p>
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
                        <Tag className="w-3 h-3 mr-1" />{tmpl.category.replace(/_/g, " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs border">
                        <Globe className="w-3 h-3 mr-1" />{tmpl.language === "en" ? "English" : tmpl.language === "es" ? "Spanish" : "Bilingual"}
                      </Badge>
                      <Badge className={`text-xs ${statusColors[tmpl.status] ?? ""}`}>
                        {tmpl.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => copyBody(tmpl.bodyText, tmpl.id)}>
                      {copiedId === tmpl.id ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
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
                {tmpl.headerText && (
                  <p className="text-xs font-semibold text-foreground mb-1">{tmpl.headerText}</p>
                )}
                <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4">{tmpl.bodyText}</p>
                {tmpl.footerText && (
                  <p className="text-xs text-muted-foreground/60 mt-1 italic">{tmpl.footerText}</p>
                )}
                {tmpl.variables && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tmpl.variables.split(",").map((v: string, i: number) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
                        {`{{${i + 1}}} ${v.trim()}`}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Used {tmpl.usageCount ?? 0} times</span>
                  <span className="text-xs text-muted-foreground">{tmpl.buttonType !== "none" ? `Buttons: ${tmpl.buttonType.replace(/_/g, " ")}` : "No buttons"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Presets Dialog */}
      <Dialog open={showPresets} onOpenChange={setShowPresets}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Load Preset Template</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            {PRESET_TEMPLATES.map((preset, i) => (
              <div key={i} className="border border-border rounded-lg p-3 hover:border-primary cursor-pointer transition-all" onClick={() => loadPreset(preset)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{preset.name}</p>
                  <Badge variant="outline" className={`text-xs border ${categoryColors[preset.category] ?? ""}`}>{preset.category.replace(/_/g, " ")}</Badge>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs border">
                    <Globe className="w-3 h-3 mr-1" />{preset.language === "en" ? "English" : "Spanish"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{preset.bodyText}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Template" : "New WhatsApp Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Template Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Class Reminder EN" />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["marketing","utility","authentication","reminder","welcome","follow_up","payment","progress_report"].map(c => (
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
              <div className="col-span-2 space-y-1.5">
                <Label>Header Text</Label>
                <Input value={form.headerText} onChange={(e) => setForm({ ...form, headerText: e.target.value })} placeholder="Optional header (bold, short)" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Body Text * <span className="text-muted-foreground font-normal">(use {`{{1}}`}, {`{{2}}`} for variables)</span></Label>
                <Textarea value={form.bodyText} onChange={(e) => setForm({ ...form, bodyText: e.target.value })} placeholder="Hello {{1}}, your class is on {{2}}..." rows={6} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Footer Text</Label>
                <Input value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} placeholder="e.g., LIOTA Institute" />
              </div>
              <div className="space-y-1.5">
                <Label>Button Type</Label>
                <Select value={form.buttonType} onValueChange={(v) => setForm({ ...form, buttonType: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Buttons</SelectItem>
                    <SelectItem value="quick_reply">Quick Reply</SelectItem>
                    <SelectItem value="call_to_action">Call to Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Variables (comma separated)</Label>
                <Input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="student_name,date,time" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.bodyText || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editId ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Template</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. The template will be permanently deleted.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
