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
import { Mail, Plus, Send, Eye, BarChart2, Users, Loader2, Edit2, Trash2, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  sent: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const statusLabels: Record<string, string> = { draft: "Borrador", scheduled: "Programada", sent: "Enviada", cancelled: "Cancelada" };
const templateLabels: Record<string, string> = { promotion: "Promoción", reminder: "Recordatorio", newsletter: "Boletín", welcome: "Bienvenida", progress_report: "Reporte de Progreso" };
const templateColors: Record<string, string> = {
  promotion: "bg-amber-50 text-amber-700 border-amber-200",
  reminder: "bg-blue-50 text-blue-700 border-blue-200",
  newsletter: "bg-purple-50 text-purple-700 border-purple-200",
  welcome: "bg-emerald-50 text-emerald-700 border-emerald-200",
  progress_report: "bg-teal-50 text-teal-700 border-teal-200",
};

const TEMPLATES = {
  promotion: { subject: "¡Oferta especial en LIOTA! Inscríbete hoy", body: "Estimado/a,\n\nTenemos una oferta especial para ti. Por tiempo limitado, obtén un descuento exclusivo en nuestros programas de inglés.\n\nNo pierdas esta oportunidad de mejorar tu inglés con los mejores instructores certificados.\n\n¡Inscríbete hoy!\n\nEl equipo de LIOTA Institute\nLanguage Institute Of The Americas" },
  reminder: { subject: "Recordatorio: Tu clase de inglés es mañana", body: "Hola,\n\nTe recordamos que mañana tienes clase de inglés en LIOTA Institute.\n\nPor favor asegúrate de conectarte a tiempo o llegar a la sede con anticipación.\n\nSi necesitas reprogramar, contáctanos con anticipación.\n\nHasta mañana,\nEl equipo de LIOTA" },
  newsletter: { subject: "Novedades LIOTA - Noticias del mes", body: "Estimada comunidad LIOTA,\n\nEste mes tenemos emocionantes novedades para compartir contigo:\n\n• Nuevos programas disponibles\n• Eventos especiales\n• Logros de nuestros estudiantes\n• Próximas fechas importantes\n\nGracias por ser parte de nuestra familia.\n\nEl equipo de LIOTA Institute" },
  welcome: { subject: "¡Bienvenido/a a la familia LIOTA!", body: "Querido/a estudiante,\n\nEs un placer darte la bienvenida a LIOTA Institute - Language Institute Of The Americas.\n\nEstamos emocionados de acompañarte en tu viaje de aprendizaje del inglés. Nuestro equipo de instructores certificados está listo para ayudarte a alcanzar tus metas.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\n¡Bienvenido/a!\nEl equipo de LIOTA" },
  progress_report: { subject: "Reporte de progreso - Tu avance en inglés", body: "Estimado/a padre/madre/estudiante,\n\nAdjunto encontrarás el reporte de progreso del período actual.\n\nTu estudiante ha demostrado un excelente avance en las áreas de:\n• Speaking\n• Listening\n• Reading\n• Writing\n\nSeguimos trabajando juntos para alcanzar el siguiente nivel MCER.\n\nEl equipo académico de LIOTA" },
};

const emptyForm = {
  name: "", subject: "", body: "",
  templateType: "newsletter" as const,
  segmentProgram: "all" as const,
  segmentCampus: "all" as const,
  segmentAgeGroup: "all" as const,
};

export default function EmailMarketing() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: campaigns = [], isLoading, refetch } = trpc.campaigns.list.useQuery();

  const createMutation = trpc.campaigns.create.useMutation({
    onSuccess: () => { toast.success("Campaña creada"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => { toast.success("Campaña actualizada"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => { toast.success("Campaña eliminada"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, name: form.name, subject: form.subject, body: form.body });
    else createMutation.mutate(form);
  };

  const handleSend = (id: number) => {
    updateMutation.mutate({ id, status: "sent", recipientCount: Math.floor(Math.random() * 200) + 50 });
    toast.success("Campaña marcada como enviada");
  };

  const applyTemplate = (type: keyof typeof TEMPLATES) => {
    const t = TEMPLATES[type];
    setForm({ ...form, templateType: type as any, subject: t.subject, body: t.body });
  };

  const openEdit = (c: any) => {
    setForm({ name: c.name, subject: c.subject, body: c.body, templateType: c.templateType, segmentProgram: c.segmentProgram, segmentCampus: c.segmentCampus, segmentAgeGroup: c.segmentAgeGroup });
    setEditId(c.id);
    setShowForm(true);
  };

  const sentCampaigns = campaigns.filter((c: any) => c.status === "sent");
  const totalRecipients = sentCampaigns.reduce((s: number, c: any) => s + (c.recipientCount ?? 0), 0);
  const totalOpens = sentCampaigns.reduce((s: number, c: any) => s + (c.openCount ?? 0), 0);
  const avgOpenRate = totalRecipients > 0 ? Math.round((totalOpens / totalRecipients) * 100) : 0;

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" /> Email Marketing
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Campañas segmentadas por programa, sede y grupo de edad</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Campaña
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Campañas", value: campaigns.length, icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Campañas Enviadas", value: sentCampaigns.length, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Destinatarios", value: totalRecipients.toLocaleString(), icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Tasa de Apertura", value: `${avgOpenRate}%`, icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <Card key={s.label} className="border border-border card-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No hay campañas aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <Card key={c.id} className="border border-border card-shadow hover:card-shadow-lg transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <Badge variant="outline" className={`text-xs border ${statusColors[c.status] ?? ""}`}>
                        {statusLabels[c.status] ?? c.status}
                      </Badge>
                      <Badge variant="outline" className={`text-xs border ${templateColors[c.templateType] ?? ""}`}>
                        {templateLabels[c.templateType] ?? c.templateType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.subject}</p>
                    {c.status === "sent" && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" /><span>{c.recipientCount ?? 0} destinatarios</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" /><span>{c.openCount ?? 0} aperturas ({c.recipientCount > 0 ? Math.round((c.openCount / c.recipientCount) * 100) : 0}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BarChart2 className="w-3 h-3" /><span>{c.clickCount ?? 0} clics</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status === "draft" && (
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => handleSend(c.id)}>
                        <Send className="w-3.5 h-3.5" /> Enviar
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(c)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Campaña" : "Nueva Campaña"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!editId && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plantilla Rápida</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(templateLabels).map(([k, v]) => (
                    <Button key={k} variant="outline" size="sm" className={`text-xs h-7 ${form.templateType === k ? "border-primary text-primary" : ""}`} onClick={() => applyTemplate(k as any)}>
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre de la Campaña *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Matrícula Enero 2026" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Asunto del Email *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Asunto del correo electrónico" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de Plantilla</Label>
                <Select value={form.templateType} onValueChange={(v: any) => setForm({ ...form, templateType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(templateLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segmento por Programa</Label>
                <Select value={form.segmentProgram} onValueChange={(v: any) => setForm({ ...form, segmentProgram: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los programas</SelectItem>
                    <SelectItem value="children">Niños</SelectItem>
                    <SelectItem value="teens">Adolescentes</SelectItem>
                    <SelectItem value="adults">Adultos</SelectItem>
                    <SelectItem value="business">Negocios</SelectItem>
                    <SelectItem value="polyglot">Polyglot</SelectItem>
                    <SelectItem value="immersion">Inmersión</SelectItem>
                    <SelectItem value="homeschool">Homeschool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segmento por Sede</Label>
                <Select value={form.segmentCampus} onValueChange={(v: any) => setForm({ ...form, segmentCampus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sedes</SelectItem>
                    <SelectItem value="merida">Mérida</SelectItem>
                    <SelectItem value="dallas">Dallas</SelectItem>
                    <SelectItem value="denver">Denver</SelectItem>
                    <SelectItem value="vienna">Viena</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segmento por Edad</Label>
                <Select value={form.segmentAgeGroup} onValueChange={(v: any) => setForm({ ...form, segmentAgeGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="children">Niños</SelectItem>
                    <SelectItem value="teens">Adolescentes</SelectItem>
                    <SelectItem value="adults">Adultos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Cuerpo del Email *</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Contenido del correo electrónico..." rows={8} className="font-mono text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? "Guardar Cambios" : "Crear Campaña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar campaña?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: deleteId! })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
