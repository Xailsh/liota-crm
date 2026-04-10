/**
 * TestScheduler — embedded tab component for the PlacementTests page.
 * Shows all active schedules and lets admins create/edit/delete them.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Clock, Plus, Trash2, RefreshCw, Play, Pause,
  CheckCircle, AlertTriangle, Users, BookOpen
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-amber-100 text-amber-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

function ScheduleFormDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: students } = trpc.students.list.useQuery({});
  const { data: tests } = trpc.placementTests.list.useQuery();

  const [form, setForm] = useState({
    studentId: "",
    testId: "",
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isRecurring: false,
    intervalMonths: "1",
    notes: "",
  });

  const createMutation = trpc.placementTests.createSchedule.useMutation({
    onSuccess: () => {
      utils.placementTests.listSchedules.invalidate();
      toast.success("Schedule created!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.studentId) return toast.error("Select a student");
    if (!form.testId) return toast.error("Select a test");
    createMutation.mutate({
      studentId: Number(form.studentId),
      testId: Number(form.testId),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      isRecurring: form.isRecurring,
      intervalMonths: form.isRecurring ? Number(form.intervalMonths) : undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Schedule a Placement Test
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Student *</Label>
            <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {(students ?? []).filter((s) => s.email).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.firstName} {s.lastName} — {s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Test Version *</Label>
            <Select value={form.testId} onValueChange={(v) => setForm({ ...form, testId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a test..." />
              </SelectTrigger>
              <SelectContent>
                {(tests ?? []).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.title} ({t.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>First Send Date & Time *</Label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">The test email will be sent at this time.</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">Recurring Schedule</p>
              <p className="text-xs text-muted-foreground">Automatically send follow-up tests at regular intervals</p>
            </div>
            <Switch
              checked={form.isRecurring}
              onCheckedChange={(v) => setForm({ ...form, isRecurring: v })}
            />
          </div>

          {form.isRecurring && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-3">
              <p className="text-sm font-medium text-amber-800">Recurring Interval</p>
              <div>
                <Label>Send follow-up test every</Label>
                <Select value={form.intervalMonths} onValueChange={(v) => setForm({ ...form, intervalMonths: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="2">2 months</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="4">4 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months (yearly)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  After each test is sent, the next one will be scheduled {form.intervalMonths} month(s) later.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. After completing Level A1 course..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
            {createMutation.isPending ? "Scheduling..." : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TestScheduler() {
  const utils = trpc.useUtils();
  const { data: schedules, isLoading } = trpc.placementTests.listSchedules.useQuery({});
  const { data: students } = trpc.students.list.useQuery({});
  const { data: tests } = trpc.placementTests.list.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const origin = window.location.origin;

  const studentMap = Object.fromEntries((students ?? []).map((s) => [s.id, `${s.firstName} ${s.lastName}`]));
  const testMap = Object.fromEntries((tests ?? []).map((t) => [t.id, `${t.title} (${t.version})`]));

  const updateMutation = trpc.placementTests.updateSchedule.useMutation({
    onSuccess: () => { utils.placementTests.listSchedules.invalidate(); toast.success("Schedule updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.placementTests.deleteSchedule.useMutation({
    onSuccess: () => { utils.placementTests.listSchedules.invalidate(); toast.success("Schedule removed"); },
    onError: (e) => toast.error(e.message),
  });
  const runDueMutation = trpc.placementTests.runDueSchedules.useMutation({
    onSuccess: (r) => { utils.placementTests.listSchedules.invalidate(); toast.success(`Sent: ${r.sent}, Errors: ${r.errors}, Total: ${r.total}`); },
    onError: (e) => toast.error(e.message),
  });

  const activeCount = schedules?.filter((s) => s.status === "active").length ?? 0;
  const recurringCount = schedules?.filter((s) => s.isRecurring && s.status === "active").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{schedules?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Schedules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <RefreshCw className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{recurringCount}</p>
              <p className="text-xs text-muted-foreground">Recurring</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Test Schedules</h3>
          <p className="text-sm text-muted-foreground">Automated test delivery — send once or on a recurring schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => runDueMutation.mutate({ origin })} disabled={runDueMutation.isPending} size="sm">
            <Play className="h-4 w-4 mr-2" />
            {runDueMutation.isPending ? "Running..." : "Run Due Now"}
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-amber-500 hover:bg-amber-600 text-white" size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Schedule
          </Button>
        </div>
      </div>

      {/* Schedule List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading schedules...</div>
      ) : !schedules || schedules.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No schedules yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Set up automated test delivery — send a placement test once or on a recurring monthly schedule.
          </p>
          <Button onClick={() => setShowCreate(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Create First Schedule
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Student</th>
                <th className="text-left p-3 font-medium">Test</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Next Send</th>
                <th className="text-left p-3 font-medium">Recurring</th>
                <th className="text-left p-3 font-medium">Notes</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{studentMap[s.studentId] ?? `Student #${s.studentId}`}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{testMap[s.testId] ?? `Test #${s.testId}`}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={STATUS_COLORS[s.status ?? "active"]}>{s.status ?? "active"}</Badge>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        {s.nextSendAt
                          ? new Date(s.nextSendAt).toLocaleDateString()
                          : new Date(s.scheduledAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.nextSendAt
                          ? new Date(s.nextSendAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : new Date(s.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    {s.isRecurring ? (
                      <div className="flex items-center gap-1 text-blue-600">
                        <RefreshCw className="h-3 w-3" />
                        <span className="text-xs">Every {s.intervalMonths}mo</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">One-time</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[150px] truncate">
                    {s.notes ?? "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {s.status === "active" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-amber-600 hover:text-amber-800"
                          onClick={() => updateMutation.mutate({ id: s.id, status: "paused" })}
                          title="Pause schedule"
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      ) : s.status === "paused" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-green-600 hover:text-green-800"
                          onClick={() => updateMutation.mutate({ id: s.id, status: "active" })}
                          title="Resume schedule"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm("Delete this schedule?")) deleteMutation.mutate({ id: s.id });
                        }}
                        title="Delete schedule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How scheduling works</p>
          <ul className="space-y-1 text-blue-700">
            <li>• <strong>One-time:</strong> The test email is sent once on the scheduled date.</li>
            <li>• <strong>Recurring:</strong> After each test is sent, the next one is automatically scheduled after the chosen interval (e.g., 1 month, 2 months).</li>
            <li>• Click <strong>Run Due Now</strong> to manually trigger any overdue schedules.</li>
            <li>• Results are automatically saved to the student's record with the test date and CEFR level.</li>
          </ul>
        </div>
      </div>

      {showCreate && <ScheduleFormDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}
