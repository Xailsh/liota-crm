import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Mail,
  Clock,
  Users,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import LiotaLayout from "@/components/LiotaLayout";

interface StepForm {
  dayOffset: number;
  subject: string;
  bodyHtml: string;
  orderIndex: number;
}

function StepEditor({
  step,
  index,
  onSave,
  onDelete,
  canEdit,
}: {
  step: { id: number; dayOffset: number; subject: string; bodyHtml: string; orderIndex: number };
  index: number;
  onSave: (id: number, data: Partial<StepForm>) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    dayOffset: step.dayOffset,
    subject: step.subject,
    bodyHtml: step.bodyHtml,
  });

  const handleSave = () => {
    onSave(step.id, form);
    setEditing(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs shrink-0">Day {step.dayOffset}</Badge>
            <span className="text-sm font-medium truncate">{step.subject}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                onClick={(e) => { e.stopPropagation(); setEditing(true); setExpanded(true); }}>
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(step.id); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="p-4 border-t border-border space-y-3">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Day Offset</label>
                  <Input type="number" min={0} value={form.dayOffset}
                    onChange={(e) => setForm({ ...form, dayOffset: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                  <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Body HTML</label>
                <Textarea value={form.bodyHtml} onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                  rows={8} className="font-mono text-xs" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5 mr-1" /> Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: step.bodyHtml.substring(0, 500) + (step.bodyHtml.length > 500 ? "..." : "") }} />
          )}
        </div>
      )}
    </div>
  );
}

export default function DripCampaigns() {
  const { user } = useAuth();
  const canEdit = ["admin", "marketing"].includes(user?.role ?? "");
  const utils = trpc.useUtils();

  const { data: sequences = [], isLoading } = trpc.drip.listSequences.useQuery();
  const [selectedSeqId, setSelectedSeqId] = useState<number | null>(null);
  const { data: selectedSeq } = trpc.drip.getSequence.useQuery(
    { id: selectedSeqId! }, { enabled: !!selectedSeqId }
  );
  const { data: enrollments = [] } = trpc.drip.listEnrollments.useQuery(
    { sequenceId: selectedSeqId ?? undefined, limit: 100 }, { enabled: !!selectedSeqId }
  );

  const createSeq = trpc.drip.createSequence.useMutation({
    onSuccess: () => { utils.drip.listSequences.invalidate(); toast.success("Sequence created"); setShowCreateSeq(false); setNewSeqForm({ name: "", description: "", isDefault: false }); },
    onError: (e) => toast.error(e.message),
  });
  const updateSeq = trpc.drip.updateSequence.useMutation({
    onSuccess: () => { utils.drip.listSequences.invalidate(); if (selectedSeqId) utils.drip.getSequence.invalidate({ id: selectedSeqId }); toast.success("Updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteSeq = trpc.drip.deleteSequence.useMutation({
    onSuccess: () => { utils.drip.listSequences.invalidate(); setSelectedSeqId(null); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const createStep = trpc.drip.createStep.useMutation({
    onSuccess: () => { if (selectedSeqId) utils.drip.getSequence.invalidate({ id: selectedSeqId }); toast.success("Step added"); setShowAddStep(false); setNewStepForm({ dayOffset: 0, subject: "", bodyHtml: "", orderIndex: 0 }); },
    onError: (e) => toast.error(e.message),
  });
  const updateStep = trpc.drip.updateStep.useMutation({
    onSuccess: () => { if (selectedSeqId) utils.drip.getSequence.invalidate({ id: selectedSeqId }); toast.success("Step updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteStep = trpc.drip.deleteStep.useMutation({
    onSuccess: () => { if (selectedSeqId) utils.drip.getSequence.invalidate({ id: selectedSeqId }); toast.success("Step deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const seedDefault = trpc.drip.seedDefault.useMutation({
    onSuccess: (data) => { utils.drip.listSequences.invalidate(); setSelectedSeqId(data.sequenceId); toast.success("Default LIOTA sequence seeded!"); },
    onError: (e) => toast.error(e.message),
  });
  const runDue = trpc.drip.runDue.useMutation({
    onSuccess: (data) => { utils.drip.listEnrollments.invalidate(); toast.success(`Run complete: ${data.sent} sent, ${data.failed} failed, ${data.skipped} skipped`); },
    onError: (e) => toast.error(e.message),
  });

  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [newSeqForm, setNewSeqForm] = useState({ name: "", description: "", isDefault: false });
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepForm, setNewStepForm] = useState<StepForm>({ dayOffset: 0, subject: "", bodyHtml: "", orderIndex: 0 });

  const selectedSequence = sequences.find((s) => s.id === selectedSeqId);

  return (
    <LiotaLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Drip Email Sequences</h1>
            <p className="text-muted-foreground text-sm mt-1">Automated follow-up email sequences for new leads</p>
          </div>
          <div className="flex gap-2">
            {canEdit && sequences.length === 0 && (
              <Button variant="outline" onClick={() => seedDefault.mutate()} disabled={seedDefault.isPending}>
                <Star className="h-4 w-4 mr-2" /> Seed Default Sequence
              </Button>
            )}
            {canEdit && (
              <Button onClick={() => setShowCreateSeq(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Sequence
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{sequences.length}</div><div className="text-xs text-muted-foreground">Total Sequences</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-green-500">{sequences.filter((s) => s.isActive).length}</div><div className="text-xs text-muted-foreground">Active</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-500">{sequences.reduce((sum, s) => sum + (s.activeEnrollments ?? 0), 0)}</div><div className="text-xs text-muted-foreground">Active Enrollments</div></CardContent></Card>
          <Card><CardContent className="pt-4"><div className="text-2xl font-bold text-purple-500">{sequences.reduce((sum, s) => sum + (s.completedEnrollments ?? 0), 0)}</div><div className="text-xs text-muted-foreground">Completed</div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Sequences</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : sequences.length === 0 ? (
              <Card><CardContent className="pt-6 text-center">
                <Mail className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No sequences yet</p>
                {canEdit && <Button size="sm" variant="outline" onClick={() => seedDefault.mutate()} disabled={seedDefault.isPending}><Star className="h-3.5 w-3.5 mr-1" /> Seed Default</Button>}
              </CardContent></Card>
            ) : (
              sequences.map((seq) => (
                <Card key={seq.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${selectedSeqId === seq.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedSeqId(seq.id)}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{seq.name}</span>
                          {seq.isDefault && <Badge variant="secondary" className="text-xs"><Star className="h-2.5 w-2.5 mr-1" />Default</Badge>}
                        </div>
                        {seq.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{seq.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{seq.stepCount} steps</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{seq.activeEnrollments} active</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{seq.completedEnrollments} done</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {seq.isActive ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">Active</Badge> : <Badge variant="secondary" className="text-xs">Paused</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            {!selectedSeqId ? (
              <Card><CardContent className="pt-12 pb-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Select a Sequence</h3>
                <p className="text-sm text-muted-foreground">Click a sequence on the left to view and manage its steps and enrollments.</p>
              </CardContent></Card>
            ) : (
              <Tabs defaultValue="steps">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-lg">{selectedSequence?.name}</h2>
                    {selectedSequence?.description && <p className="text-sm text-muted-foreground">{selectedSequence.description}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Active</span>
                        <Switch checked={selectedSequence?.isActive ?? false}
                          onCheckedChange={(checked) => updateSeq.mutate({ id: selectedSeqId, isActive: checked })} />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => runDue.mutate()} disabled={runDue.isPending}>
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${runDue.isPending ? "animate-spin" : ""}`} /> Run Due
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => { if (confirm("Delete this sequence?")) deleteSeq.mutate({ id: selectedSeqId }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <TabsList>
                  <TabsTrigger value="steps"><Mail className="h-3.5 w-3.5 mr-1.5" />Steps ({selectedSeq?.steps?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="enrollments"><Users className="h-3.5 w-3.5 mr-1.5" />Enrollments ({enrollments.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="steps" className="mt-4 space-y-3">
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => setShowAddStep(true)} className="w-full">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
                    </Button>
                  )}
                  {(selectedSeq?.steps ?? []).length === 0 ? (
                    <Card><CardContent className="pt-8 pb-8 text-center">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No steps yet.</p>
                    </CardContent></Card>
                  ) : (
                    (selectedSeq?.steps ?? []).map((step, idx) => (
                      <StepEditor key={step.id} step={step} index={idx} canEdit={canEdit}
                        onSave={(id, data) => updateStep.mutate({ id, ...data })}
                        onDelete={(id) => { if (confirm("Delete this step?")) deleteStep.mutate({ id }); }} />
                    ))
                  )}
                </TabsContent>
                <TabsContent value="enrollments" className="mt-4">
                  {enrollments.length === 0 ? (
                    <Card><CardContent className="pt-8 pb-8 text-center">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No enrollments yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Leads are auto-enrolled when created via Meta Ads or the website form.</p>
                    </CardContent></Card>
                  ) : (
                    <div className="space-y-2">
                      {enrollments.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                          <div>
                            <div className="font-medium text-sm">{e.leadName}</div>
                            <div className="text-xs text-muted-foreground">{e.leadEmail}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={e.status === "active" ? "default" : e.status === "completed" ? "secondary" : "outline"} className="text-xs">{e.status}</Badge>
                            <span className="text-xs text-muted-foreground">Step {e.currentStepIndex + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showCreateSeq} onOpenChange={setShowCreateSeq}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Drip Sequence</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input value={newSeqForm.name} onChange={(e) => setNewSeqForm({ ...newSeqForm, name: e.target.value })} placeholder="e.g., New Lead Nurture Sequence" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={newSeqForm.description} onChange={(e) => setNewSeqForm({ ...newSeqForm, description: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newSeqForm.isDefault} onCheckedChange={(v) => setNewSeqForm({ ...newSeqForm, isDefault: v })} />
              <label className="text-sm">Set as default sequence for new leads</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSeq(false)}>Cancel</Button>
            <Button onClick={() => createSeq.mutate(newSeqForm)} disabled={!newSeqForm.name || createSeq.isPending}>Create Sequence</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Email Step</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Day Offset *</label>
                <Input type="number" min={0} value={newStepForm.dayOffset} onChange={(e) => setNewStepForm({ ...newStepForm, dayOffset: Number(e.target.value) })} />
                <p className="text-xs text-muted-foreground mt-1">Days after enrollment (0 = immediately)</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Order Index</label>
                <Input type="number" min={0} value={newStepForm.orderIndex} onChange={(e) => setNewStepForm({ ...newStepForm, orderIndex: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject *</label>
              <Input value={newStepForm.subject} onChange={(e) => setNewStepForm({ ...newStepForm, subject: e.target.value })} placeholder="Use {{first_name}} for personalization" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Body HTML *</label>
              <Textarea value={newStepForm.bodyHtml} onChange={(e) => setNewStepForm({ ...newStepForm, bodyHtml: e.target.value })} rows={10} className="font-mono text-xs" placeholder="<p>Dear {{name}},</p>..." />
              <p className="text-xs text-muted-foreground mt-1">Available tokens: {"{{name}}"}, {"{{first_name}}"}, {"{{full_name}}"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStep(false)}>Cancel</Button>
            <Button onClick={() => createStep.mutate({ sequenceId: selectedSeqId!, ...newStepForm })} disabled={!newStepForm.subject || !newStepForm.bodyHtml || createStep.isPending}>Add Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LiotaLayout>
  );
}
