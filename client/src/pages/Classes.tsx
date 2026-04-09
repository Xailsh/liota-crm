import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Plus, Users, MapPin, Monitor, Building, Loader2, Edit2, Calendar } from "lucide-react";

const campusLabels: Record<string, string> = { merida: "Mérida", dallas: "Dallas", denver: "Denver", vienna: "Vienna", online: "Online" };
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};
const statusLabels: Record<string, string> = { scheduled: "Programda", active: "Active", completed: "Completed", cancelled: "Cancelled" };

const emptyForm = {
  name: "", programId: undefined as number | undefined, instructorId: undefined as number | undefined,
  campus: "merida" as const, modality: "onsite" as const, maxStudents: 6,
  schedule: "", startDate: "", endDate: "",
};

export default function Classes() {
  const [campus, setCampus] = useState("all");
  const [status, setStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: classes = [], isLoading, refetch } = trpc.classes.list.useQuery({ campus, status });
  const { data: programs = [] } = trpc.programs.list.useQuery();
  const { data: instructors = [] } = trpc.instructors.list.useQuery();

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => { toast.success("Clase creada"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => { toast.success("Clase actualizada"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    const payload: any = { ...form };
    if (!payload.programId) delete payload.programId;
    if (!payload.instructorId) delete payload.instructorId;
    if (!payload.startDate) delete payload.startDate;
    if (!payload.endDate) delete payload.endDate;
    if (editId) updateMutation.mutate({ id: editId, ...payload });
    else createMutation.mutate(payload);
  };

  const openEdit = (c: any) => {
    setForm({ name: c.name, programId: c.programId, instructorId: c.instructorId, campus: c.campus, modality: c.modality, maxStudents: c.maxStudents, schedule: c.schedule ?? "", startDate: "", endDate: "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const getInstructorName = (id: number) => instructors.find((i: any) => i.id === id)?.name ?? "—";
  const getProgramName = (id: number) => programs.find((p: any) => p.id === id)?.name ?? "—";

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Classes y Programs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión de grupos, horarios e instructores</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Class
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-border card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={campus} onValueChange={setCampus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Campus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campuses</SelectItem>
                {Object.entries(campusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : classes.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No hay clases registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((c: any) => (
            <Card key={c.id} className="border border-border card-shadow hover:card-shadow-lg transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{getProgramName(c.programId)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(c)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className={`text-xs border ${statusColors[c.status] ?? ""}`}>
                    {statusLabels[c.status] ?? c.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                    {c.modality === "online" ? <Monitor className="w-3 h-3 inline mr-1" /> : <Building className="w-3 h-3 inline mr-1" />}
                    {c.modality === "online" ? "Online" : "On-Site"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span>{campusLabels[c.campus] ?? c.campus}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{c.currentStudents ?? 0}/{c.maxStudents} estudiantes</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((c.currentStudents ?? 0) / c.maxStudents) * 100)}%` }} />
                    </div>
                  </div>
                  {c.instructorId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3 flex-shrink-0" />
                      <span>{getInstructorName(c.instructorId)}</span>
                    </div>
                  )}
                  {c.schedule && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{c.schedule}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Clase" : "New Class"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Class Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Inglés Children A1 - Mañana" />
            </div>
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={form.programId?.toString() ?? ""} onValueChange={(v) => setForm({ ...form, programId: v ? Number(v) : undefined })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{programs.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Instructor</Label>
              <Select value={form.instructorId?.toString() ?? ""} onValueChange={(v) => setForm({ ...form, instructorId: v ? Number(v) : undefined })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{instructors.map((i: any) => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Campus *</Label>
              <Select value={form.campus} onValueChange={(v: any) => setForm({ ...form, campus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(campusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select value={form.modality} onValueChange={(v: any) => setForm({ ...form, modality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">On-Site</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Máx. Students</Label>
              <Input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} min={1} max={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Horario</Label>
              <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Lun-Mié 9:00-10:30 AM" />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? "Save" : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
