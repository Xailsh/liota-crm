import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  BookOpen, Plus, Send, Settings, Trash2, ChevronDown, ChevronUp,
  CheckCircle, Clock, Users, BarChart3, RefreshCw, Eye, Pencil, Calendar
} from "lucide-react";
import TestScheduler from "./TestScheduler";

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-emerald-100 text-emerald-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-indigo-100 text-indigo-800",
  C1: "bg-purple-100 text-purple-800",
  C2: "bg-rose-100 text-rose-800",
  mixed: "bg-gray-100 text-gray-800",
};

const SKILL_COLORS: Record<string, string> = {
  grammar: "bg-blue-50 text-blue-700",
  vocabulary: "bg-amber-50 text-amber-700",
  reading: "bg-green-50 text-green-700",
  listening: "bg-purple-50 text-purple-700",
  writing: "bg-rose-50 text-rose-700",
};

// ─── Send Test Dialog ─────────────────────────────────────────────────────────
function SendTestDialog({
  test,
  onClose,
}: {
  test: { id: number; title: string; durationMinutes: number };
  onClose: () => void;
}) {
    const { data: students } = trpc.students.list.useQuery({});
  const sendMutation = trpc.placementTests.sendToStudent.useMutation({
    onSuccess: () => {
      toast.success("Test sent! The placement test email has been sent.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const [mode, setMode] = useState<"student" | "custom">("student");
  const [studentId, setStudentId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");

  const handleSend = () => {
    if (mode === "student") {
      const student = students?.find((s) => String(s.id) === studentId);
      if (!student) return toast.error("Select a student");
      if (!student.email) return toast.error("Student has no email");
      sendMutation.mutate({
        testId: test.id,
        studentId: student.id,
        recipientEmail: student.email,
        recipientName: `${student.firstName} ${student.lastName}`,
        expiryDays: Number(expiryDays),
        origin: window.location.origin,
      });
    } else {
      if (!email || !name) return toast.error("Fill in all fields");
      sendMutation.mutate({
        testId: test.id,
        recipientEmail: email,
        recipientName: name,
        expiryDays: Number(expiryDays),
        origin: window.location.origin,
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-amber-500" />
            Send Placement Test
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <span className="font-medium">{test.title}</span>
            <span className="ml-2 text-muted-foreground">· {test.durationMinutes} min</span>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "student" | "custom")}>
            <TabsList className="w-full">
              <TabsTrigger value="student" className="flex-1">Existing Student</TabsTrigger>
              <TabsTrigger value="custom" className="flex-1">Custom Email</TabsTrigger>
            </TabsList>
            <TabsContent value="student" className="space-y-3 pt-2">
              <div>
                <Label>Select Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.filter((s) => s.email).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.firstName} {s.lastName} — {s.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="custom" className="space-y-3 pt-2">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ana García" />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@example.com" type="email" />
              </div>
            </TabsContent>
          </Tabs>

          <div>
            <Label>Link expires in</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={sendMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
            {sendMutation.isPending ? "Sending..." : "Send Test Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Question Editor ──────────────────────────────────────────────────────────
type QuestionDraft = {
  id?: number;
  orderIndex: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  skill: "grammar" | "vocabulary" | "reading" | "listening" | "writing";
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
};

function QuestionEditor({
  testId,
  initialQuestions,
  onClose,
}: {
  testId: number;
  initialQuestions: QuestionDraft[];
  onClose: () => void;
}) {
    const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [{ orderIndex: 0, questionText: "", options: ["", "", "", ""], correctAnswer: "", points: 1, skill: "grammar", cefrLevel: "A1" }]
  );
  const [expanded, setExpanded] = useState<number>(0);

  const saveQuestions = trpc.placementTests.saveQuestions.useMutation({
    onSuccess: () => {
      toast.success("Questions saved!");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { orderIndex: prev.length, questionText: "", options: ["", "", "", ""], correctAnswer: "", points: 1, skill: "grammar", cefrLevel: "A1" },
    ]);
    setExpanded(questions.length);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, orderIndex: i })));
    setExpanded(Math.max(0, idx - 1));
  };

  const updateQuestion = (idx: number, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  };

  const handleSave = () => {
    const invalid = questions.find((q) => !q.questionText || !q.correctAnswer || q.options.some((o) => !o));
    if (invalid) return toast.error("Complete all question fields");
    saveQuestions.mutate({ testId, questions });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Questions ({questions.length})</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 text-left"
                onClick={() => setExpanded(expanded === idx ? -1 : idx)}
              >
                <span className="font-medium text-sm">
                  Q{idx + 1}. {q.questionText || <span className="text-muted-foreground italic">Untitled question</span>}
                </span>
                <div className="flex items-center gap-2">
                  <Badge className={CEFR_COLORS[q.cefrLevel]}>{q.cefrLevel}</Badge>
                  <Badge className={SKILL_COLORS[q.skill]}>{q.skill}</Badge>
                  {expanded === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              {expanded === idx && (
                <div className="p-4 space-y-4">
                  <div>
                    <Label>Question Text</Label>
                    <Textarea
                      value={q.questionText}
                      onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                      placeholder="Enter the question..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx}>
                        <Label className="text-xs">Option {String.fromCharCode(65 + optIdx)}</Label>
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Correct Answer</Label>
                      <Select value={q.correctAnswer} onValueChange={(v) => updateQuestion(idx, { correctAnswer: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {q.options.filter(Boolean).map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Skill</Label>
                      <Select value={q.skill} onValueChange={(v) => updateQuestion(idx, { skill: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["grammar", "vocabulary", "reading", "listening", "writing"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CEFR Level</Label>
                      <Select value={q.cefrLevel} onValueChange={(v) => updateQuestion(idx, { cefrLevel: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => removeQuestion(idx)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addQuestion} className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" /> Add Question
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveQuestions.isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
            {saveQuestions.isPending ? "Saving..." : `Save ${questions.length} Questions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create/Edit Test Dialog ──────────────────────────────────────────────────
function TestFormDialog({
  initial,
  onClose,
}: {
  initial?: { id: number; title: string; description?: string | null; version: string; targetLevel: string; durationMinutes: number };
  onClose: () => void;
}) {
    const utils = trpc.useUtils();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    version: initial?.version ?? "v1",
    targetLevel: initial?.targetLevel ?? "mixed",
    durationMinutes: initial?.durationMinutes ?? 30,
  });

  const createMutation = trpc.placementTests.create.useMutation({
    onSuccess: () => { utils.placementTests.list.invalidate(); toast.success("Test created!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.placementTests.update.useMutation({
    onSuccess: () => { utils.placementTests.list.invalidate(); toast.success("Test updated!"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.title) return toast.error("Title is required");
    if (initial) {
      updateMutation.mutate({ id: initial.id, ...form, targetLevel: form.targetLevel as any });
    } else {
      createMutation.mutate({ ...form, targetLevel: form.targetLevel as any });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Test" : "Create New Test"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Test Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. General English Placement Test" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of this test..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Version</Label>
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v1" />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} min={5} max={180} />
            </div>
          </div>
          <div>
            <Label>Target Level</Label>
            <Select value={form.targetLevel} onValueChange={(v) => setForm({ ...form, targetLevel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed (All Levels)</SelectItem>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
            {initial ? "Update Test" : "Create Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Submissions Table ────────────────────────────────────────────────────────
function SubmissionsTab() {
  const { data: submissions } = trpc.placementTests.listSubmissions.useQuery({});
  const { data: tests } = trpc.placementTests.list.useQuery();

  const testMap = Object.fromEntries((tests ?? []).map((t) => [t.id, t.title]));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: submissions?.length ?? 0, icon: Send, color: "text-blue-500" },
          { label: "Completed", value: submissions?.filter((s) => s.status === "completed").length ?? 0, icon: CheckCircle, color: "text-green-500" },
          { label: "Pending", value: submissions?.filter((s) => s.status === "pending" || s.status === "in_progress").length ?? 0, icon: Clock, color: "text-amber-500" },
          { label: "Expired", value: submissions?.filter((s) => s.status === "expired").length ?? 0, icon: RefreshCw, color: "text-red-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-8 w-8 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Recipient</th>
              <th className="text-left p-3 font-medium">Test</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">CEFR Result</th>
              <th className="text-left p-3 font-medium">Score</th>
              <th className="text-left p-3 font-medium">Sent</th>
              <th className="text-left p-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody>
            {(submissions ?? []).slice(0, 50).map((s) => (
              <tr key={s.id} className="border-t hover:bg-muted/20">
                <td className="p-3">
                  <p className="font-medium">{s.recipientName}</p>
                  <p className="text-xs text-muted-foreground">{s.recipientEmail}</p>
                </td>
                <td className="p-3 text-muted-foreground">{testMap[s.testId] ?? `Test #${s.testId}`}</td>
                <td className="p-3">
                  <Badge className={
                    s.status === "completed" ? "bg-green-100 text-green-800" :
                    s.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                    s.status === "expired" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  }>{s.status}</Badge>
                </td>
                <td className="p-3">
                  {s.cefrResult ? <Badge className={CEFR_COLORS[s.cefrResult]}>{s.cefrResult}</Badge> : "—"}
                </td>
                <td className="p-3">
                  {s.percentScore != null ? `${s.percentScore}%` : "—"}
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {s.sentAt ? new Date(s.sentAt).toLocaleDateString() : "—"}
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {(!submissions || submissions.length === 0) && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No test submissions yet. Send a test to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlacementTests() {
    const utils = trpc.useUtils();
  const { data: tests, isLoading } = trpc.placementTests.list.useQuery();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editTest, setEditTest] = useState<any>(null);
  const [sendTest, setSendTest] = useState<any>(null);
  const [editQuestionsTest, setEditQuestionsTest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("tests");

  const seedMutation = trpc.placementTests.seedDefaults.useMutation({
    onSuccess: (r) => { utils.placementTests.list.invalidate(); toast.success(r.message); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.placementTests.delete.useMutation({
    onSuccess: () => { utils.placementTests.list.invalidate(); toast.success("Test deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const { data: questionsData } = trpc.placementTests.getWithQuestions.useQuery(
    { id: editQuestionsTest?.id ?? 0 },
    { enabled: !!editQuestionsTest }
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-500" />
            Placement Tests
          </h1>
          <p className="text-muted-foreground mt-1">Create, send, and track English placement tests for your students</p>
        </div>
        <div className="flex gap-2">
          {(!tests || tests.length === 0) && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Loading..." : "Load Default Test"}
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> New Test
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tests">
            <BookOpen className="h-4 w-4 mr-2" /> Tests ({tests?.length ?? 0})
          </TabsTrigger>
        <TabsTrigger value="submissions">
          <BarChart3 className="h-4 w-4 mr-2" /> Submissions & Results
        </TabsTrigger>
        <TabsTrigger value="scheduler">
          <Calendar className="h-4 w-4 mr-2" /> Scheduler
        </TabsTrigger>
        </TabsList>

        {/* Tests Tab */}
        <TabsContent value="tests" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tests...</div>
          ) : !tests || tests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No placement tests yet</h3>
              <p className="text-muted-foreground mb-6">Load the default 30-question test or create your own.</p>
              <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="bg-amber-500 hover:bg-amber-600 text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                {seedMutation.isPending ? "Loading..." : "Load Default Test"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{test.title}</h3>
                          <Badge variant="outline" className="text-xs">{test.version}</Badge>
                          <Badge className={CEFR_COLORS[test.targetLevel]}>{test.targetLevel}</Badge>
                          {!test.isActive && <Badge variant="secondary">Inactive</Badge>}
                        </div>
                        {test.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{test.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {test.durationMinutes} min</span>
                          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {(test as any).questionCount ?? 0} questions</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Created {new Date(test.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setEditQuestionsTest(test)}>
                          <Pencil className="h-4 w-4 mr-1" /> Questions
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditTest(test)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => setSendTest(test)} className="bg-amber-500 hover:bg-amber-600 text-white">
                          <Send className="h-4 w-4 mr-1" /> Send
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => {
                          if (confirm("Delete this test? This cannot be undone.")) deleteMutation.mutate({ id: test.id });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler" className="mt-4">
          <TestScheduler />
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-4">
          <SubmissionsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showCreateDialog && <TestFormDialog onClose={() => setShowCreateDialog(false)} />}
      {editTest && <TestFormDialog initial={editTest} onClose={() => setEditTest(null)} />}
      {sendTest && <SendTestDialog test={sendTest} onClose={() => setSendTest(null)} />}
      {editQuestionsTest && questionsData && (
        <QuestionEditor
          testId={editQuestionsTest.id}
          initialQuestions={(questionsData.questions ?? []).map((q: any) => ({
            ...q,
            options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
          }))}
          onClose={() => setEditQuestionsTest(null)}
        />
      )}
    </div>
  );
}
