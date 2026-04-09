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
import { TrendingUp, Plus, GraduationCap, Star, Loader2, Edit2, ChevronUp } from "lucide-react";

const MCER_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const mcerColors: Record<string, string> = {
  A1: "bg-slate-100 text-slate-700 border-slate-300",
  A2: "bg-blue-100 text-blue-700 border-blue-200",
  B1: "bg-teal-100 text-teal-700 border-teal-200",
  B2: "bg-green-100 text-green-700 border-green-200",
  C1: "bg-amber-100 text-amber-700 border-amber-200",
  C2: "bg-purple-100 text-purple-700 border-purple-200",
};
const mcerProgress: Record<string, number> = { A1: 10, A2: 25, B1: 42, B2: 58, C1: 75, C2: 95 };
const assessmentTypeLabels: Record<string, string> = { placement: "Diagnóstico", progress: "Progreso", final: "Final", mock_exam: "Simulacro" };

const emptyForm = {
  studentId: "", assessmentType: "progress" as const,
  mcerLevelBefore: "" as any, mcerLevelAfter: "" as any,
  speakingScore: "", listeningScore: "", readingScore: "", writingScore: "",
  overallScore: "", notes: "", assessedBy: "", assessmentDate: new Date().toISOString().split("T")[0],
};

export default function AcademicProgress() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedStudent, setSelectedStudent] = useState<string>("all");

  const { data: assessments = [], isLoading, refetch } = trpc.assessments.list.useQuery({ studentId: selectedStudent !== "all" ? Number(selectedStudent) : undefined });
  const { data: students = [] } = trpc.students.list.useQuery({});

  const createMutation = trpc.assessments.create.useMutation({
    onSuccess: () => { toast.success("Evaluación registrada"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    const payload: any = {
      ...form,
      studentId: Number(form.studentId),
      speakingScore: form.speakingScore ? Number(form.speakingScore) : undefined,
      listeningScore: form.listeningScore ? Number(form.listeningScore) : undefined,
      readingScore: form.readingScore ? Number(form.readingScore) : undefined,
      writingScore: form.writingScore ? Number(form.writingScore) : undefined,
      overallScore: form.overallScore ? Number(form.overallScore) : undefined,
    };
    if (!payload.mcerLevelBefore) delete payload.mcerLevelBefore;
    if (!payload.mcerLevelAfter) delete payload.mcerLevelAfter;
    createMutation.mutate(payload);
  };

  const getStudentName = (id: number) => {
    const s = students.find((s: any) => s.id === id);
    return s ? `${s.firstName} ${s.lastName}` : `#${id}`;
  };

  const getLevelUp = (before: string, after: string) => {
    if (!before || !after) return false;
    return MCER_LEVELS.indexOf(after) > MCER_LEVELS.indexOf(before);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" /> Progreso Académico
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Evaluaciones MCER, avance por nivel y reportes académicos</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Evaluación
        </Button>
      </div>

      {/* Student Filter */}
      <Card className="border border-border card-shadow">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <Label className="text-sm flex-shrink-0">Filtrar por estudiante:</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-64 h-9"><SelectValue placeholder="Todos los estudiantes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estudiantes</SelectItem>
                {students.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.firstName} {s.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MCER Scale Reference */}
      <Card className="border border-border card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Escala MCER — Marco Común Europeo de Referencia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {MCER_LEVELS.map((level) => (
              <div key={level} className="flex-1 min-w-20">
                <div className={`rounded-lg border p-2 text-center ${mcerColors[level]}`}>
                  <p className="font-bold text-sm">{level}</p>
                  <div className="h-1.5 bg-white/60 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${mcerProgress[level]}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : assessments.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No hay evaluaciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((a: any) => (
            <Card key={a.id} className="border border-border card-shadow hover:card-shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{getStudentName(a.studentId)}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                          {assessmentTypeLabels[a.assessmentType] ?? a.assessmentType}
                        </Badge>
                        {a.mcerLevelBefore && a.mcerLevelAfter && (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-xs border ${mcerColors[a.mcerLevelBefore]}`}>{a.mcerLevelBefore}</Badge>
                            <ChevronUp className="w-3 h-3 text-muted-foreground" />
                            <Badge variant="outline" className={`text-xs border ${mcerColors[a.mcerLevelAfter]}`}>{a.mcerLevelAfter}</Badge>
                            {getLevelUp(a.mcerLevelBefore, a.mcerLevelAfter) && (
                              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 border">¡Subió de nivel!</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {a.overallScore && (
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-foreground">{a.overallScore}/100</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.assessmentDate).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>

                {(a.speakingScore || a.listeningScore || a.readingScore || a.writingScore) && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { label: "Speaking", value: a.speakingScore },
                      { label: "Listening", value: a.listeningScore },
                      { label: "Reading", value: a.readingScore },
                      { label: "Writing", value: a.writingScore },
                    ].map((skill) => skill.value && (
                      <div key={skill.label} className="bg-muted rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">{skill.label}</p>
                        <p className="font-bold text-sm text-foreground">{skill.value}</p>
                        <div className="h-1 bg-background rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${skill.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {a.notes && <p className="mt-3 text-sm text-muted-foreground bg-muted rounded-lg p-2">{a.notes}</p>}
                {a.assessedBy && <p className="mt-1.5 text-xs text-muted-foreground">Evaluado por: {a.assessedBy}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setShowForm(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Evaluación</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Estudiante *</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar estudiante" /></SelectTrigger>
                <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Evaluación</Label>
              <Select value={form.assessmentType} onValueChange={(v: any) => setForm({ ...form, assessmentType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(assessmentTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de Evaluación</Label>
              <Input type="date" value={form.assessmentDate} onChange={(e) => setForm({ ...form, assessmentDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Nivel MCER Antes</Label>
              <Select value={form.mcerLevelBefore} onValueChange={(v) => setForm({ ...form, mcerLevelBefore: v })}>
                <SelectTrigger><SelectValue placeholder="Nivel anterior" /></SelectTrigger>
                <SelectContent>{MCER_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nivel MCER Después</Label>
              <Select value={form.mcerLevelAfter} onValueChange={(v) => setForm({ ...form, mcerLevelAfter: v })}>
                <SelectTrigger><SelectValue placeholder="Nivel alcanzado" /></SelectTrigger>
                <SelectContent>{MCER_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Speaking (0-100)</Label><Input type="number" min={0} max={100} value={form.speakingScore} onChange={(e) => setForm({ ...form, speakingScore: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Listening (0-100)</Label><Input type="number" min={0} max={100} value={form.listeningScore} onChange={(e) => setForm({ ...form, listeningScore: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Reading (0-100)</Label><Input type="number" min={0} max={100} value={form.readingScore} onChange={(e) => setForm({ ...form, readingScore: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Writing (0-100)</Label><Input type="number" min={0} max={100} value={form.writingScore} onChange={(e) => setForm({ ...form, writingScore: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Puntaje General (0-100)</Label><Input type="number" min={0} max={100} value={form.overallScore} onChange={(e) => setForm({ ...form, overallScore: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Evaluado por</Label><Input value={form.assessedBy} onChange={(e) => setForm({ ...form, assessedBy: e.target.value })} placeholder="Nombre del instructor" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Observaciones sobre el desempeño del estudiante..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar Evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
