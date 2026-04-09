import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Mail, Edit2, Trash2, Loader2, Copy, Eye, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PRESET_TEMPLATES = [
  {
    name: "Welcome New Student", lang: "en", subject: "Welcome to LIOTA Institute! 🎉", category: "onboarding",
    body: `Dear {{student_name}},

Welcome to the Language Institute Of The Americas (LIOTA)! We're thrilled to have you join our community of language learners.

Your enrollment in the {{program_name}} program at our {{campus}} campus is confirmed. Here are your details:

📅 Start Date: {{start_date}}
🕐 Schedule: {{schedule}}
📍 Location: {{location}}
👨‍🏫 Instructor: {{instructor_name}}

What to expect:
• Small group classes (maximum 6 students)
• Personalized CEFR-aligned curriculum
• Regular progress assessments
• Access to our online learning portal

If you have any questions, please don't hesitate to contact us.

Best regards,
The LIOTA Team
languageinstituteoftheamericas.com`,
  },
  {
    name: "Bienvenida Nuevo Estudiante", lang: "es", subject: "¡Bienvenido/a al Instituto LIOTA! 🎉", category: "onboarding",
    body: `Estimado/a {{student_name}},

¡Bienvenido/a al Instituto de Idiomas de las Américas (LIOTA)! Estamos emocionados de que te unas a nuestra comunidad de aprendices de idiomas.

Tu inscripción en el programa {{program_name}} en nuestra sede de {{campus}} está confirmada. Aquí están tus detalles:

📅 Fecha de inicio: {{start_date}}
🕐 Horario: {{schedule}}
📍 Ubicación: {{location}}
👨‍🏫 Instructor: {{instructor_name}}

Qué esperar:
• Clases en grupos pequeños (máximo 6 estudiantes)
• Currículo personalizado alineado con el MCER
• Evaluaciones de progreso regulares
• Acceso a nuestro portal de aprendizaje en línea

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos cordiales,
El Equipo LIOTA
languageinstituteoftheamericas.com`,
  },
  {
    name: "Class Reminder", lang: "en", subject: "Reminder: Your class is tomorrow — LIOTA", category: "reminder",
    body: `Dear {{student_name}},

This is a friendly reminder that your next class is scheduled for:

📅 Date: {{class_date}}
🕐 Time: {{class_time}}
📍 Location: {{location}}
👨‍🏫 Instructor: {{instructor_name}}

Please make sure to:
✅ Complete any assigned homework
✅ Bring your course materials
✅ Log in 5 minutes early if attending online

If you need to reschedule, please contact us at least 24 hours in advance.

See you soon!
LIOTA Institute`,
  },
  {
    name: "Recordatorio de Clase", lang: "es", subject: "Recordatorio: Tu clase es mañana — LIOTA", category: "reminder",
    body: `Estimado/a {{student_name}},

Este es un recordatorio amistoso de que tu próxima clase está programada para:

📅 Fecha: {{class_date}}
🕐 Hora: {{class_time}}
📍 Ubicación: {{location}}
👨‍🏫 Instructor: {{instructor_name}}

Por favor asegúrate de:
✅ Completar la tarea asignada
✅ Traer tus materiales del curso
✅ Conectarte 5 minutos antes si asistes en línea

Si necesitas reprogramar, contáctanos con al menos 24 horas de anticipación.

¡Hasta pronto!
Instituto LIOTA`,
  },
  {
    name: "Monthly Progress Report", lang: "en", subject: "Your Monthly Progress Report — {{month}} {{year}}", category: "progress",
    body: `Dear {{student_name}},

Here is your monthly progress report for {{month}} {{year}}:

📊 Current CEFR Level: {{cefr_level}}
📈 Progress This Month: {{progress_summary}}
✅ Attendance: {{attendance_rate}}%
⭐ Instructor Comments: {{instructor_comments}}

Areas of Strength:
{{strengths}}

Areas for Improvement:
{{improvements}}

Next Steps:
{{next_steps}}

Keep up the great work!

Best regards,
{{instructor_name}}
LIOTA Institute`,
  },
  {
    name: "Reporte Mensual de Progreso", lang: "es", subject: "Tu Reporte Mensual de Progreso — {{month}} {{year}}", category: "progress",
    body: `Estimado/a {{student_name}},

Aquí está tu reporte mensual de progreso para {{month}} {{year}}:

📊 Nivel MCER Actual: {{cefr_level}}
📈 Progreso Este Mes: {{progress_summary}}
✅ Asistencia: {{attendance_rate}}%
⭐ Comentarios del Instructor: {{instructor_comments}}

Áreas de Fortaleza:
{{strengths}}

Áreas de Mejora:
{{improvements}}

Próximos Pasos:
{{next_steps}}

¡Sigue con el excelente trabajo!

Saludos cordiales,
{{instructor_name}}
Instituto LIOTA`,
  },
  {
    name: "Enrollment Confirmation", lang: "en", subject: "Enrollment Confirmed — LIOTA Institute", category: "enrollment",
    body: `Dear {{student_name}},

We are pleased to confirm your enrollment at LIOTA Institute!

Program: {{program_name}}
Campus: {{campus}}
Start Date: {{start_date}}
Schedule: {{schedule}}
Instructor: {{instructor_name}}

Your learning journey begins on {{start_date}}.

📧 Email: info@languageinstituteoftheamericas.com
🌐 Website: languageinstituteoftheamericas.com

Best regards,
The LIOTA Team`,
  },
  {
    name: "Confirmación de Inscripción", lang: "es", subject: "Inscripción Confirmada — Instituto LIOTA", category: "enrollment",
    body: `Estimado/a {{student_name}},

¡Nos complace confirmar tu inscripción en el Instituto LIOTA!

Programa: {{program_name}}
Sede: {{campus}}
Fecha de inicio: {{start_date}}
Horario: {{schedule}}
Instructor: {{instructor_name}}

Tu viaje de aprendizaje comienza el {{start_date}}.

📧 Correo: info@languageinstituteoftheamericas.com
🌐 Sitio web: languageinstituteoftheamericas.com

Saludos cordiales,
El Equipo LIOTA`,
  },
  {
    name: "Special Promotion", lang: "en", subject: "🌟 Special Offer — Enroll Now and Save!", category: "promotion",
    body: `Dear {{contact_name}},

For a limited time, LIOTA Institute is offering an exclusive discount!

🎁 SPECIAL OFFER: {{discount}}% off your first enrollment
⏰ Valid until: {{expiry_date}}

Our programs:
• ESL — English as a Second Language
• SSL — Spanish as a Second Language
• Business English
• Polyglot Package (2+ languages)
• Study Abroad Residency — $1,500 USD / £1,500 / €1,500

📍 Campuses: Mérida, Dallas, Denver, Vienna, Nottingham, Online

🌐 languageinstituteoftheamericas.com`,
  },
  {
    name: "Oferta Especial", lang: "es", subject: "🌟 Oferta Especial — ¡Inscríbete Ahora y Ahorra!", category: "promotion",
    body: `Estimado/a {{contact_name}},

¡Por tiempo limitado, el Instituto LIOTA ofrece un descuento exclusivo!

🎁 OFERTA ESPECIAL: {{discount}}% de descuento en tu primera inscripción
⏰ Válido hasta: {{expiry_date}}

Nuestros programas:
• ESL — Inglés como Segundo Idioma
• SSL — Español como Segundo Idioma
• Inglés de Negocios
• Paquete Políglota (2+ idiomas)
• Residencia en el Extranjero — $1,500 USD / £1,500 / €1,500

📍 Sedes: Mérida, Dallas, Denver, Viena, Nottingham, En Línea

🌐 languageinstituteoftheamericas.com`,
  },
  {
    name: "Camp Registration Confirmed", lang: "en", subject: "{{camp_name}} Camp Registration Confirmed!", category: "camps",
    body: `Dear {{parent_name}},

We're excited to confirm {{student_name}}'s registration for {{camp_name}}!

📅 Dates: {{camp_start_date}} — {{camp_end_date}}
📍 Location: {{campus}}
👥 Age Group: {{age_group}}
🌐 Language Focus: {{language_focus}}

Activities include:
• Daily language immersion
• Cultural workshops
• Games and interactive learning
• Certificate ceremony on the last day

LIOTA Institute
languageinstituteoftheamericas.com`,
  },
  {
    name: "Confirmación de Campamento", lang: "es", subject: "¡Registro al Campamento {{camp_name}} Confirmado!", category: "camps",
    body: `Estimado/a {{parent_name}},

¡Estamos emocionados de confirmar el registro de {{student_name}} para el campamento {{camp_name}}!

📅 Fechas: {{camp_start_date}} — {{camp_end_date}}
📍 Ubicación: {{campus}}
👥 Grupo de Edad: {{age_group}}
🌐 Enfoque de Idioma: {{language_focus}}

Actividades incluyen:
• Inmersión lingüística diaria
• Talleres culturales
• Juegos y aprendizaje interactivo
• Ceremonia de certificados el último día

Instituto LIOTA
languageinstituteoftheamericas.com`,
  },
  {
    name: "Payment Receipt", lang: "en", subject: "Payment Receipt — LIOTA Institute", category: "billing",
    body: `Dear {{student_name}},

Thank you for your payment! Here is your receipt:

Receipt #: {{receipt_number}}
Date: {{payment_date}}
Amount: {{amount}}
Payment Method: {{payment_method}}
Program: {{program_name}}

Your account is now up to date.

📧 info@languageinstituteoftheamericas.com
🌐 languageinstituteoftheamericas.com

Thank you for choosing LIOTA Institute!`,
  },
  {
    name: "Recibo de Pago", lang: "es", subject: "Recibo de Pago — Instituto LIOTA", category: "billing",
    body: `Estimado/a {{student_name}},

¡Gracias por tu pago! Aquí está tu recibo:

Recibo #: {{receipt_number}}
Fecha: {{payment_date}}
Monto: {{amount}}
Método de Pago: {{payment_method}}
Programa: {{program_name}}

Tu cuenta está ahora al día.

📧 info@languageinstituteoftheamericas.com
🌐 languageinstituteoftheamericas.com

¡Gracias por elegir el Instituto LIOTA!`,
  },
  {
    name: "Study Abroad — Application Received", lang: "en", subject: "Your Study Abroad Application Has Been Received — LIOTA", category: "enrollment",
    body: `Dear {{student_name}},

Thank you for applying to the LIOTA Study Abroad Residency Program!

Your application for the {{campus}} campus has been received.

Next steps:
1. Our admissions team will review your application within 3-5 business days.
2. You will receive a CEFR placement test link.
3. Upon acceptance, you will need to pay the residency fee.

Program Details:
📍 Campus: {{campus}}
📅 Start Date: {{start_date}}
⏱ Duration: 3 months
💰 Fee: $1,500 USD / £1,500 / €1,500

Best regards,
LIOTA Admissions Team
languageinstituteoftheamericas.com`,
  },
  {
    name: "Estudio en el Extranjero — Solicitud Recibida", lang: "es", subject: "Tu Solicitud de Estudio en el Extranjero Ha Sido Recibida — LIOTA", category: "enrollment",
    body: `Estimado/a {{student_name}},

¡Gracias por solicitar el Programa de Residencia de Estudio en el Extranjero de LIOTA!

Tu solicitud para la sede de {{campus}} ha sido recibida.

Próximos pasos:
1. Nuestro equipo revisará tu solicitud en 3-5 días hábiles.
2. Recibirás un enlace para la prueba de nivel MCER.
3. Al ser aceptado/a, deberás pagar la tarifa de residencia.

Detalles del Programa:
📍 Sede: {{campus}}
📅 Fecha de inicio: {{start_date}}
⏱ Duración: 3 meses
💰 Tarifa: $1,500 USD / £1,500 / €1,500

Saludos cordiales,
Equipo de Admisiones LIOTA
languageinstituteoftheamericas.com`,
  },
];

const CATEGORIES = ["all", "onboarding", "reminder", "progress", "enrollment", "promotion", "camps", "billing", "newsletter"];

type FormState = { name: string; subject: string; body: string; category: string; lang: "en" | "es"; };
const emptyForm: FormState = { name: "", subject: "", body: "", category: "newsletter", lang: "en" };

const categoryColors: Record<string, string> = {
  onboarding: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  reminder: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  enrollment: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  promotion: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  camps: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  billing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  newsletter: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

const langBadge = (lang: string) =>
  lang === "es" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";

function detectLang(name: string): "en" | "es" {
  if (name.startsWith("[ES]") || name.startsWith("(ES)")) return "es";
  return "en";
}
function displayName(name: string): string {
  return name.replace(/^\[(EN|ES)\]\s*/, "").replace(/^\((EN|ES)\)\s*/, "");
}

export default function EmailTemplates() {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [langFilter, setLangFilter] = useState<"all" | "en" | "es">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [presetLang, setPresetLang] = useState<"en" | "es">("en");

  const { data: templates = [], refetch, isLoading } = trpc.campaigns.listTemplates.useQuery();
  const createMutation = trpc.campaigns.createTemplate.useMutation({
    onSuccess: () => { toast.success("Template created"); refetch(); setShowDialog(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.campaigns.updateTemplate.useMutation({
    onSuccess: () => { toast.success("Template updated"); refetch(); setShowDialog(false); setEditingId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaigns.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Template deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name || !form.subject || !form.body) { toast.error("Please fill in all required fields"); return; }
    const prefix = form.lang === "es" ? "[ES] " : "[EN] ";
    const storedName = `${prefix}${form.name}`;
    if (editingId) {
      updateMutation.mutate({ id: editingId, name: storedName, subject: form.subject, body: form.body, category: form.category });
    } else {
      createMutation.mutate({ name: storedName, subject: form.subject, body: form.body, category: form.category });
    }
  };

  const handleEdit = (tpl: any) => {
    setEditingId(tpl.id);
    const lang = detectLang(tpl.name);
    setForm({ name: displayName(tpl.name), subject: tpl.subject, body: tpl.body, category: tpl.category ?? "newsletter", lang });
    setShowDialog(true);
  };

  const handleUsePreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setForm({ name: preset.name, subject: preset.subject, body: preset.body, category: preset.category, lang: preset.lang as "en" | "es" });
    setShowDialog(true);
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Template body copied to clipboard");
  };

  const allTemplates = [...(templates as any[])];
  const filtered = allTemplates.filter((tpl: any) => {
    const matchCat = categoryFilter === "all" || tpl.category === categoryFilter;
    const tplLang = detectLang(tpl.name);
    const matchLang = langFilter === "all" || tplLang === langFilter;
    const matchSearch = !searchQuery || tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || tpl.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchLang && matchSearch;
  });

  const visiblePresets = PRESET_TEMPLATES.filter((p) => p.lang === presetLang);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" /> Email Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage reusable bilingual email templates (EN / ES)</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => { setEditingId(null); setForm(emptyForm); setShowDialog(true); }}>
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Quick-Start Preset Templates</h2>
            <p className="text-xs text-muted-foreground">Click any preset to load it into the editor</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(["en", "es"] as const).map((l) => (
              <button key={l} onClick={() => setPresetLang(l)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${presetLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Globe className="w-3 h-3 inline mr-1" />{l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {visiblePresets.map((preset) => (
            <button key={`${preset.lang}-${preset.name}`} onClick={() => handleUsePreset(preset)}
              className="text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground group-hover:text-primary leading-tight">{preset.name}</span>
                <Badge className={`text-[10px] px-1.5 h-5 shrink-0 ${langBadge(preset.lang)}`}>{preset.lang.toUpperCase()}</Badge>
              </div>
              <Badge className={`text-[10px] px-1.5 h-5 ${categoryColors[preset.category] ?? "bg-gray-100 text-gray-700"}`}>{preset.category}</Badge>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 w-48" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["all", "en", "es"] as const).map((l) => (
            <button key={l} onClick={() => setLangFilter(l)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${langFilter === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {l === "all" ? "All" : <><Globe className="w-3 h-3 inline mr-0.5" />{l.toUpperCase()}</>}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground ml-1">{filtered.length} templates</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No templates found</p>
          <p className="text-xs text-muted-foreground mt-1">Create a new template or load a preset above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl: any) => {
            const tplLang = detectLang(tpl.name);
            const tplDisplayName = displayName(tpl.name);
            return (
              <Card key={tpl.id} className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-1.5 flex-wrap mb-2">
                    <Badge className={`text-[10px] px-1.5 h-5 ${langBadge(tplLang)}`}>
                      <Globe className="w-2.5 h-2.5 mr-0.5" />{tplLang.toUpperCase()}
                    </Badge>
                    {tpl.category && (
                      <Badge className={`text-[10px] px-1.5 h-5 ${categoryColors[tpl.category] ?? "bg-gray-100 text-gray-700"}`}>{tpl.category}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1 leading-tight">{tplDisplayName}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{tpl.subject}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => setShowPreview({ ...tpl, displayName: tplDisplayName, lang: tplLang })}>
                      <Eye className="w-3 h-3" /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => handleCopy(tpl.body)}>
                      <Copy className="w-3 h-3" /> Copy
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(tpl)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: tpl.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Email Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Language</Label>
              <div className="flex gap-2">
                {(["en", "es"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setForm({ ...form, lang: l })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.lang === l ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    <Globe className="w-4 h-4" />
                    {l === "en" ? "🇺🇸 English" : "🇲🇽 Español"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Template Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Welcome Email" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "all").map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject Line *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={form.lang === "es" ? "ej., ¡Bienvenido al Instituto LIOTA!" : "e.g., Welcome to LIOTA Institute!"} />
            </div>
            <div className="space-y-1.5">
              <Label>Body *</Label>
              <p className="text-xs text-muted-foreground">
                {form.lang === "es"
                  ? "Usa {{nombre_variable}} para contenido dinámico (ej., {{student_name}}, {{program_name}})"
                  : "Use {{variable_name}} for dynamic content (e.g., {{student_name}}, {{program_name}})"}
              </p>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder={form.lang === "es" ? "Escribe el cuerpo del correo aquí..." : "Write your email body here..."}
                className="min-h-[300px] font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {form.lang === "es" ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? (form.lang === "es" ? "Guardar Cambios" : "Save Changes") : (form.lang === "es" ? "Crear Plantilla" : "Create Template")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showPreview} onOpenChange={(v) => { if (!v) setShowPreview(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {showPreview?.displayName ?? showPreview?.name}
              {showPreview?.lang && (
                <Badge className={`text-[10px] px-1.5 h-5 ml-1 ${langBadge(showPreview.lang)}`}>{showPreview.lang.toUpperCase()}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Subject</p>
              <p className="text-sm font-medium">{showPreview?.subject}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Body</p>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{showPreview?.body}</pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCopy(showPreview?.body)} className="gap-2">
              <Copy className="w-4 h-4" /> Copy Body
            </Button>
            <Button onClick={() => { handleEdit(showPreview); setShowPreview(null); }} className="gap-2">
              <Edit2 className="w-4 h-4" /> Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
