import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Mail, Edit2, Trash2, Loader2, Copy, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PRESET_TEMPLATES = [
  {
    name: "Welcome New Student",
    subject: "Welcome to LIOTA Institute! 🎉",
    category: "onboarding",
    body: `Dear {{student_name}},

Welcome to the Language Institute Of The Americas (LIOTA)! We're thrilled to have you join our community of language learners.

Your enrollment in the {{program_name}} program at our {{campus}} campus is confirmed. Here are your details:

📅 Start Date: {{start_date}}
🕐 Schedule: {{schedule}}
📍 Location: {{location}}
👨‍🏫 Instructor: {{instructor_name}}

What to expect:
• Small group classes (maximum 6 students)
• Personalized CEFR-aligned curriculum
• Regular progress assessments
• Access to our online learning portal

If you have any questions, please don't hesitate to contact us.

Best regards,
The LIOTA Team
languageinstituteoftheamericas.com`,
  },
  {
    name: "Class Reminder",
    subject: "Reminder: Your class is tomorrow — LIOTA",
    category: "reminder",
    body: `Dear {{student_name}},

This is a friendly reminder that your next class is scheduled for:

📅 Date: {{class_date}}
🕐 Time: {{class_time}}
📍 Location: {{location}}
👨‍🏫 Instructor: {{instructor_name}}

Please make sure to:
✅ Complete any assigned homework
✅ Bring your course materials
✅ Log in 5 minutes early if attending online

If you need to reschedule, please contact us at least 24 hours in advance.

See you soon!
LIOTA Institute`,
  },
  {
    name: "Monthly Progress Report",
    subject: "Your Monthly Progress Report — {{month}} {{year}}",
    category: "progress",
    body: `Dear {{student_name}},

Here is your monthly progress report for {{month}} {{year}}:

📊 Current CEFR Level: {{cefr_level}}
📈 Progress This Month: {{progress_summary}}
✅ Attendance: {{attendance_rate}}%
⭐ Instructor Comments: {{instructor_comments}}

Areas of Strength:
{{strengths}}

Areas for Improvement:
{{improvements}}

Next Steps:
{{next_steps}}

Keep up the great work! Language learning is a journey, and you're making excellent progress.

Best regards,
{{instructor_name}}
LIOTA Institute`,
  },
  {
    name: "Enrollment Confirmation",
    subject: "Enrollment Confirmed — LIOTA Institute",
    category: "enrollment",
    body: `Dear {{student_name}},

We are pleased to confirm your enrollment at LIOTA Institute!

Program Details:
📚 Program: {{program_name}}
🎯 Level: {{cefr_level}}
📅 Duration: {{duration}}
💰 Tuition: {{tuition_amount}}
💳 Payment Method: {{payment_method}}

Your learning journey begins on {{start_date}}. We look forward to helping you achieve your language goals.

For questions or assistance:
📧 Email: info@languageinstituteoftheamericas.com
🌐 Website: languageinstituteoftheamericas.com

Welcome to the LIOTA family!
The Admissions Team`,
  },
  {
    name: "Special Promotion",
    subject: "🌟 Special Offer — Enroll Now and Save!",
    category: "promotion",
    body: `Dear {{contact_name}},

We have an exciting offer just for you!

🎉 LIMITED TIME OFFER: {{promotion_details}}

At LIOTA Institute, we offer:
✅ Expert instructors with years of experience
✅ Small classes (max 6 students) for personalized attention
✅ Flexible schedules — online and in-person
✅ Programs for all ages: Children, Teenagers, Adults, Business English
✅ Campuses in Mérida, Dallas, Denver, Vienna, and Online

Programs Available:
• English as a Second Language (ESL)
• Spanish as a Second Language (SSL)
• Business English
• Polyglot Package (2+ languages)
• Seasonal Camps

📞 Call us today or visit our website to learn more!
🌐 languageinstituteoftheamericas.com

This offer expires on {{expiry_date}}.

Best regards,
LIOTA Institute Marketing Team`,
  },
  {
    name: "Camp Registration",
    subject: "{{camp_name}} Camp Registration Confirmed!",
    category: "camps",
    body: `Dear {{parent_name}},

Great news! {{student_name}}'s registration for the {{camp_name}} Camp is confirmed.

Camp Details:
🏕️ Camp: {{camp_name}}
📅 Dates: {{start_date}} — {{end_date}}
📍 Location: {{campus}}
👥 Group Size: Maximum 12 participants
🎯 Focus: {{camp_focus}}

What's Included:
• Daily language immersion activities
• Cultural workshops
• Games and interactive learning
• Certificate of completion
• Snacks (in-person camps)

What to Bring:
• Notebook and pen
• Enthusiasm and a smile! 😊

Payment Status: {{payment_status}}
Amount Paid: {{amount_paid}}

If you have any questions, please contact us.

See you at camp!
LIOTA Institute`,
  },
  {
    name: "Invoice / Payment Receipt",
    subject: "Payment Receipt — LIOTA Institute",
    category: "billing",
    body: `Dear {{student_name}},

Thank you for your payment! Here is your receipt:

Invoice #: {{invoice_number}}
Date: {{payment_date}}
Amount: {{amount}}
Payment Method: {{payment_method}}
Description: {{description}}

Account Summary:
Total Due: {{total_due}}
Amount Paid: {{amount_paid}}
Balance: {{balance}}

If you have any questions about this invoice, please contact our billing department.

Thank you for choosing LIOTA Institute!

Best regards,
LIOTA Institute Billing
languageinstituteoftheamericas.com`,
  },
];

const CATEGORIES = ["all", "onboarding", "reminder", "progress", "enrollment", "promotion", "camps", "billing", "newsletter"];

type FormState = {
  name: string;
  subject: string;
  body: string;
  category: string;
};

const emptyForm: FormState = { name: "", subject: "", body: "", category: "newsletter" };

export default function EmailTemplates() {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<any | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: templates = [], refetch, isLoading } = trpc.campaigns.listTemplates.useQuery();
  const createMutation = trpc.campaigns.createTemplate.useMutation({
    onSuccess: () => { toast.success("Template created"); refetch(); setShowDialog(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.campaigns.updateTemplate.useMutation({
    onSuccess: () => { toast.success("Template updated"); refetch(); setShowDialog(false); setEditingId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaigns.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Template deleted"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name || !form.subject || !form.body) { toast.error("Please fill in all required fields"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (tpl: any) => {
    setEditingId(tpl.id);
    setForm({ name: tpl.name, subject: tpl.subject, body: tpl.body, category: tpl.category ?? "newsletter" });
    setShowDialog(true);
  };

  const handleUsePreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setForm({ name: preset.name, subject: preset.subject, body: preset.body, category: preset.category });
    setShowDialog(true);
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Template body copied to clipboard");
  };

  const allTemplates = [...(templates as any[])];
  const filtered = allTemplates.filter((t: any) => {
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryColors: Record<string, string> = {
    onboarding: "bg-green-100 text-green-700",
    reminder: "bg-blue-100 text-blue-700",
    progress: "bg-purple-100 text-purple-700",
    enrollment: "bg-amber-100 text-amber-700",
    promotion: "bg-pink-100 text-pink-700",
    camps: "bg-cyan-100 text-cyan-700",
    billing: "bg-red-100 text-red-700",
    newsletter: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" /> Email Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage reusable email templates for campaigns and communications</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setShowDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      {/* Preset Templates */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick-Start Preset Templates</CardTitle>
          <p className="text-xs text-muted-foreground">Click any preset to load it into the editor</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleUsePreset(preset)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{preset.name}</p>
                    <Badge className={`text-[10px] mt-1 ${categoryColors[preset.category] ?? ""}`}>{preset.category}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-60"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="p-12 text-center">
            <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No templates found. Use a preset above or create a new one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl: any) => (
            <Card key={tpl.id} className="border border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{tpl.subject}</p>
                  </div>
                  <Badge className={`text-[10px] shrink-0 ${categoryColors[tpl.category] ?? ""}`}>{tpl.category ?? "general"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3 font-mono bg-muted/30 p-2 rounded">
                  {tpl.body?.slice(0, 120)}...
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => setShowPreview(tpl)}>
                    <Eye className="w-3 h-3" /> Preview
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 flex-1" onClick={() => handleCopy(tpl.body)}>
                    <Copy className="w-3 h-3" /> Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(tpl)}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate({ id: tpl.id })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Email Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Template Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Welcome Email" />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "all").map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject Line *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Welcome to LIOTA Institute!" />
            </div>
            <div className="space-y-1.5">
              <Label>Body *</Label>
              <p className="text-xs text-muted-foreground">Use {"{{variable_name}}"} for dynamic content (e.g., {"{{student_name}}"}, {"{{program_name}}"})</p>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write your email body here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={(v) => { if (!v) setShowPreview(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> {showPreview?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Subject</p>
              <p className="text-sm font-medium">{showPreview?.subject}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Body</p>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{showPreview?.body}</pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCopy(showPreview?.body)} className="gap-2">
              <Copy className="w-4 h-4" /> Copy Body
            </Button>
            <Button onClick={() => { handleEdit(showPreview); setShowPreview(null); }} className="gap-2">
              <Edit2 className="w-4 h-4" /> Edit Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
