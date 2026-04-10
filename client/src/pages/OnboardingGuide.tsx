import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  BookOpen, CheckCircle2, Circle, Download, Edit2, GraduationCap,
  Users2, DollarSign, Shield, Play, RefreshCw, ChevronDown, ChevronRight,
  Zap, Mail, BarChart3, Star, ClipboardList,
} from "lucide-react";

// ─── Role definitions ──────────────────────────────────────────────────────────
type ChecklistItem = { key: string; label: string };
type Section = {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  items: ChecklistItem[];
  videoKey: string;
};

const ROLES: { id: string; label: string; icon: React.ElementType; color: string; sections: Section[] }[] = [
  {
    id: "instructor",
    label: "Instructor",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-700",
    sections: [
      {
        id: "inst-login",
        title: "1. Logging In",
        icon: Shield,
        description: "Access the CRM using your invitation link and set up your account.",
        videoKey: "instructor-login",
        items: [
          { key: "inst-login-1", label: "Open your invitation email and click the Accept Invitation link" },
          { key: "inst-login-2", label: "Choose your sign-in method: Google or set an email/password" },
          { key: "inst-login-3", label: "Confirm your name and complete account setup" },
          { key: "inst-login-4", label: "Bookmark the CRM URL for quick access" },
        ],
      },
      {
        id: "inst-students",
        title: "2. Viewing Students",
        icon: GraduationCap,
        description: "Browse student profiles and check their enrollment details.",
        videoKey: "instructor-students",
        items: [
          { key: "inst-students-1", label: "Navigate to Students in the left sidebar" },
          { key: "inst-students-2", label: "Use the search bar to find a student by name" },
          { key: "inst-students-3", label: "Click a student card to open their profile sheet" },
          { key: "inst-students-4", label: "Review their CEFR level, program, and enrollment status" },
          { key: "inst-students-5", label: "Check the Placement Tests tab for test history and scores" },
        ],
      },
      {
        id: "inst-classes",
        title: "3. Managing Classes",
        icon: BookOpen,
        description: "View your assigned classes, schedules, and student rosters.",
        videoKey: "instructor-classes",
        items: [
          { key: "inst-classes-1", label: "Go to Classes in the sidebar" },
          { key: "inst-classes-2", label: "Review your class schedule and student count" },
          { key: "inst-classes-3", label: "Check class status (Scheduled / Active / Completed)" },
          { key: "inst-classes-4", label: "Note the campus and modality (online / onsite) for each class" },
        ],
      },
      {
        id: "inst-academic",
        title: "4. Academic Progress",
        icon: BarChart3,
        description: "Track student CEFR assessments and learning progress.",
        videoKey: "instructor-academic",
        items: [
          { key: "inst-academic-1", label: "Navigate to Academic Progress in the sidebar" },
          { key: "inst-academic-2", label: "Select a student to view their assessment history" },
          { key: "inst-academic-3", label: "Review speaking, listening, reading, and writing scores" },
          { key: "inst-academic-4", label: "Understand the CEFR scale: A1 (beginner) → C2 (mastery)" },
        ],
      },
      {
        id: "inst-placement",
        title: "5. Placement Tests",
        icon: ClipboardList,
        description: "Send English placement tests and review student results.",
        videoKey: "instructor-placement",
        items: [
          { key: "inst-placement-1", label: "Go to Placement Tests in the sidebar" },
          { key: "inst-placement-2", label: "Click Send Test to email a test link to a student" },
          { key: "inst-placement-3", label: "Monitor the Submissions tab to see completed tests" },
          { key: "inst-placement-4", label: "Click Details on a submission to see per-question analytics" },
          { key: "inst-placement-5", label: "Add internal notes on a submission using the Staff Notes tab" },
          { key: "inst-placement-6", label: "Download the student's PDF certificate from the submission details" },
        ],
      },
      {
        id: "inst-templates",
        title: "6. Message Templates",
        icon: Mail,
        description: "Use pre-built email, WhatsApp, and voice templates for student communication.",
        videoKey: "instructor-templates",
        items: [
          { key: "inst-templates-1", label: "Find Email Templates, WhatsApp Templates, and Voice Templates in the sidebar" },
          { key: "inst-templates-2", label: "Browse templates by category (welcome, reminder, progress report)" },
          { key: "inst-templates-3", label: "Copy a template and personalise it before sending" },
        ],
      },
    ],
  },
  {
    id: "coordinator",
    label: "Coordinator / Sales",
    icon: Users2,
    color: "bg-green-100 text-green-700",
    sections: [
      {
        id: "coord-login",
        title: "1. Logging In",
        icon: Shield,
        description: "Access the CRM using your invitation link.",
        videoKey: "coordinator-login",
        items: [
          { key: "coord-login-1", label: "Open your invitation email and click the Accept Invitation link" },
          { key: "coord-login-2", label: "Choose Google Sign-In or set an email/password" },
          { key: "coord-login-3", label: "Bookmark the CRM URL for quick access" },
        ],
      },
      {
        id: "coord-leads",
        title: "2. Leads Pipeline",
        icon: Users2,
        description: "Manage prospective students from first contact to enrollment.",
        videoKey: "coordinator-leads",
        items: [
          { key: "coord-leads-1", label: "Go to Leads Pipeline in the sidebar" },
          { key: "coord-leads-2", label: "Understand the 7 pipeline stages: New Lead → Enrolled / Lost" },
          { key: "coord-leads-3", label: "Click Add Lead to manually enter a new prospect" },
          { key: "coord-leads-4", label: "Drag a lead card to move it to the next stage" },
          { key: "coord-leads-5", label: "Click a lead to edit details, add notes, or schedule a trial" },
          { key: "coord-leads-6", label: "Set the Assigned To field to track ownership" },
        ],
      },
      {
        id: "coord-contacts",
        title: "3. Contacts",
        icon: Users2,
        description: "Manage parents, guardians, and prospective student contacts.",
        videoKey: "coordinator-contacts",
        items: [
          { key: "coord-contacts-1", label: "Navigate to Contacts in the sidebar" },
          { key: "coord-contacts-2", label: "Add a new contact with name, email, phone, and relationship" },
          { key: "coord-contacts-3", label: "Link contacts to student records where applicable" },
          { key: "coord-contacts-4", label: "Use the search bar to find contacts quickly" },
        ],
      },
      {
        id: "coord-email",
        title: "4. Email Marketing",
        icon: Mail,
        description: "Create and send email campaigns to students and leads.",
        videoKey: "coordinator-email",
        items: [
          { key: "coord-email-1", label: "Go to Email Marketing in the sidebar" },
          { key: "coord-email-2", label: "Click New Campaign and fill in subject, body, and audience segment" },
          { key: "coord-email-3", label: "Use the Send Test button to preview before sending" },
          { key: "coord-email-4", label: "Schedule or send immediately; monitor open and click rates" },
        ],
      },
      {
        id: "coord-bulk",
        title: "5. Bulk Email / Outreach",
        icon: Zap,
        description: "Send mass personalised emails with delay timers to avoid spam filters.",
        videoKey: "coordinator-bulk",
        items: [
          { key: "coord-bulk-1", label: "Go to Bulk Email in the sidebar" },
          { key: "coord-bulk-2", label: "Compose your message and select recipients (students or leads)" },
          { key: "coord-bulk-3", label: "Set the per-message delay (5–30 seconds) to avoid spam detection" },
          { key: "coord-bulk-4", label: "Click Send to All — monitor the live status log" },
          { key: "coord-bulk-5", label: "Review send history in the Outreach History tab" },
        ],
      },
      {
        id: "coord-meta",
        title: "6. Meta Leads",
        icon: Star,
        description: "View and manage leads captured from Facebook and Instagram forms.",
        videoKey: "coordinator-meta",
        items: [
          { key: "coord-meta-1", label: "Go to Meta Leads in the sidebar" },
          { key: "coord-meta-2", label: "Review the Live Leads tab for synced Facebook/Instagram leads" },
          { key: "coord-meta-3", label: "Update lead status (New / Contacted / Qualified / Enrolled / Lost)" },
          { key: "coord-meta-4", label: "Use Sync from Meta to pull the latest leads manually" },
        ],
      },
      {
        id: "coord-placement",
        title: "7. Placement Tests",
        icon: ClipboardList,
        description: "Send English placement tests to leads and new students.",
        videoKey: "coordinator-placement",
        items: [
          { key: "coord-placement-1", label: "Go to Placement Tests in the sidebar" },
          { key: "coord-placement-2", label: "Click Send Test and enter the student's email" },
          { key: "coord-placement-3", label: "Set the expiry window (e.g. 7 days)" },
          { key: "coord-placement-4", label: "Monitor the Submissions tab for completed results" },
          { key: "coord-placement-5", label: "Set up recurring test schedules in the Scheduler tab" },
        ],
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    icon: Star,
    color: "bg-orange-100 text-orange-700",
    sections: [
      {
        id: "sales-login",
        title: "1. Logging In & Your Access",
        icon: Shield,
        description: "Sign in and understand what you can access as a Sales team member.",
        videoKey: "sales-login",
        items: [
          { key: "sales-login-1", label: "Open your invitation email and click the Accept Invitation link" },
          { key: "sales-login-2", label: "Choose Google Sign-In or set an email/password" },
          { key: "sales-login-3", label: "Your access: Leads, Contacts, Email Marketing, Bulk Email, Meta Leads, Placement Tests" },
          { key: "sales-login-4", label: "Finance, Admin Panel, and Analytics are not accessible to your role" },
          { key: "sales-login-5", label: "Bookmark the CRM URL for quick access" },
        ],
      },
      {
        id: "sales-leads",
        title: "2. Leads Pipeline — Your Primary Tool",
        icon: Users2,
        description: "The leads pipeline is your main workspace. Track every prospect from first contact to enrollment.",
        videoKey: "sales-leads",
        items: [
          { key: "sales-leads-1", label: "Go to Leads Pipeline in the sidebar" },
          { key: "sales-leads-2", label: "Understand the 7 stages: New Lead → Contacted → Trial Scheduled → Trial Done → Proposal Sent → Enrolled → Lost" },
          { key: "sales-leads-3", label: "Add a new lead manually with Add Lead button" },
          { key: "sales-leads-4", label: "Drag lead cards between columns to update their stage" },
          { key: "sales-leads-5", label: "Click a lead to add notes, set trial date, and assign to yourself" },
          { key: "sales-leads-6", label: "Always update the stage after each interaction — this drives your pipeline metrics" },
        ],
      },
      {
        id: "sales-contacts",
        title: "3. Contacts",
        icon: Users2,
        description: "Keep parent and student contact information organised.",
        videoKey: "sales-contacts",
        items: [
          { key: "sales-contacts-1", label: "Go to Contacts in the sidebar" },
          { key: "sales-contacts-2", label: "Add parents, guardians, or adult students as contacts" },
          { key: "sales-contacts-3", label: "Always include email and phone for follow-up" },
          { key: "sales-contacts-4", label: "Link contacts to their student record when available" },
        ],
      },
      {
        id: "sales-meta",
        title: "4. Meta Leads (Facebook & Instagram)",
        icon: Star,
        description: "Leads from your Facebook and Instagram ads land here automatically.",
        videoKey: "sales-meta",
        items: [
          { key: "sales-meta-1", label: "Go to Meta Leads in the sidebar" },
          { key: "sales-meta-2", label: "New leads from Facebook/Instagram forms appear in the Live Leads tab" },
          { key: "sales-meta-3", label: "Contact each new lead within 24 hours — update status to Contacted" },
          { key: "sales-meta-4", label: "Move qualified leads into the Leads Pipeline for full tracking" },
          { key: "sales-meta-5", label: "Use Sync from Meta if you don't see a recent lead" },
        ],
      },
      {
        id: "sales-email",
        title: "5. Email Outreach",
        icon: Mail,
        description: "Send follow-up emails and campaigns to your leads.",
        videoKey: "sales-email",
        items: [
          { key: "sales-email-1", label: "Use Email Marketing for scheduled campaigns to your lead list" },
          { key: "sales-email-2", label: "Use Bulk Email for personalised one-to-many outreach with delay timers" },
          { key: "sales-email-3", label: "Always use the Send Test button before sending to your full list" },
          { key: "sales-email-4", label: "Check the Outreach History tab to confirm delivery status" },
        ],
      },
      {
        id: "sales-placement",
        title: "6. Sending Placement Tests",
        icon: ClipboardList,
        description: "Send placement tests to new leads to qualify their English level before enrollment.",
        videoKey: "sales-placement",
        items: [
          { key: "sales-placement-1", label: "Go to Placement Tests in the sidebar" },
          { key: "sales-placement-2", label: "Click Send Test and enter the lead's email address" },
          { key: "sales-placement-3", label: "The lead receives a timed test link by email" },
          { key: "sales-placement-4", label: "Check the Submissions tab to see their CEFR result" },
          { key: "sales-placement-5", label: "Use the CEFR result to recommend the right program level" },
        ],
      },
      {
        id: "sales-tips",
        title: "7. Sales Best Practices",
        icon: Star,
        description: "Key habits to maximise your conversion rate using the CRM.",
        videoKey: "sales-tips",
        items: [
          { key: "sales-tips-1", label: "Update every lead's stage after each call or email — never leave it stale" },
          { key: "sales-tips-2", label: "Add a note to every lead interaction (date, what was discussed, next step)" },
          { key: "sales-tips-3", label: "Send a placement test to every new lead within 48 hours of first contact" },
          { key: "sales-tips-4", label: "Follow up with a trial class offer once you have their CEFR result" },
          { key: "sales-tips-5", label: "Use the Bulk Email delay timer (10–15s) to avoid spam filters on mass outreach" },
          { key: "sales-tips-6", label: "Check Meta Leads every morning for overnight Facebook/Instagram form submissions" },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-700",
    sections: [
      {
        id: "fin-login",
        title: "1. Logging In",
        icon: Shield,
        description: "Access the CRM using your invitation link.",
        videoKey: "finance-login",
        items: [
          { key: "fin-login-1", label: "Open your invitation email and click the Accept Invitation link" },
          { key: "fin-login-2", label: "Choose Google Sign-In or set an email/password" },
          { key: "fin-login-3", label: "Bookmark the CRM URL for quick access" },
        ],
      },
      {
        id: "fin-accounting",
        title: "2. Accounting — Payments",
        icon: DollarSign,
        description: "Record and track student payments.",
        videoKey: "finance-accounting",
        items: [
          { key: "fin-accounting-1", label: "Go to Accounting in the sidebar" },
          { key: "fin-accounting-2", label: "Click Add Payment to record a new student payment" },
          { key: "fin-accounting-3", label: "Select the student, amount, currency, and payment method" },
          { key: "fin-accounting-4", label: "Set status to Completed once payment is confirmed" },
          { key: "fin-accounting-5", label: "Add an invoice number for reference" },
          { key: "fin-accounting-6", label: "Use the filter bar to view payments by campus or status" },
        ],
      },
      {
        id: "fin-bills",
        title: "3. Bills & Expenses",
        icon: DollarSign,
        description: "Track recurring bills and operational expenses.",
        videoKey: "finance-bills",
        items: [
          { key: "fin-bills-1", label: "Go to Bills & Expenses in the sidebar" },
          { key: "fin-bills-2", label: "Add recurring bills (rent, utilities, software subscriptions)" },
          { key: "fin-bills-3", label: "Set due dates and mark bills as paid when settled" },
          { key: "fin-bills-4", label: "Review the Bills Due Soon alert to avoid missed payments" },
          { key: "fin-bills-5", label: "Add one-time expenses with category and campus tags" },
        ],
      },
      {
        id: "fin-dashboard",
        title: "4. Financial Dashboard",
        icon: BarChart3,
        description: "View revenue, expenses, and net profit across all campuses.",
        videoKey: "finance-dashboard",
        items: [
          { key: "fin-dashboard-1", label: "Go to Financial Dashboard in the sidebar (admin/finance only)" },
          { key: "fin-dashboard-2", label: "Review Total Revenue, Pending Collections, Total Expenses, and Net Profit" },
          { key: "fin-dashboard-3", label: "Use the campus filter to view per-location financials" },
          { key: "fin-dashboard-4", label: "Check the Revenue by Program chart for program performance" },
          { key: "fin-dashboard-5", label: "Export or screenshot the dashboard for monthly reporting" },
        ],
      },
      {
        id: "fin-scholarships",
        title: "5. Scholarships & Packages",
        icon: Star,
        description: "Manage financial aid and language package pricing.",
        videoKey: "finance-scholarships",
        items: [
          { key: "fin-scholarships-1", label: "Go to Scholarships in the sidebar to view and create financial aid records" },
          { key: "fin-scholarships-2", label: "Go to Language Packages to review and update program pricing" },
          { key: "fin-scholarships-3", label: "Coordinate with admin before changing package prices" },
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    color: "bg-purple-100 text-purple-700",
    sections: [
      {
        id: "admin-login",
        title: "1. Logging In",
        icon: Shield,
        description: "Access the CRM as an administrator.",
        videoKey: "admin-login",
        items: [
          { key: "admin-login-1", label: "Sign in with your Manus account (primary admin method) or Google" },
          { key: "admin-login-2", label: "Confirm your role badge shows Admin in the sidebar" },
          { key: "admin-login-3", label: "You have access to all modules including Finance, Admin Panel, and Analytics" },
        ],
      },
      {
        id: "admin-staff",
        title: "2. Inviting Staff Members",
        icon: Users2,
        description: "Add new team members and assign their roles.",
        videoKey: "admin-staff",
        items: [
          { key: "admin-staff-1", label: "Go to Admin Panel → Users & Roles tab" },
          { key: "admin-staff-2", label: "Click Invite Staff Member and enter their email" },
          { key: "admin-staff-3", label: "Select their role: Instructor, Coordinator, Sales, Finance, or Admin" },
          { key: "admin-staff-4", label: "They receive an email with an invitation link" },
          { key: "admin-staff-5", label: "Monitor the Pending Invitations table to track acceptance" },
          { key: "admin-staff-6", label: "Revoke an invitation if needed before it is accepted" },
        ],
      },
      {
        id: "admin-placement",
        title: "3. Placement Tests — Full Control",
        icon: ClipboardList,
        description: "Create test versions, seed defaults, and manage the scheduler.",
        videoKey: "admin-placement",
        items: [
          { key: "admin-placement-1", label: "Go to Placement Tests → click Seed Default Test to load the 30-question A1–C2 test" },
          { key: "admin-placement-2", label: "Create custom test versions with the + New Test button" },
          { key: "admin-placement-3", label: "Edit questions in the Question Editor accordion" },
          { key: "admin-placement-4", label: "Set up recurring test schedules in the Scheduler tab" },
          { key: "admin-placement-5", label: "Review all submissions and download PDF certificates" },
          { key: "admin-placement-6", label: "Add staff notes on any submission" },
        ],
      },
      {
        id: "admin-outreach",
        title: "4. Outreach Hub & Integrations",
        icon: Zap,
        description: "Connect social media channels and manage API credentials.",
        videoKey: "admin-outreach",
        items: [
          { key: "admin-outreach-1", label: "Go to Outreach Hub to connect Email, WhatsApp, Meta, Instagram, and other platforms" },
          { key: "admin-outreach-2", label: "Click Connect on each platform and enter your API credentials" },
          { key: "admin-outreach-3", label: "Go to Meta Leads → Setup Guide to configure your Facebook webhook" },
          { key: "admin-outreach-4", label: "Go to Integrations to manage webhooks and sync jobs" },
        ],
      },
      {
        id: "admin-onboarding-videos",
        title: "5. Adding Tutorial Videos to This Guide",
        icon: Play,
        description: "Add YouTube tutorial videos to each section of this guide.",
        videoKey: "admin-onboarding-videos",
        items: [
          { key: "admin-videos-1", label: "Record a short screen-capture tutorial for each section (2–5 minutes recommended)" },
          { key: "admin-videos-2", label: "Upload the video to YouTube (unlisted is fine)" },
          { key: "admin-videos-3", label: "Click the Edit Video button on any section in this guide" },
          { key: "admin-videos-4", label: "Paste the YouTube URL and click Save — it embeds immediately" },
          { key: "admin-videos-5", label: "All staff can then watch the video directly in this guide" },
        ],
      },
      {
        id: "admin-analytics",
        title: "6. Analytics & Reporting",
        icon: BarChart3,
        description: "Monitor CRM-wide performance metrics.",
        videoKey: "admin-analytics",
        items: [
          { key: "admin-analytics-1", label: "Go to Analytics in the sidebar" },
          { key: "admin-analytics-2", label: "Review student growth, lead conversion, and revenue trends" },
          { key: "admin-analytics-3", label: "Use the Financial Dashboard for detailed revenue/expense breakdown" },
          { key: "admin-analytics-4", label: "Export or screenshot reports for board meetings" },
        ],
      },
    ],
  },
];

// ─── YouTube embed helper ──────────────────────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
    else if (u.hostname.includes("youtube.com")) videoId = u.searchParams.get("v");
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

// ─── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  section,
  completedItems,
  onToggle,
  videoUrl,
  isAdmin,
  onEditVideo,
}: {
  section: Section;
  completedItems: Set<string>;
  onToggle: (key: string) => void;
  videoUrl?: string;
  isAdmin: boolean;
  onEditVideo: (sectionKey: string, currentUrl: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const done = section.items.filter((i) => completedItems.has(i.key)).length;
  const total = section.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <section.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold leading-tight">{section.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{section.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={done === total ? "default" : "secondary"} className="text-xs">
              {done}/{total}
            </Badge>
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        {total > 0 && (
          <Progress value={pct} className="h-1 mt-2" />
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Checklist */}
          <div className="space-y-2">
            {section.items.map((item) => {
              const checked = completedItems.has(item.key);
              return (
                <div
                  key={item.key}
                  className="flex items-start gap-3 cursor-pointer group"
                  onClick={() => onToggle(item.key)}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggle(item.key)}
                    className="mt-0.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={`text-sm leading-snug ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Video section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Play className="w-3 h-3" /> Tutorial Video
              </p>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={(e) => { e.stopPropagation(); onEditVideo(section.videoKey, videoUrl ?? ""); }}
                >
                  <Edit2 className="w-3 h-3" /> Edit Video
                </Button>
              )}
            </div>
            {embedUrl ? (
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={section.title}
                />
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 aspect-video flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Play className="w-8 h-8 opacity-30" />
                <p className="text-sm font-medium">Video coming soon</p>
                {isAdmin && (
                  <p className="text-xs">Click Edit Video to add a YouTube link</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Role tab content ──────────────────────────────────────────────────────────
function RoleTab({
  role,
  videos,
  isAdmin,
  onEditVideo,
}: {
  role: typeof ROLES[number];
  videos: Record<string, string>;
  isAdmin: boolean;
  onEditVideo: (sectionKey: string, currentUrl: string) => void;
}) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const progressQuery = trpc.guide.getProgress.useQuery({ role: role.id });

  // Load saved progress once on mount
  if (!loaded && progressQuery.data) {
    setCompletedItems(new Set(progressQuery.data.completedItems));
    setLoaded(true);
  }

  const saveMutation = trpc.guide.saveProgress.useMutation();
  const resetMutation = trpc.guide.resetProgress.useMutation({
    onSuccess: () => {
      setCompletedItems(new Set());
      toast.success("Progress reset");
    },
  });

  const handleToggle = useCallback((key: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveMutation.mutate({ role: role.id, completedItems: Array.from(next) });
      return next;
    });
  }, [role.id, saveMutation]);

  const allItems = role.sections.flatMap((s) => s.items);
  const totalItems = allItems.length;
  const doneItems = allItems.filter((i) => completedItems.has(i.key)).length;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall progress header */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.color}`}>
                <role.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{role.label} Onboarding Progress</p>
                <p className="text-xs text-muted-foreground">{doneItems} of {totalItems} steps completed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {overallPct === 100 && (
                <Badge className="bg-green-500 text-white gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Complete!
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => resetMutation.mutate({ role: role.id })}
                disabled={resetMutation.isPending || doneItems === 0}
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </Button>
            </div>
          </div>
          <Progress value={overallPct} className="h-3" />
          <p className="text-right text-xs text-muted-foreground mt-1">{overallPct}%</p>
        </CardContent>
      </Card>

      {/* Section cards */}
      {progressQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {role.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              completedItems={completedItems}
              onToggle={handleToggle}
              videoUrl={videos[section.videoKey]}
              isAdmin={isAdmin}
              onEditVideo={onEditVideo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OnboardingGuide() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [editVideoKey, setEditVideoKey] = useState<string | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState("");

  const videosQuery = trpc.guide.listVideos.useQuery();
  const upsertVideoMutation = trpc.guide.upsertVideo.useMutation({
    onSuccess: () => {
      videosQuery.refetch();
      setEditVideoKey(null);
      toast.success("Video URL saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const videoMap: Record<string, string> = {};
  (videosQuery.data ?? []).forEach((v) => {
    if (v.youtubeUrl) videoMap[v.sectionKey] = v.youtubeUrl;
  });

  const handleEditVideo = (sectionKey: string, currentUrl: string) => {
    setEditVideoKey(sectionKey);
    setEditVideoUrl(currentUrl);
  };

  const handlePrint = () => window.print();

  // Default tab: match user's role, or first tab
  const defaultTab = ROLES.find((r) => r.id === user?.role)?.id ?? ROLES[0].id;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Onboarding Guide
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Role-specific instructions for using the LIOTA CRM. Check off each step as you complete it — your progress is saved automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
          <Download className="w-4 h-4" /> Download PDF
        </Button>
      </div>

      {/* Role tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {ROLES.map((role) => (
            <TabsTrigger key={role.id} value={role.id} className="gap-1.5 text-xs">
              <role.icon className="w-3.5 h-3.5" />
              {role.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map((role) => (
          <TabsContent key={role.id} value={role.id} className="mt-6">
            <RoleTab
              role={role}
              videos={videoMap}
              isAdmin={isAdmin}
              onEditVideo={handleEditVideo}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit video dialog */}
      <Dialog open={!!editVideoKey} onOpenChange={(o) => !o && setEditVideoKey(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tutorial Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>YouTube URL</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={editVideoUrl}
                onChange={(e) => setEditVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Paste a YouTube video URL. It will be embedded in this section for all staff.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditVideoKey(null)}>Cancel</Button>
              <Button
                onClick={() => upsertVideoMutation.mutate({ sectionKey: editVideoKey!, youtubeUrl: editVideoUrl || null })}
                disabled={upsertVideoMutation.isPending}
              >
                {upsertVideoMutation.isPending ? "Saving..." : "Save Video"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print styles */}
      <style>{`
        @media print {
          aside, nav, button, .no-print { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
