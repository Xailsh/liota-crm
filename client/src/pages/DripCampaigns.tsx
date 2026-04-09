import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Trash2, Mail, Clock, ChevronDown, ChevronUp, Play, Pause,
  ArrowRight, Zap, Users, CheckCircle2, Edit3, Save, X
} from "lucide-react";

interface DripStep {
  id: number;
  day: number;
  subject: string;
  body: string;
  isEditing?: boolean;
}

interface DripCampaign {
  id: number;
  name: string;
  trigger: string;
  status: "active" | "paused" | "draft";
  enrolledCount: number;
  completedCount: number;
  steps: DripStep[];
}

const DEFAULT_CAMPAIGNS: DripCampaign[] = [
  {
    id: 1,
    name: "Meta Leads Nurture Sequence",
    trigger: "new_meta_lead",
    status: "active",
    enrolledCount: 47,
    completedCount: 12,
    steps: [
      {
        id: 1,
        day: 0,
        subject: "Welcome to LIOTA Institute, {{first_name}}! 🌟",
        body: `Dear {{name}},

Welcome to LIOTA Institute — Language Institute Of The Americas!

We're so excited you reached out. Whether you're looking to learn English, Spanish, French, Portuguese, or become a true polyglot, we have the perfect program for you.

Here's what makes LIOTA special:
• Expert native-speaking instructors
• CEFR-aligned curriculum (A1–C2)
• Campuses in Mérida, Dallas, Denver, Vienna & Online
• Flexible scheduling — mornings, evenings, weekends
• STEAM-integrated learning for children & teens

Your journey to multilingual fluency starts now.

We'll be in touch soon to schedule a free consultation!

Warm regards,
The LIOTA Institute Team
theliotainstitute@gmail.com`,
      },
      {
        id: 2,
        day: 7,
        subject: "{{first_name}}, discover all our programs at LIOTA",
        body: `Dear {{name}},

It's been a week since you connected with us, and we wanted to share more about what LIOTA Institute offers:

🌟 ESL — English as a Second Language (A1–C2)
🌟 SSL — Spanish as a Second Language (A1–C2)
🌟 Polyglot Program — Master 3+ languages simultaneously
🌟 Business Language — Professional communication skills
🌟 STEAM Integration — Language + Science/Technology/Arts
🌟 Seasonal Camps — Immersive Winter, Spring, Summer & Fall camps

Our rates are designed to be accessible:
• Mexico: 200 MXN/hour
• USA: $20 USD/hour

Ready to take the next step? Reply to this email or call us to learn more.

The LIOTA Team`,
      },
      {
        id: 3,
        day: 14,
        subject: "FREE Trial Class — Claim yours today, {{first_name}}!",
        body: `Dear {{name}},

We'd love to invite you to a completely FREE trial class at LIOTA Institute!

This is your chance to:
✅ Meet one of our expert instructors
✅ Experience our teaching methodology firsthand
✅ Get a personalized language assessment
✅ See our facilities (or join online — your choice!)

No commitment required. Just come learn with us!

To schedule your free trial, simply reply to this email with your preferred:
• Day and time
• Program of interest (ESL, SSL, Polyglot, etc.)
• Campus preference (Mérida, Dallas, Denver, Vienna, or Online)

We have limited spots available — claim yours today!

The LIOTA Institute Team`,
      },
      {
        id: 4,
        day: 21,
        subject: "Real students, real results — LIOTA success stories",
        body: `Dear {{name}},

We believe the best way to understand what LIOTA Institute can do for you is through the words of our students.

"After just 6 months at LIOTA, I passed my TOEFL with a score of 112. The instructors are incredible!" — Maria G., Mérida

"The Polyglot program changed my life. I now speak 4 languages fluently and got promoted at work." — Carlos R., Dallas

"My daughter went from zero English to reading chapter books in one year. LIOTA's STEAM approach is magical." — Parent, Denver

These results are what we strive for every day. Your success story could be next.

Ready to start? Reply to this email or visit us online.

The LIOTA Team`,
      },
      {
        id: 5,
        day: 28,
        subject: "{{first_name}}, your spot is waiting — Enroll at LIOTA today",
        body: `Dear {{name}},

This is your final invitation to join LIOTA Institute this enrollment period.

We've been following up because we genuinely believe our programs can make a difference in your life or your child's future.

Here's what you get when you enroll:
🎓 Personalized learning plan based on your goals
📚 CEFR-aligned curriculum with clear progress milestones
👩‍🏫 Expert instructors with 5+ years of experience
📱 Access to our student portal and learning resources
🏆 Certificate of completion for each level

Enrollment is open now. Spots fill quickly — especially for our popular Polyglot and ESL programs.

To enroll or ask any questions, simply reply to this email.

We hope to welcome you to the LIOTA family soon!

Warm regards,
The LIOTA Institute Team
theliotainstitute@gmail.com`,
      },
      {
        id: 6,
        day: 60,
        subject: "Still thinking about it? LIOTA is here whenever you're ready",
        body: `Dear {{name}},

We know life gets busy. We just wanted to check in and let you know that LIOTA Institute is still here whenever you're ready to start your language learning journey.

Our programs run year-round, and we're always accepting new students. Whether you want to start this week or next month, we'll make it work for your schedule.

If you have any questions or concerns that have been holding you back, we'd love to address them. Just reply to this email!

And if you've already enrolled elsewhere or are no longer interested, no worries — we wish you all the best. You can unsubscribe below.

The LIOTA Institute Team`,
      },
    ],
  },
  {
    id: 2,
    name: "New Student Onboarding",
    trigger: "student_enrolled",
    status: "active",
    enrolledCount: 23,
    completedCount: 8,
    steps: [
      {
        id: 1,
        day: 0,
        subject: "Welcome to LIOTA Institute, {{first_name}}! Your enrollment is confirmed.",
        body: `Dear {{name}},

Congratulations and welcome to LIOTA Institute! 🎉

Your enrollment has been confirmed. Here's what happens next:

1. Your instructor will reach out within 24 hours to introduce themselves
2. You'll receive access to our student portal via email
3. Your first class is scheduled — check your calendar invite

Program: {{program}}
Campus: {{campus}}
Level: {{level}}

We're thrilled to have you with us. Let's make this journey incredible!

The LIOTA Institute Team`,
      },
      {
        id: 2,
        day: 3,
        subject: "How are your first classes going, {{first_name}}?",
        body: `Dear {{name}},

It's been a few days since you started at LIOTA Institute. How are you finding it?

We'd love to hear your feedback. If you have any questions or need anything, please don't hesitate to reach out.

Remember, our student portal has resources to help you practice between classes!

The LIOTA Team`,
      },
      {
        id: 3,
        day: 30,
        subject: "Your 30-day progress check-in — LIOTA Institute",
        body: `Dear {{name}},

One month in — congratulations on your commitment to language learning!

Your instructor has noted your progress and will share detailed feedback at your next class. Keep up the excellent work!

The LIOTA Institute Team`,
      },
    ],
  },
];

const TRIGGER_LABELS: Record<string, string> = {
  new_meta_lead: "New Meta Lead",
  student_enrolled: "Student Enrolled",
  trial_completed: "Trial Class Completed",
  payment_received: "Payment Received",
  manual: "Manual Enrollment",
};

export default function DripCampaigns() {
  const [campaigns, setCampaigns] = useState<DripCampaign[]>(DEFAULT_CAMPAIGNS);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(1);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<DripStep>>({});

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)!;

  const toggleStep = (stepId: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  const toggleCampaignStatus = (campaignId: number) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, status: c.status === "active" ? "paused" : "active" }
          : c
      )
    );
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign) {
      toast.success(
        campaign.status === "active"
          ? `"${campaign.name}" paused`
          : `"${campaign.name}" activated`
      );
    }
  };

  const startEditStep = (step: DripStep) => {
    setEditingStep(step.id);
    setEditDraft({ subject: step.subject, body: step.body, day: step.day });
  };

  const saveEditStep = (stepId: number) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? {
              ...c,
              steps: c.steps.map((s) =>
                s.id === stepId ? { ...s, ...editDraft } : s
              ),
            }
          : c
      )
    );
    setEditingStep(null);
    setEditDraft({});
    toast.success("Step saved");
  };

  const addStep = () => {
    const lastStep = selectedCampaign.steps[selectedCampaign.steps.length - 1];
    const newStep: DripStep = {
      id: Date.now(),
      day: lastStep ? lastStep.day + 7 : 0,
      subject: "New email step",
      body: "Write your email content here...",
    };
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? { ...c, steps: [...c.steps, newStep] }
          : c
      )
    );
    setExpandedSteps((prev) => new Set(Array.from(prev).concat(newStep.id)));
    startEditStep(newStep);
    toast.success("New step added");
  };

  const deleteStep = (stepId: number) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === selectedCampaignId
          ? { ...c, steps: c.steps.filter((s) => s.id !== stepId) }
          : c
      )
    );
    toast.success("Step deleted");
  };

  const addCampaign = () => {
    const newCampaign: DripCampaign = {
      id: Date.now(),
      name: "New Drip Campaign",
      trigger: "manual",
      status: "draft",
      enrolledCount: 0,
      completedCount: 0,
      steps: [
        {
          id: Date.now() + 1,
          day: 0,
          subject: "Welcome email",
          body: "Write your welcome email here...",
        },
      ],
    };
    setCampaigns((prev) => [...prev, newCampaign]);
    setSelectedCampaignId(newCampaign.id);
    toast.success("New campaign created");
  };

  const statusColor = (status: DripCampaign["status"]) => {
    if (status === "active") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    if (status === "paused") return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Left sidebar: campaign list */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-bold text-base text-foreground">Drip Campaigns</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Automated email sequences</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCampaignId(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${
                selectedCampaignId === c.id ? "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate">{c.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor(c.status)}`}>
                  {c.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {TRIGGER_LABELS[c.trigger] ?? c.trigger}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {c.enrolledCount} enrolled
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {c.completedCount} done
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {c.steps.length} steps
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={addCampaign}>
            <Plus className="w-3.5 h-3.5" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Right: campaign editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Campaign header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedCampaign.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Zap className="w-3.5 h-3.5" />
                Trigger: <strong className="text-foreground">{TRIGGER_LABELS[selectedCampaign.trigger]}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                {selectedCampaign.enrolledCount} enrolled
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {selectedCampaign.completedCount} completed
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCampaign.status === "active" ? "Active" : "Paused"}
              </span>
              <Switch
                checked={selectedCampaign.status === "active"}
                onCheckedChange={() => toggleCampaignStatus(selectedCampaign.id)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm"
              onClick={() => toggleCampaignStatus(selectedCampaign.id)}
            >
              {selectedCampaign.status === "active" ? (
                <><Pause className="w-4 h-4" /> Pause</>
              ) : (
                <><Play className="w-4 h-4" /> Activate</>
              )}
            </Button>
          </div>
        </div>

        {/* Trigger config */}
        <div className="px-6 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">Trigger</div>
                <div className="text-xs text-muted-foreground">{TRIGGER_LABELS[selectedCampaign.trigger]}</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Mail className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">Email Sequence</div>
                <div className="text-xs text-muted-foreground">{selectedCampaign.steps.length} emails over {selectedCampaign.steps[selectedCampaign.steps.length - 1]?.day ?? 0} days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {selectedCampaign.steps.map((step, idx) => (
            <div key={step.id} className="border border-border rounded-xl overflow-hidden">
              {/* Step header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-card cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleStep(step.id)}
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-indigo-600">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{step.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {step.day === 0 ? "Immediately (Day 0)" : `Day ${step.day}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditStep(step);
                      setExpandedSteps((prev) => new Set(Array.from(prev).concat(step.id)));
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteStep(step.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {expandedSteps.has(step.id) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Step content */}
              {expandedSteps.has(step.id) && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/10">
                  {editingStep === step.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground w-16">Day</label>
                        <Input
                          type="number"
                          value={editDraft.day ?? step.day}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, day: Number(e.target.value) }))}
                          className="w-24 h-8 text-sm"
                          min={0}
                        />
                        <span className="text-xs text-muted-foreground">days after trigger (0 = immediately)</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Subject</label>
                        <Input
                          value={editDraft.subject ?? step.subject}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, subject: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Body</label>
                        <Textarea
                          value={editDraft.body ?? step.body}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, body: e.target.value }))}
                          className="text-sm min-h-[200px] resize-none font-mono text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1.5 text-xs" onClick={() => saveEditStep(step.id)}>
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditingStep(null)}>
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Preview:</div>
                      <div className="bg-background border border-border rounded-lg p-3">
                        <div className="text-xs font-medium text-foreground mb-1">Subject: {step.subject}</div>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                          {step.body}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add step button */}
          <button
            onClick={addStep}
            className="w-full border-2 border-dashed border-border rounded-xl py-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Email Step
          </button>
        </div>
      </div>
    </div>
  );
}
