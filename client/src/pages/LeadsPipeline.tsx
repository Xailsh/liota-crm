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
import { Users2, Plus, Mail, Phone, MapPin, Calendar, ArrowRight, Loader2, Edit2, Trash2, ChevronRight } from "lucide-react";

const STAGES = [
  { key: "new_lead", label: "Nuevo Lead", color: "bg-slate-100 border-slate-300", badge: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-400" },
  { key: "contacted", label: "Contactado", color: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { key: "trial_scheduled", label: "Prueba Agendada", color: "bg-violet-50 border-violet-200", badge: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  { key: "trial_done", label: "Prueba Realizada", color: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { key: "proposal_sent", label: "Propuesta Enviada", color: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  { key: "enrolled", label: "Inscrito", color: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { key: "lost", label: "Perdido", color: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-400" },
];

const campusLabels: Record<string, string> = { merida: "Mérida", dallas: "Dallas", denver: "Denver", vienna: "Viena", online: "Online" };
const programLabels: Record<string, string> = { children: "Niños", teens: "Adolescentes", adults: "Adultos", business: "Negocios", polyglot: "Polyglot", immersion: "Inmersión", homeschool: "Homeschool" };

const emptyForm = {
  firstName: "", lastName: "", email: "", phone: "",
  ageGroup: "" as any, interestedProgram: "" as any,
  preferredCampus: "" as any, stage: "new_lead" as const,
  source: "", notes: "", trialDate: "", assignedTo: "",
};

export default function LeadsPipeline() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const { data: leads = [], isLoading, refetch } = trpc.leads.list.useQuery({});

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => { toast.success("Lead creado"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => { toast.success("Lead actualizado"); setShowForm(false); setEditId(null); setSelectedLead(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => { toast.success("Lead eliminado"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    const payload: any = { ...form };
    if (!payload.ageGroup) delete payload.ageGroup;
    if (!payload.interestedProgram) delete payload.interestedProgram;
    if (!payload.preferredCampus) delete payload.preferredCampus;
    if (!payload.trialDate) delete payload.trialDate;
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (l: any) => {
    setForm({ firstName: l.firstName, lastName: l.lastName, email: l.email ?? "", phone: l.phone ?? "", ageGroup: l.ageGroup ?? "", interestedProgram: l.interestedProgram ?? "", preferredCampus: l.preferredCampus ?? "", stage: l.stage, source: l.source ?? "", notes: l.notes ?? "", trialDate: "", assignedTo: l.assignedTo ?? "" });
    setEditId(l.id);
    setShowForm(true);
  };

  const advanceStage = (lead: any) => {
    const stages = STAGES.map((s) => s.key);
    const idx = stages.indexOf(lead.stage);
    if (idx < stages.length - 1) {
      updateMutation.mutate({ id: lead.id, stage: stages[idx + 1] as any });
    }
  };

  const leadsByStage = STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter((l: any) => l.stage === s.key);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users2 className="w-6 h-6 text-primary" /> Pipeline de Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{leads.length} prospectos en el embudo de ventas</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Lead
        </Button>
      </div>

      {/* Stage Summary */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {STAGES.map((s) => (
          <div key={s.key} className={`border rounded-xl p-3 text-center ${s.color}`}>
            <p className="text-lg font-bold text-foreground">{leadsByStage[s.key]?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => (
              <div key={stage.key} className="w-64 flex-shrink-0">
                <div className={`rounded-xl border-2 ${stage.color} p-3 mb-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                      <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs h-5">{leadsByStage[stage.key]?.length ?? 0}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  {(leadsByStage[stage.key] ?? []).map((lead: any) => (
                    <Card key={lead.id} className="border border-border card-shadow hover:card-shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedLead(lead)}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{lead.firstName} {lead.lastName}</p>
                            {lead.interestedProgram && (
                              <p className="text-xs text-muted-foreground">{programLabels[lead.interestedProgram] ?? lead.interestedProgram}</p>
                            )}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(lead.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.preferredCampus && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3 flex-shrink-0" /><span>{campusLabels[lead.preferredCampus]}</span>
                          </div>
                        )}
                        {stage.key !== "enrolled" && stage.key !== "lost" && (
                          <Button variant="outline" size="sm" className="w-full h-6 text-xs gap-1 mt-1" onClick={(e) => { e.stopPropagation(); advanceStage(lead); }}>
                            Avanzar <ChevronRight className="w-3 h-3" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {(leadsByStage[stage.key] ?? []).length === 0 && (
                    <div className="border border-dashed border-border rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground">Sin leads</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={(o) => { if (!o) setSelectedLead(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLead.firstName} {selectedLead.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="flex flex-wrap gap-2">
                {STAGES.find(s => s.key === selectedLead.stage) && (
                  <Badge variant="outline" className={`text-xs border ${STAGES.find(s => s.key === selectedLead.stage)?.badge}`}>
                    {STAGES.find(s => s.key === selectedLead.stage)?.label}
                  </Badge>
                )}
                {selectedLead.interestedProgram && <Badge variant="outline" className="text-xs">{programLabels[selectedLead.interestedProgram]}</Badge>}
                {selectedLead.preferredCampus && <Badge variant="outline" className="text-xs">{campusLabels[selectedLead.preferredCampus]}</Badge>}
              </div>
              {selectedLead.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{selectedLead.email}</div>}
              {selectedLead.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{selectedLead.phone}</div>}
              {selectedLead.source && <div className="text-sm text-muted-foreground">Fuente: {selectedLead.source}</div>}
              {selectedLead.notes && <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">{selectedLead.notes}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLead(null)}>Cerrar</Button>
              <Button onClick={() => { openEdit(selectedLead); setSelectedLead(null); }}>Editar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Form */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Lead" : "Nuevo Lead"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Apellido *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Grupo de Edad</Label>
              <Select value={form.ageGroup} onValueChange={(v) => setForm({ ...form, ageGroup: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent><SelectItem value="children">Niños</SelectItem><SelectItem value="teens">Adolescentes</SelectItem><SelectItem value="adults">Adultos</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Programa de Interés</Label>
              <Select value={form.interestedProgram} onValueChange={(v) => setForm({ ...form, interestedProgram: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{Object.entries(programLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sede Preferida</Label>
              <Select value={form.preferredCampus} onValueChange={(v) => setForm({ ...form, preferredCampus: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{Object.entries(campusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa del Embudo</Label>
              <Select value={form.stage} onValueChange={(v: any) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Fuente</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="website, referido, redes..." /></div>
            <div className="space-y-1.5"><Label>Asignado a</Label><Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Nombre del asesor" /></div>
            <div className="space-y-1.5"><Label>Fecha de Prueba</Label><Input type="date" value={form.trialDate} onChange={(e) => setForm({ ...form, trialDate: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? "Guardar" : "Crear Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar lead?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: deleteId! })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
