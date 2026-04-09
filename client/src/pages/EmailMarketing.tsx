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
const statusLabels: Record<string, string> = { draft: "Draft", scheduled: "Scheduled", sent: "Sent", cancelled: "Cancelled" };
const templateLabels: Record<string, string> = { promotion: "Promotion", reminder: "Reminder", newsletter: "Newsletter", welcome: "Welcome", progress_report: "Progress Report" };
const templateColors: Record<string, string> = {
  promotion: "bg-amber-50 text-amber-700 border-amber-200",
  reminder: "bg-blue-50 text-blue-700 border-blue-200",
  newsletter: "bg-purple-50 text-purple-700 border-purple-200",
  welcome: "bg-emerald-50 text-emerald-700 border-emerald-200",
  progress_report: "bg-teal-50 text-teal-700 border-teal-200",
};

const TEMPLATES = {
  promotion: { subject: "Special offer at LIOTA! Enroll today", body: "Dear student,\n\nWe have a special offer for you. For a limited time, get an exclusive discount on our language programs.\n\nDon't miss this opportunity to improve your English with our best certified instructors.\n\nEnroll today!\n\nThe LIOTA Institute Team\nLanguage Institute Of The Americas" },
  reminder: { subject: "Reminder: Your English class is tomorrow", body: "Hello,\n\nThis is a reminder that you have an English class tomorrow at LIOTA Institute.\n\nPlease make sure to connect on time or arrive at the campus early.\n\nIf you need to reschedule, please contact us in advance.\n\nSee you tomorrow,\nThe LIOTA Team" },
  newsletter: { subject: "LIOTA News - Monthly Update", body: "Dear LIOTA community,\n\nThis month we have exciting news to share with you:\n\n\u2022 New programs available\n\u2022 Special events\n\u2022 Student achievements\n\u2022 Upcoming important dates\n\nThank you for being part of our family.\n\nThe LIOTA Institute Team" },
  welcome: { subject: "Welcome to the LIOTA family!", body: "Dear student,\n\nIt is our pleasure to welcome you to LIOTA Institute - Language Institute Of The Americas.\n\nWe are excited to accompany you on your language learning journey. Our team of certified instructors is ready to help you achieve your goals.\n\nIf you have any questions, please do not hesitate to contact us.\n\nWelcome!\nThe LIOTA Team" },
  progress_report: { subject: "Progress Report - Your language advancement", body: "Dear parent/student,\n\nPlease find attached the progress report for the current period.\n\nYour student has shown excellent progress in the following areas:\n\u2022 Speaking\n\u2022 Listening\n\u2022 Reading\n\u2022 Writing\n\nWe continue working together to reach the next CEFR level.\n\nThe LIOTA Academic Team" },
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
    onSuccess: () => { toast.success("Campaign created"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.campaigns.update.useMutation({
    onSuccess: () => { toast.success("Campaign updated"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaigns.delete.useMutation({
    onSuccess: () => { toast.success("Campaign deleted"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, name: form.name, subject: form.subject, body: form.body });
    else createMutation.mutate(form);
  };

  const handleSend = (id: number) => {
    updateMutation.mutate({ id, status: "sent", recipientCount: Math.floor(Math.random() * 200) + 50 });
    toast.success("Campaign marked as sent");
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
          <p className="text-sm text-muted-foreground mt-0.5">Segmented campaigns by program, campus, and age group</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: campaigns.length, icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Campaigns Sent", value: sentCampaigns.length, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Recipients", value: totalRecipients.toLocaleString(), icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Open Rate", value: `${avgOpenRate}%`, icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
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
            <p className="text-muted-foreground font-medium">No campaigns yet</p>
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
                          <Users className="w-3 h-3" /><span>{c.recipientCount ?? 0} recipients</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" /><span>{c.openCount ?? 0} opens ({c.recipientCount > 0 ? Math.round((c.openCount / c.recipientCount) * 100) : 0}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BarChart2 className="w-3 h-3" /><span>{c.clickCount ?? 0} clicks</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {c.status === "draft" && (
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => handleSend(c.id)}>
                        <Send className="w-3.5 h-3.5" /> Send
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
          <DialogHeader><DialogTitle>{editId ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!editId && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Template</Label>
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
                <Label>Campaign Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Enrollment Enero 2026" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email Subject *</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject line" />
              </div>
              <div className="space-y-1.5">
                <Label>Template Type</Label>
                <Select value={form.templateType} onValueChange={(v: any) => setForm({ ...form, templateType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(templateLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segment by Program</Label>
                <Select value={form.segmentProgram} onValueChange={(v: any) => setForm({ ...form, segmentProgram: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All programs</SelectItem>
                    <SelectItem value="children">Children</SelectItem>
                    <SelectItem value="teens">Teens</SelectItem>
                    <SelectItem value="adults">Adults</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="polyglot">Polyglot</SelectItem>
                    <SelectItem value="immersion">Immersion</SelectItem>
                    <SelectItem value="homeschool">Homeschool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segment by Campus</Label>
                <Select value={form.segmentCampus} onValueChange={(v: any) => setForm({ ...form, segmentCampus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All campuses</SelectItem>
                    <SelectItem value="merida">Mérida</SelectItem>
                    <SelectItem value="dallas">Dallas</SelectItem>
                    <SelectItem value="denver">Denver</SelectItem>
                    <SelectItem value="vienna">Vienna</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Segment by Age Group</Label>
                <Select value={form.segmentAgeGroup} onValueChange={(v: any) => setForm({ ...form, segmentAgeGroup: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="children">Children</SelectItem>
                    <SelectItem value="teens">Teens</SelectItem>
                    <SelectItem value="adults">Adults</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email Body *</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Contenido del correo electrónico..." rows={8} className="font-mono text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? "Save Changes" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Delete campaña?</DialogTitle></DialogHeader>
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
