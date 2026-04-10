import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  BookOpen, GraduationCap, Users, DollarSign, ShieldCheck,
  PlayCircle, Edit3, Download, CheckCircle2, AlertCircle, Info,
  ChevronRight, Lock, Eye, FileText, Mail, BarChart3, Calendar,
  UserPlus, Settings, Zap, ClipboardList
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Section {
  key: string;
  title: string;
  icon: React.ReactNode;
  steps: string[];
  note?: string;
  restricted?: boolean;
}

interface RoleConfig {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  accessSummary: string[];
  sections: Section[];
}

// ─── Role Definitions ─────────────────────────────────────────────────────────
const ROLES: RoleConfig[] = [
  {
    id: "instructor",
    label: "Instructor / Teacher",
    color: "bg-blue-500",
    icon: <GraduationCap className="h-5 w-5" />,
    description: "Teachers and language instructors who manage classes, track student progress, and run placement tests.",
    accessSummary: ["View Students", "View & Manage Classes", "Academic Progress", "Placement Tests", "Contacts (view)"],
    sections: [
      {
        key: "instructor_login",
        title: "1. Logging In",
        icon: <ShieldCheck className="h-4 w-4" />,
        steps: [
          "Open the LIOTA CRM in your browser.",
          "Click 'Sign in with Google' to use your Google account, or enter your email and password if you set one when accepting your invitation.",
          "If you haven't received an invitation yet, ask your Admin to send one to your email.",
          "Once logged in, you will see the main sidebar on the left. Your role is shown at the bottom as 'Instructor'.",
        ],
      },
      {
        key: "instructor_students",
        title: "2. Viewing Your Students",
        icon: <Users className="h-4 w-4" />,
        steps: [
          "Click 'Students' in the left sidebar under the STUDENTS section.",
          "You can search by name, filter by campus, age group, or enrollment status.",
          "Click on any student card to open their profile sheet on the right side.",
          "The profile shows their contact info, CEFR level, enrollment status, and test history.",
          "You can view but NOT delete students — only Admins and Coordinators can do that.",
        ],
      },
      {
        key: "instructor_classes",
        title: "3. Managing Your Classes",
        icon: <Calendar className="h-4 w-4" />,
        steps: [
          "Click 'Classes' in the sidebar.",
          "You will see all classes at your campus. Use the filter to show only your classes.",
          "Click a class to view its schedule, enrolled students, and attendance records.",
          "To mark attendance, open the class and use the Attendance tab.",
          "To update a class status (e.g., from Scheduled to Active), click the Edit button on the class card.",
        ],
      },
      {
        key: "instructor_academic",
        title: "4. Academic Progress & CEFR Assessments",
        icon: <BarChart3 className="h-4 w-4" />,
        steps: [
          "Click 'Academic Progress' in the sidebar.",
          "Select a student to view their full CEFR assessment history.",
          "To add a new assessment, click 'Add Assessment', select the student, date, CEFR level, and scores for each skill (Speaking, Listening, Reading, Writing).",
          "The system will automatically update the student's CEFR level on their profile.",
          "You can add notes about the assessment for your records.",
        ],
      },
      {
        key: "instructor_placement",
        title: "5. Placement Tests",
        icon: <ClipboardList className="h-4 w-4" />,
        steps: [
          "Click 'Placement Tests' in the sidebar.",
          "To send a test to a student, click the 'Send Test' button on any test version.",
          "Enter the student's name and email (or select from the student list), set an expiry date, and click Send.",
          "The student will receive an email from contact@liota.institute with a link to take the test.",
          "Once completed, the result appears in the Submissions tab with their CEFR score and a PDF certificate.",
          "You can also open any student's profile and go to the 'Placement Tests' tab to send directly from there.",
        ],
      },
      {
        key: "instructor_notes",
        title: "6. Leaving Notes on Test Submissions",
        icon: <FileText className="h-4 w-4" />,
        steps: [
          "In the Placement Tests page, click the Submissions tab.",
          "Find the student's submission and click 'Details' to open the side panel.",
          "Click the 'Staff Notes' tab inside the panel.",
          "Type your note and click 'Add Note'. Notes are internal — students cannot see them.",
          "You can delete your own notes but not notes left by other staff members.",
        ],
      },
    ],
  },
  {
    id: "coordinator",
    label: "Coordinator / Sales",
    color: "bg-emerald-500",
    icon: <Users className="h-5 w-5" />,
    description: "Enrollment coordinators and sales staff who manage leads, communicate with prospects, and handle enrollments.",
    accessSummary: ["Full Student Management", "Leads Pipeline", "Email Marketing", "Contacts", "Placement Tests", "Scholarships & Camps"],
    sections: [
      {
        key: "coord_login",
        title: "1. Logging In",
        icon: <ShieldCheck className="h-4 w-4" />,
        steps: [
          "Open the LIOTA CRM in your browser.",
          "Sign in with Google or your email/password from your invitation.",
          "Your role shows as 'Coordinator' at the bottom of the sidebar.",
          "You have access to all student and sales features but NOT finance or admin settings.",
        ],
      },
      {
        key: "coord_leads",
        title: "2. Managing the Leads Pipeline",
        icon: <Zap className="h-4 w-4" />,
        steps: [
          "Click 'Leads Pipeline' in the sidebar under SALES & MARKETING.",
          "The Kanban board shows leads in stages: New Lead → Contacted → Trial Scheduled → Trial Done → Proposal Sent → Enrolled → Lost.",
          "Drag and drop a lead card to move it to the next stage.",
          "Click a lead card to view details, add notes, or schedule a trial.",
          "To add a new lead, click the '+ Add Lead' button at the top right.",
          "Fill in the lead's name, email, phone, interested program, preferred campus, and source (e.g., Meta, Referral, Walk-in).",
        ],
      },
      {
        key: "coord_students",
        title: "3. Enrolling & Managing Students",
        icon: <GraduationCap className="h-4 w-4" />,
        steps: [
          "Click 'Students' in the sidebar.",
          "To add a new student, click '+ Add Student' and fill in all required fields.",
          "Set the Enrollment Status to 'Trial' for new students, then update to 'Active' once they enroll.",
          "Assign the correct campus, age group (Children / Teens / Adults), and program.",
          "For children and teens, fill in the Parent/Guardian information fields.",
          "Use the Tags field to add labels like 'VIP', 'Scholarship', or 'Referral'.",
        ],
      },
      {
        key: "coord_email",
        title: "4. Email Marketing & Bulk Outreach",
        icon: <Mail className="h-4 w-4" />,
        steps: [
          "Click 'Email Marketing' in the sidebar.",
          "To send a bulk email, click 'Bulk Email' or go to the Bulk Email page.",
          "Select recipients using the checkboxes (filter by campus, program, or status).",
          "Choose a template from the dropdown or write a custom subject and body.",
          "Use {{name}} and {{first_name}} tokens to personalize the message.",
          "Set a send delay (5–30 seconds between emails) to avoid spam filters.",
          "Click 'Send Test Email' first to preview, then 'Send to X Recipients' to send.",
        ],
      },
      {
        key: "coord_contacts",
        title: "5. Managing Contacts",
        icon: <Users className="h-4 w-4" />,
        steps: [
          "Click 'Contacts' in the sidebar.",
          "Contacts are parents, guardians, and other non-student contacts.",
          "Click '+ Add Contact' to create a new contact with name, email, phone, and tags.",
          "Open a contact to view their communication history and add notes.",
          "Use the Tags field to categorize contacts (e.g., 'Parent', 'Corporate', 'Partner').",
        ],
      },
      {
        key: "coord_placement",
        title: "6. Sending Placement Tests to Leads",
        icon: <ClipboardList className="h-4 w-4" />,
        steps: [
          "Go to 'Placement Tests' in the sidebar.",
          "Click 'Send Test' on the appropriate test version (Starter, Intermediate, or Advanced).",
          "Enter the lead's name and email, set expiry to 7 days, and click Send.",
          "The lead receives a branded email with a test link. Once completed, you see their CEFR level in the Submissions tab.",
          "Use this result to recommend the right program level when following up.",
        ],
      },
      {
        key: "coord_scholarships",
        title: "7. Scholarships & Camps",
        icon: <BookOpen className="h-4 w-4" />,
        steps: [
          "Click 'Scholarships' to view and manage scholarship applications and awards.",
          "Click 'Seasonal Camps' to view and manage Winter, Spring, Summer, and Fall camp registrations.",
          "Click 'Special Events' to manage workshops, open houses, and other events.",
          "To add a new scholarship, click '+ Add Scholarship' and fill in the student, amount, and program details.",
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance / Accounting",
    color: "bg-amber-500",
    icon: <DollarSign className="h-5 w-5" />,
    description: "Finance staff who manage payments, invoices, bills, and financial reporting.",
    accessSummary: ["Accounting (full)", "Bills Tracker", "Financial Dashboard (PIN)", "View Students", "View Reports"],
    sections: [
      {
        key: "finance_login",
        title: "1. Logging In",
        icon: <ShieldCheck className="h-4 w-4" />,
        steps: [
          "Open the LIOTA CRM and sign in with your credentials.",
          "Your role shows as 'Finance' or 'User' in the sidebar.",
          "You have access to all Accounting and Finance features.",
          "The Financial Dashboard requires a 4-digit PIN — ask your Admin for the PIN.",
        ],
      },
      {
        key: "finance_payments",
        title: "2. Recording Payments",
        icon: <DollarSign className="h-4 w-4" />,
        steps: [
          "Click 'Accounting' in the sidebar under FINANCE.",
          "Click the 'Payments' tab to see all payment records.",
          "To add a new payment, click '+ Add Payment'.",
          "Select the student, enter the amount, currency (USD/MXN/EUR/GBP), and payment method (Stripe, Zelle, Cash, PayPal, Dolla, Card, Transfer).",
          "Add an invoice number if applicable and set the status (Pending / Completed / Failed / Refunded).",
          "Click Save. The payment appears in the list immediately.",
        ],
      },
      {
        key: "finance_invoices",
        title: "3. Generating Invoices",
        icon: <FileText className="h-4 w-4" />,
        steps: [
          "In the Accounting page, click the 'Invoices' tab.",
          "Click '+ Generate Invoice' to create a new invoice for a student.",
          "Select the student, program, amount, and due date.",
          "The system generates an invoice number automatically.",
          "You can mark invoices as Paid once payment is received.",
        ],
      },
      {
        key: "finance_bills",
        title: "4. Managing Recurring Bills",
        icon: <Calendar className="h-4 w-4" />,
        steps: [
          "Click 'Bills' in the sidebar under FINANCE.",
          "The Bills page shows all recurring expenses (rent, utilities, software, marketing, etc.) per campus.",
          "To mark a bill as paid, click the 'Mark Paid' button on the bill row.",
          "To add a new recurring bill, click '+ Add Bill' and fill in the name, amount, currency, due day, campus, and category.",
          "The system sends reminder notifications to the Admin 7, 3, and 1 day before each bill is due.",
          "The Bills Dashboard at the top shows totals by category and campus.",
        ],
      },
      {
        key: "finance_dashboard",
        title: "5. Financial Dashboard",
        icon: <Lock className="h-4 w-4" />,
        restricted: true,
        steps: [
          "Click 'Financial Dashboard' in the sidebar (PIN required).",
          "Enter the 4-digit PIN provided by your Admin.",
          "The dashboard shows total revenue, expenses, net income, and breakdowns by campus and program.",
          "Revenue figures are blurred by default — click the eye icon to reveal them.",
          "Use the date range filters to view monthly or quarterly reports.",
          "This page is Admin/Finance only — other staff cannot access it.",
        ],
        note: "The Financial Dashboard PIN is set by the Admin. Keep it confidential.",
      },
      {
        key: "finance_expenses",
        title: "6. Recording Expenses",
        icon: <BarChart3 className="h-4 w-4" />,
        steps: [
          "In the Accounting page, click the 'Expenses' tab.",
          "Click '+ Add Expense' to record a new expense.",
          "Select the category (Rent, Utilities, Marketing, Salaries, etc.), campus, amount, and date.",
          "Expenses feed into the Financial Dashboard reports automatically.",
        ],
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    color: "bg-purple-500",
    icon: <ShieldCheck className="h-5 w-5" />,
    description: "System administrators with full access to all features, user management, integrations, and settings.",
    accessSummary: ["Full Access to All Modules", "User & Staff Management", "Integrations & Webhooks", "Admin Panel", "Financial Dashboard", "Outreach Hub"],
    sections: [
      {
        key: "admin_login",
        title: "1. Logging In as Admin",
        icon: <ShieldCheck className="h-4 w-4" />,
        steps: [
          "Open the LIOTA CRM and sign in. Your role shows as 'Admin' in the sidebar.",
          "As Admin, you have access to every module and every action in the system.",
          "The Admin Panel is accessible from the sidebar under INTEGRATIONS & ADMIN.",
        ],
      },
      {
        key: "admin_invite",
        title: "2. Inviting Staff Members",
        icon: <UserPlus className="h-4 w-4" />,
        steps: [
          "Click 'Admin Panel' in the sidebar.",
          "Go to the 'Users & Roles' tab.",
          "Click '+ Invite User' and enter the staff member's email address.",
          "Select their role: Instructor, Coordinator, Finance, or Admin.",
          "Optionally add a personal message. Click 'Send Invitation'.",
          "The staff member receives an email from contact@liota.institute with a link.",
          "They click the link and choose to sign in with Google or set a password.",
          "Once accepted, they appear in the Users table with their role.",
          "To revoke access, click 'Revoke' on their invitation or user row.",
        ],
      },
      {
        key: "admin_outreach",
        title: "3. Outreach Hub — Connecting Channels",
        icon: <Zap className="h-4 w-4" />,
        steps: [
          "Click 'Outreach Hub' in the sidebar under INTEGRATIONS & ADMIN.",
          "You will see 8 platform cards: Email (Resend), WhatsApp, Meta, Instagram, TikTok, YouTube, X (Twitter), LinkedIn.",
          "Click 'Connect' or 'Edit' on any platform card to enter credentials.",
          "For Email: the Resend API key is already configured. Domain liota.institute is verified.",
          "For WhatsApp: enter your WhatsApp Business API phone number ID, access token, and business account ID.",
          "For Meta: enter your App ID, App Secret, and Page Access Token.",
          "Credentials are stored securely and masked in the UI.",
        ],
      },
      {
        key: "admin_meta",
        title: "4. Meta Leads Integration",
        icon: <Eye className="h-4 w-4" />,
        steps: [
          "Click 'Meta Leads' in the sidebar.",
          "Go to the 'Live Leads' tab to see all leads synced from your Meta Lead Forms.",
          "To sync manually, click 'Sync from Meta', enter your Page Access Token and Form ID (1652859402713081), and click Sync.",
          "The webhook URL for real-time lead capture is: [your CRM URL]/api/meta/webhook",
          "In Meta Business Suite → Lead Ads → Webhooks, paste this URL and use the verify token set in your Admin secrets.",
          "New leads from Meta will appear automatically in the Live Leads tab and be added to the Leads Pipeline.",
        ],
      },
      {
        key: "admin_placement",
        title: "5. Managing Placement Tests",
        icon: <ClipboardList className="h-4 w-4" />,
        steps: [
          "Go to 'Placement Tests' in the sidebar.",
          "Click 'Seed Default Test' to load the pre-built 30-question A1–C2 test.",
          "To create a custom test, click '+ New Test', fill in the title, target level, and duration.",
          "Click 'Edit Questions' on any test to add/edit questions with A/B/C/D options, correct answer, CEFR tag, and skill tag.",
          "Use the Scheduler tab to set up recurring tests for students (e.g., every 2 months).",
          "View all submissions in the Submissions tab — click Details to see question analytics and leave staff notes.",
          "Admins can edit YouTube tutorial videos for each section of this guide (see below).",
        ],
      },
      {
        key: "admin_videos",
        title: "6. Adding Tutorial Videos to This Guide",
        icon: <PlayCircle className="h-4 w-4" />,
        steps: [
          "On this Onboarding Guide page, you will see a 'Edit Video' button (pencil icon) next to each section — visible only to Admins.",
          "Click 'Edit Video' on any section.",
          "Paste the YouTube video URL (e.g., https://www.youtube.com/watch?v=XXXX) and click Save.",
          "The video will embed directly in that section for all staff to watch.",
          "To remove a video, click 'Edit Video' again and clear the URL field.",
          "Videos are stored in the database and persist across sessions.",
        ],
      },
      {
        key: "admin_panel",
        title: "7. Admin Panel Overview",
        icon: <Settings className="h-4 w-4" />,
        steps: [
          "The Admin Panel (sidebar → Admin Panel) has 4 tabs: Overview, Users & Roles, System Stats, and Permissions.",
          "Overview: shows system health, total users, pending invitations, and recent activity.",
          "Users & Roles: invite staff, view all users, change roles, revoke access.",
          "System Stats: database record counts, storage usage, and API call metrics.",
          "Permissions: role-based access matrix showing what each role can do.",
        ],
      },
      {
        key: "admin_pdf",
        title: "8. Downloading This Guide as PDF",
        icon: <Download className="h-4 w-4" />,
        steps: [
          "Click the 'Download as PDF' button at the top right of this page.",
          "Your browser will open the print dialog. Select 'Save as PDF' as the destination.",
          "Click Save and choose where to save the file.",
          "The PDF includes all role tabs, sections, and any embedded video links.",
          "You can share this PDF with new staff members before they log in for the first time.",
        ],
      },
    ],
  },
];

// ─── YouTube Embed Helper ─────────────────────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;
    if (u.hostname.includes("youtube.com")) {
      videoId = u.searchParams.get("v");
    } else if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

// ─── Video Placeholder / Embed ────────────────────────────────────────────────
function VideoBlock({
  sectionKey,
  isAdmin,
  videoMap,
  onEdit,
}: {
  sectionKey: string;
  isAdmin: boolean;
  videoMap: Record<string, string>;
  onEdit: (key: string, current: string) => void;
}) {
  const url = videoMap[sectionKey];
  const embedUrl = url ? getYouTubeEmbedUrl(url) : null;

  return (
    <div className="mt-3">
      {embedUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-border" style={{ paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={embedUrl}
            title="Tutorial video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
          <PlayCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground italic">
            {isAdmin ? "No video added yet — click Edit Video to add a YouTube tutorial." : "Tutorial video coming soon."}
          </span>
        </div>
      )}
      {isAdmin && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(sectionKey, url ?? "")}
        >
          <Edit3 className="h-3 w-3 mr-1" />
          {url ? "Edit Video" : "Add Video"}
        </Button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OnboardingGuide() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const printRef = useRef<HTMLDivElement>(null);

  const [activeRole, setActiveRole] = useState("instructor");
  const [editDialog, setEditDialog] = useState<{ open: boolean; key: string; value: string }>({
    open: false, key: "", value: "",
  });

  const { data: videos = [], refetch: refetchVideos } = trpc.guide.listVideos.useQuery();
  const upsertVideo = trpc.guide.upsertVideo.useMutation({
    onSuccess: () => {
      toast.success("Video saved successfully");
      refetchVideos();
      setEditDialog({ open: false, key: "", value: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const videoMap: Record<string, string> = {};
  for (const v of videos) {
    if (v.youtubeUrl) videoMap[v.sectionKey] = v.youtubeUrl;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleSaveVideo = () => {
    upsertVideo.mutate({
      sectionKey: editDialog.key,
      youtubeUrl: editDialog.value.trim() || null,
    });
  };

  const currentRole = ROLES.find((r) => r.id === activeRole)!;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { font-size: 12pt; }
          .sidebar, nav, header { display: none !important; }
        }
      `}</style>

      <div ref={printRef} className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">LIOTA CRM — Staff Onboarding Guide</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Step-by-step instructions for each role. Select your role below to see what you can do and how to do it.
            </p>
          </div>
          <Button onClick={handlePrint} variant="outline" className="no-print shrink-0">
            <Download className="h-4 w-4 mr-2" />
            Download as PDF
          </Button>
        </div>

        {/* Role Tabs */}
        <Tabs value={activeRole} onValueChange={setActiveRole}>
          <TabsList className="flex flex-wrap h-auto gap-1 no-print">
            {ROLES.map((role) => (
              <TabsTrigger key={role.id} value={role.id} className="flex items-center gap-1.5">
                {role.icon}
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {ROLES.map((role) => (
            <TabsContent key={role.id} value={role.id} className="space-y-4 mt-4">
              {/* Role Overview Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.color} text-white`}>
                      {role.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.label}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-muted-foreground mr-1">Access:</span>
                    {role.accessSummary.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sections Accordion */}
              <Accordion type="multiple" defaultValue={role.sections.map((s) => s.key)} className="space-y-2">
                {role.sections.map((section) => (
                  <AccordionItem
                    key={section.key}
                    value={section.key}
                    className="border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 text-left">
                        <span className="text-primary">{section.icon}</span>
                        <span className="font-medium">{section.title}</span>
                        {section.restricted && (
                          <Badge variant="outline" className="text-xs ml-1">
                            <Lock className="h-3 w-3 mr-1" />
                            Restricted
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-3">
                      {/* Steps */}
                      <ol className="space-y-2">
                        {section.steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-foreground/90 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>

                      {/* Note */}
                      {section.note && (
                        <div className="flex gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-400">{section.note}</p>
                        </div>
                      )}

                      {/* Video block */}
                      <VideoBlock
                        sectionKey={section.key}
                        isAdmin={isAdmin}
                        videoMap={videoMap}
                        onEdit={(key, current) => setEditDialog({ open: true, key, value: current })}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Quick Tips */}
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Quick Tips for {role.label}</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Use the search bar at the top of each list page to quickly find records.</li>
                        <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Changes are saved automatically — no need to click a global Save button.</li>
                        <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> If you see a "Forbidden" error, that feature requires a higher role — contact your Admin.</li>
                        <li className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> The language toggle (EN/ES) in the sidebar switches the interface language.</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          LIOTA — Language Institute of the Americas · CRM Onboarding Guide · {new Date().getFullYear()}
          <br />
          For support, contact your system administrator.
        </div>
      </div>

      {/* Edit Video Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(o) => !o && setEditDialog({ open: false, key: "", value: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add / Edit Tutorial Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="yt-url">YouTube Video URL</Label>
              <Input
                id="yt-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={editDialog.value}
                onChange={(e) => setEditDialog((d) => ({ ...d, value: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a full YouTube URL. Leave blank to remove the video.
              </p>
            </div>
            {editDialog.value && getYouTubeEmbedUrl(editDialog.value) && (
              <div className="rounded-md overflow-hidden border" style={{ paddingBottom: "40%", position: "relative", height: 0 }}>
                <iframe
                  src={getYouTubeEmbedUrl(editDialog.value)!}
                  className="absolute top-0 left-0 w-full h-full"
                  title="Preview"
                  allowFullScreen
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, key: "", value: "" })}>Cancel</Button>
            <Button onClick={handleSaveVideo} disabled={upsertVideo.isPending}>
              {upsertVideo.isPending ? "Saving..." : "Save Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
