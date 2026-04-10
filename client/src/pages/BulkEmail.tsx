import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Send, Paperclip, Mic, Image, ShieldCheck, Loader2, TestTube2, Globe
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const SEND_DELAYS = [
  { value: "5", label: "5 seconds (recommended)" },
  { value: "10", label: "10 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
];

const PHASE_FILTERS = [
  "All", "New Lead", "Trial Scheduled", "Trial Completed",
  "Enrolled", "Active", "Inactive", "Graduated"
];

const PERSONALIZATION_TOKENS = ["{{name}}", "{{first_name}}", "{{program}}", "{{campus}}", "{{level}}"];

type Language = "en" | "es";

interface EmailDraft {
  subject: string;
  body: string;
}

export default function BulkEmail() {
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [language, setLanguage] = useState<Language>("en");
  const [templateId, setTemplateId] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<Language, EmailDraft>>({
    en: { subject: "", body: "" },
    es: { subject: "", body: "" },
  });
  const [sendDelay, setSendDelay] = useState("5");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Fetch contacts/leads as recipients
  const { data: contactsData } = trpc.contacts.list.useQuery({});
  const { data: leadsData } = trpc.leads.list.useQuery({});
  const { data: campaignTemplates } = trpc.campaigns.listTemplates.useQuery();

  // Combine contacts and leads into recipient list
  const allRecipients: Array<{ id: number; name: string; email: string; phase: string; source: "contact" | "lead" }> = [
    ...(contactsData ?? []).map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email ?? "",
      phase: c.type === "parent" ? "Parent" : c.type === "student" ? "Student" : "Contact",
      source: "contact" as const,
    })),
    ...(leadsData ?? []).map((l) => ({
      id: l.id + 100000,
      name: `${l.firstName} ${l.lastName}`,
      email: l.email ?? "",
      phase: l.stage.replace(/_/g, " ").replace(/\b\w/g, (ch: string) => ch.toUpperCase()),
      source: "lead" as const,
    })),
  ].filter((r) => r.email);

  const filteredRecipients = phaseFilter === "All"
    ? allRecipients
    : allRecipients.filter((r) => r.phase.toLowerCase().includes(phaseFilter.toLowerCase()));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredRecipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecipients.map((r) => r.id)));
    }
  };

  const updateDraft = (field: keyof EmailDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [language]: { ...prev[language], [field]: value },
    }));
  };

  const insertToken = (token: string) => {
    const textarea = document.getElementById("email-body") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = drafts[language].body;
      const newBody = current.slice(0, start) + token + current.slice(end);
      updateDraft("body", newBody);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      updateDraft("body", drafts[language].body + token);
    }
  };

  const loadTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = (campaignTemplates ?? []).find((t) => String(t.id) === id);
    if (tpl) {
      setDrafts((prev) => ({
        ...prev,
        en: { subject: tpl.subject ?? "", body: tpl.body ?? "" },
      }));
    } else {
      // Built-in templates
      const builtIn: Record<string, EmailDraft> = {
        welcome: {
          subject: "Welcome to LIOTA Institute, {{first_name}}!",
          body: `Dear {{name}},\n\nWelcome to LIOTA Institute — Language Institute Of The Americas!\n\nWe're thrilled to have you join our community of language learners. Our programs span English, Spanish, French, Portuguese, German, and more — with campuses in Mérida, Dallas, Denver, Vienna, and Online.\n\nYour journey to multilingual fluency starts here.\n\nWarm regards,\nThe LIOTA Institute Team\ntheliotainstitute@gmail.com`,
        },
        trial: {
          subject: "Your Free Trial Class at LIOTA Institute, {{first_name}}",
          body: `Dear {{name}},\n\nWe'd love to invite you to a FREE trial class at LIOTA Institute!\n\nExperience our teaching methodology firsthand with one of our expert instructors. Choose from:\n• ESL (English as a Second Language)\n• SSL (Spanish as a Second Language)\n• Polyglot (3+ languages)\n• STEAM-integrated language learning\n\nReply to schedule your free trial.\n\nBest,\nThe LIOTA Team`,
        },
        programs: {
          subject: "LIOTA Institute Programs Overview — Find Your Perfect Fit",
          body: `Dear {{name}},\n\nAt LIOTA Institute, we offer a wide range of language programs:\n\n🌟 ESL — English as a Second Language (A1–C2)\n🌟 SSL — Spanish as a Second Language (A1–C2)\n🌟 Polyglot Program — Master 3+ languages\n🌟 Business Language — Professional communication\n🌟 STEAM Integration — Language + Science/Tech/Arts\n🌟 Seasonal Camps — Winter, Spring, Summer, Fall\n\nRates: 200 MXN/hr (Mexico) · $20 USD/hr (USA)\n\nEnroll today!\n\nThe LIOTA Team`,
        },
        enrollment: {
          subject: "Enrollment Confirmation — LIOTA Institute",
          body: `Dear {{name}},\n\nCongratulations! Your enrollment at LIOTA Institute has been confirmed.\n\nProgram: {{program}}\nCampus: {{campus}}\nLevel: {{level}}\n\nWe look forward to seeing you in class!\n\nThe LIOTA Institute Team`,
        },
        progress: {
          subject: "Your Monthly Progress Report — LIOTA Institute",
          body: `Dear {{name}},\n\nHere is your monthly language learning progress report.\n\nCurrent Level: {{level}}\nProgram: {{program}}\nCampus: {{campus}}\n\nYou've made excellent progress this month!\n\nKeep learning,\nThe LIOTA Institute Team`,
        },
      };
      if (builtIn[id]) {
        setDrafts((prev) => ({ ...prev, en: builtIn[id] }));
      }
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (attachments.length + files.length > 5) {
      toast.error("Maximum 5 attachments allowed");
      return;
    }
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const sendEmailMutation = trpc.outreach.sendEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? ` (${data.failed} failed)` : ""}`);
      setSelectedIds(new Set());
    },
    onError: (e) => toast.error(`Send failed: ${e.message}`),
  });

  const handleSendTest = async () => {
    if (!drafts[language].subject || !drafts[language].body) {
      toast.error("Please fill in subject and body first");
      return;
    }
    if (!user?.email) {
      toast.error("Cannot determine your email address");
      return;
    }
    setIsSendingTest(true);
    try {
      await sendEmailMutation.mutateAsync({
        recipients: [{ name: user.name ?? "Test", email: user.email }],
        subject: `[TEST] ${drafts[language].subject}`,
        body: drafts[language].body,
        delayMs: 0,
      });
      toast.success(`Test email sent to ${user.email}`);
    } catch {
      // error handled by mutation
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    if (!drafts[language].subject || !drafts[language].body) {
      toast.error("Please fill in subject and body");
      return;
    }
    const recipients = filteredRecipients
      .filter((r) => selectedIds.has(r.id))
      .map((r) => ({ name: r.name, email: r.email }));
    setIsSending(true);
    try {
      await sendEmailMutation.mutateAsync({
        recipients,
        subject: drafts[language].subject,
        body: drafts[language].body,
        delayMs: parseInt(sendDelay) * 1000,
      });
    } catch {
      // error handled by mutation
    } finally {
      setIsSending(false);
    }
  };

  const currentDraft = drafts[language];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-border">
        <Link href="/email-marketing" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Email Marketing
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Bulk Email</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Send emails to multiple contacts with built-in throttling to protect from spam filters
        </p>
      </div>

      {/* CAN-SPAM notice */}
      <div className="mx-6 mt-4 flex items-start gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-3">
        <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          <strong>Unsubscribe footer included automatically.</strong>{" "}
          Every email sent includes a unique unsubscribe link in the footer for CAN-SPAM / GDPR compliance.
          Unsubscribed addresses are automatically skipped.
        </p>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-1 gap-4 px-6 py-4 overflow-hidden min-h-0">
        {/* Left: Recipients */}
        <div className="w-[420px] shrink-0 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm text-foreground">Select Recipients</h2>
          </div>

          {/* Filter + Select All */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="flex-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PHASE_FILTERS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={selectAll} className="shrink-0 h-8 text-xs">
              {selectedIds.size === filteredRecipients.length && filteredRecipients.length > 0 ? "Deselect All" : "Select All"}
            </Button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[24px_1fr_1fr_auto] gap-2 px-4 py-2 border-b border-border bg-muted/30">
            <div />
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <span className="text-xs font-medium text-muted-foreground">Phase</span>
          </div>

          {/* Recipient list */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                <p>No recipients found</p>
                <p className="text-xs mt-1">Add contacts or leads first</p>
              </div>
            ) : (
              filteredRecipients.map((r) => (
                <div
                  key={r.id}
                  className={`grid grid-cols-[24px_1fr_1fr_auto] gap-2 items-center px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${
                    selectedIds.has(r.id) ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                  onClick={() => toggleSelect(r.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(r.id)}
                    onCheckedChange={() => toggleSelect(r.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{r.email}</span>
                  <Badge variant="outline" className="text-xs shrink-0 font-normal">
                    {r.phase}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Selected count */}
          <div className="px-4 py-2 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} recipient{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
          </div>
        </div>

        {/* Right: Compose */}
        <div className="flex-1 flex flex-col border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm text-foreground">Compose Email</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Template loader */}
            <Select value={templateId} onValueChange={loadTemplate}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Load template..." />
              </SelectTrigger>
              <SelectContent>
                {(campaignTemplates ?? []).map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
                <SelectItem value="welcome">Welcome to LIOTA Institute</SelectItem>
                <SelectItem value="trial">Free Trial Class Invitation</SelectItem>
                <SelectItem value="programs">Programs Overview</SelectItem>
                <SelectItem value="enrollment">Enrollment Confirmation</SelectItem>
                <SelectItem value="progress">Monthly Progress Report</SelectItem>
              </SelectContent>
            </Select>

            {/* Language toggle */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Language:</span>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    language === "en"
                      ? "bg-blue-600 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🇺🇸 English
                </button>
                <button
                  onClick={() => setLanguage("es")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    language === "es"
                      ? "bg-blue-600 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  🇲🇽 Español
                </button>
              </div>
              {language === "en" && drafts.es.body && (
                <span className="text-xs text-muted-foreground ml-1">Sending English version</span>
              )}
              {language === "es" && drafts.en.body && (
                <span className="text-xs text-muted-foreground ml-1">Sending Spanish version</span>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input
                value={currentDraft.subject}
                onChange={(e) => updateDraft("subject", e.target.value)}
                placeholder="Email subject (use {{name}} for personalization)..."
                className="text-sm"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Body</label>
                <div className="flex gap-1">
                  {PERSONALIZATION_TOKENS.map((token) => (
                    <button
                      key={token}
                      onClick={() => insertToken(token)}
                      className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-blue-100 hover:text-blue-700 text-muted-foreground transition-colors font-mono"
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                id="email-body"
                value={currentDraft.body}
                onChange={(e) => updateDraft("body", e.target.value)}
                placeholder={`Email body (use {{name}}, {{first_name}}, {{program}}, {{campus}}, {{level}} for personalization)...`}
                className="text-sm min-h-[160px] resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Attachments</span>
                </div>
                <span className="text-xs text-muted-foreground">{attachments.length}/5</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 5}
                >
                  <Image className="w-3.5 h-3.5" />
                  Image / PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={attachments.length >= 5}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Upload Audio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
                  disabled={attachments.length >= 5}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Voice Template
                </Button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFileAttach} />
              <input ref={audioInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFileAttach} />

              {attachments.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <div className="flex justify-center gap-3 text-muted-foreground/40 mb-2">
                    <Image className="w-6 h-6" />
                    <Mic className="w-6 h-6" />
                    <Paperclip className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-muted-foreground">Attach images, PDFs, or audio files</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Images/PDF max 5 MB · Audio max 10 MB · Up to 5 files</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-sm">
                      <span className="truncate text-xs">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="text-muted-foreground hover:text-destructive ml-2 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Delay */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <span className="text-muted-foreground">⏱</span>
                Send Delay (spam protection)
              </label>
              <Select value={sendDelay} onValueChange={setSendDelay}>
                <SelectTrigger className="w-56 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEND_DELAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Footer action bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-background">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-sm"
          onClick={handleSendTest}
          disabled={isSendingTest}
        >
          {isSendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
          Send Test Email
        </Button>

        <Button
          size="sm"
          className="gap-2 text-sm px-5"
          onClick={handleSend}
          disabled={isSending || selectedIds.size === 0}
          style={{ background: selectedIds.size > 0 ? "#4f46e5" : undefined }}
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send to {selectedIds.size} Recipient{selectedIds.size !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
