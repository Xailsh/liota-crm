import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Award, Plus, Loader2, GraduationCap, DollarSign, Percent, Search } from "lucide-react";

const typeLabels: Record<string, string> = {
  full: "Full Scholarship", partial: "Partial", merit: "Merit-Based",
  need_based: "Need-Based", community: "Community", referral: "Referral", staff: "Staff Benefit",
};
const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
  revoked: "bg-red-100 text-red-700 border-red-200",
};

export default function Scholarships() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    studentId: "", name: "", type: "partial", discountPercent: "", discountAmount: "",
    currency: "USD", startDate: "", endDate: "", status: "pending", notes: "", approvedBy: "",
  });

  const { data: scholarshipList, isLoading, refetch } = trpc.scholarships.list.useQuery({});
  const { data: students } = trpc.students.list.useQuery({});

  const createMutation = trpc.scholarships.create.useMutation({
    onSuccess: () => { toast.success("Scholarship created successfully"); setOpen(false); refetch(); resetForm(); },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.scholarships.update.useMutation({
    onSuccess: () => { toast.success("Scholarship updated"); refetch(); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const resetForm = () => setForm({
    studentId: "", name: "", type: "partial", discountPercent: "", discountAmount: "",
    currency: "USD", startDate: "", endDate: "", status: "pending", notes: "", approvedBy: "",
  });

  const handleSubmit = () => {
    if (!form.studentId || !form.name) return toast.error("Student and scholarship name are required");
    createMutation.mutate({
      studentId: Number(form.studentId),
      name: form.name,
      type: form.type as any,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
      discountAmount: form.discountAmount ? Number(form.discountAmount) : undefined,
      currency: form.currency,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status as any,
      notes: form.notes || undefined,
      approvedBy: form.approvedBy || undefined,
    });
  };

  const filtered = (scholarshipList ?? []).filter((s: any) => {
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: (scholarshipList ?? []).length,
    active: (scholarshipList ?? []).filter((s: any) => s.status === "active").length,
    pending: (scholarshipList ?? []).filter((s: any) => s.status === "pending").length,
    totalValue: (scholarshipList ?? []).reduce((sum: number, s: any) => sum + Number(s.discountAmount ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" /> Scholarships
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage student scholarships and financial aid</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Scholarship</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Award Scholarship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Student *</Label>
                  <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(students) ? students : []).map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.firstName} {s.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Scholarship Name *</Label>
                  <Input className="mt-1" placeholder="e.g. Merit Excellence Award" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="revoked">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input className="mt-1" type="number" placeholder="e.g. 50" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
                </div>
                <div>
                  <Label>Discount Amount</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="0.00" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input className="mt-1" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input className="mt-1" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <Label>Approved By</Label>
                  <Input className="mt-1" placeholder="Administrator name" value={form.approvedBy} onChange={(e) => setForm({ ...form, approvedBy: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea className="mt-1" placeholder="Additional notes..." rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Award Scholarship
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scholarships", value: stats.total, icon: Award, color: "text-primary", bg: "bg-primary/10" },
          { label: "Active", value: stats.active, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Approval", value: stats.pending, icon: Loader2, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Aid Value", value: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <Card key={s.label} className="border border-border card-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search scholarships..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border border-border card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Scholarship Records ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Award className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">No scholarships found. Award the first one!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scholarship</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student ID</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discount</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Period</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          {s.approvedBy && <p className="text-xs text-muted-foreground">Approved by: {s.approvedBy}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">#{s.studentId}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-xs">{typeLabels[s.type] ?? s.type}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {s.discountPercent && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <Percent className="w-3 h-3" />{s.discountPercent}%
                            </div>
                          )}
                          {s.discountAmount && (
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                              <DollarSign className="w-3 h-3" />{Number(s.discountAmount).toLocaleString()} {s.currency}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {s.startDate ? new Date(s.startDate).toLocaleDateString() : "—"} → {s.endDate ? new Date(s.endDate).toLocaleDateString() : "Ongoing"}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className={`text-xs border ${statusColors[s.status] ?? ""}`}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        {s.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => updateMutation.mutate({ id: s.id, data: { status: "active" } })}
                          >
                            Approve
                          </Button>
                        )}
                        {s.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => updateMutation.mutate({ id: s.id, data: { status: "revoked" } })}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
