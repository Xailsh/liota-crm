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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  GraduationCap, Plus, Search, Filter, MapPin, Mail, Phone,
  Edit2, Trash2, Loader2, User, BookOpen, X
} from "lucide-react";

const campusLabels: Record<string, string> = { merida: "Mérida", dallas: "Dallas", denver: "Denver", vienna: "Vienna", nottingham: "Nottingham", online: "Online" };
const ageGroupLabels: Record<string, string> = { children: "Children", teens: "Teens", adults: "Adults" };
const statusLabels: Record<string, string> = { active: "Active", trial: "Trial", inactive: "Inactive", graduated: "Graduated", suspended: "Suspended" };
const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  trial: "bg-blue-100 text-blue-700 border-blue-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  graduated: "bg-purple-100 text-purple-700 border-purple-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};
const mcerColors: Record<string, string> = {
  A1: "bg-slate-100 text-slate-700 border-slate-200",
  A2: "bg-blue-100 text-blue-700 border-blue-200",
  B1: "bg-teal-100 text-teal-700 border-teal-200",
  B2: "bg-green-100 text-green-700 border-green-200",
  C1: "bg-amber-100 text-amber-700 border-amber-200",
  C2: "bg-purple-100 text-purple-700 border-purple-200",
};

const emptyForm = {
  firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "",
  ageGroup: "adults" as const, programId: undefined as number | undefined,
  campus: "merida" as const, mcerLevel: undefined as any,
  enrollmentStatus: "trial" as const, parentName: "", parentEmail: "", parentPhone: "", notes: "", tags: "",
};

export default function Students() {
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("all");
  const [ageGroup, setAgeGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery({ search, campus, ageGroup, enrollmentStatus: status });
  const { data: programs = [] } = trpc.programs.list.useQuery();

  const createMutation = trpc.students.create.useMutation({
    onSuccess: () => { toast.success("Student created"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => { toast.success("Student updated"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.students.delete.useMutation({
    onSuccess: () => { toast.success("Student deleted"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    const payload: any = { ...form };
    if (!payload.email) delete payload.email;
    if (!payload.mcerLevel) delete payload.mcerLevel;
    if (!payload.programId) delete payload.programId;
    if (editId) { updateMutation.mutate({ id: editId, ...payload }); }
    else { createMutation.mutate(payload); }
  };

  const openEdit = (s: any) => {
    setForm({
      firstName: s.firstName, lastName: s.lastName, email: s.email ?? "",
      phone: s.phone ?? "", dateOfBirth: "", ageGroup: s.ageGroup,
      programId: s.programId, campus: s.campus, mcerLevel: s.mcerLevel,
      enrollmentStatus: s.enrollmentStatus, parentName: s.parentName ?? "",
      parentEmail: s.parentEmail ?? "", parentPhone: s.parentPhone ?? "",
      notes: s.notes ?? "", tags: s.tags ?? "",
    });
    setEditId(s.id);
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" /> Students
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{students.length} student{students.length !== 1 ? "s" : ""} found</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Student
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-border card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={campus} onValueChange={setCampus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Campus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campuses</SelectItem>
                {Object.entries(campusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Group" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {Object.entries(ageGroupLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || campus !== "all" || ageGroup !== "all" || status !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCampus("all"); setAgeGroup("all"); setStatus("all"); }} className="gap-1 h-9 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : students.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No students found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Adjust filters or add a new student</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((s: any) => (
            <Card key={s.id} className="border border-border card-shadow hover:card-shadow-lg transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{s.firstName[0]}{s.lastName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{s.firstName} {s.lastName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{campusLabels[s.campus] ?? s.campus}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(s)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className={`text-xs border ${statusColors[s.enrollmentStatus] ?? ""}`}>
                    {statusLabels[s.enrollmentStatus] ?? s.enrollmentStatus}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                    {ageGroupLabels[s.ageGroup] ?? s.ageGroup}
                  </Badge>
                  {s.mcerLevel && (
                    <Badge variant="outline" className={`text-xs border font-semibold ${mcerColors[s.mcerLevel] ?? ""}`}>
                      {s.mcerLevel}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1.5">
                  {s.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.parentName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Parent: {s.parentName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Student" : "New Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 999 123 4567" />
            </div>
            <div className="space-y-1.5">
              <Label>Age Group *</Label>
              <Select value={form.ageGroup} onValueChange={(v: any) => setForm({ ...form, ageGroup: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="children">Children (5-12)</SelectItem>
                  <SelectItem value="teens">Teens (13-17)</SelectItem>
                  <SelectItem value="adults">Adults (18+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Campus *</Label>
              <Select value={form.campus} onValueChange={(v: any) => setForm({ ...form, campus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(campusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={form.programId?.toString() ?? ""} onValueChange={(v) => setForm({ ...form, programId: v ? Number(v) : undefined })}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {programs.map((p: any) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CEFR Level</Label>
              <Select value={form.mcerLevel ?? ""} onValueChange={(v) => setForm({ ...form, mcerLevel: v || undefined })}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Enrollment Status</Label>
              <Select value={form.enrollmentStatus} onValueChange={(v: any) => setForm({ ...form, enrollmentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Parent Name</Label>
              <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="For minor students" />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Email</Label>
              <Input value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="padre@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Parent Phone</Label>
              <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="+52 999 000 0000" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes about the student..." rows={3} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Tags</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="active,children,online (comma separated)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? "Save Changes" : "Create Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Student?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: deleteId! })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
