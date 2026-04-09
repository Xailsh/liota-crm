import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, Users, Settings, Database, Activity, Loader2,
  Edit2, CheckCircle, AlertTriangle, Globe, Lock, Check, Minus,
  Mail, UserPlus, Copy, Trash2, Ban, Clock
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

const CAMPUSES = ["Mérida", "Dallas", "Denver", "Vienna", "Online"];
const PROGRAMS = ["Children", "Teenagers", "Adults", "Business English", "ESL", "SSL", "Polyglot"];

// ─── Role Permissions Matrix ─────────────────────────────────────────────────

type Role = "admin" | "instructor" | "coordinator" | "receptionist" | "user";

interface Permission {
  label: string;
  category: string;
  admin: boolean;
  instructor: boolean;
  coordinator: boolean;
  receptionist: boolean;
}

const PERMISSIONS: Permission[] = [
  // Dashboard & General
  { label: "View Dashboard", category: "General", admin: true, instructor: true, coordinator: true, receptionist: true },
  { label: "View Analytics & Reports", category: "General", admin: true, instructor: false, coordinator: true, receptionist: false },
  { label: "View Audit Log", category: "General", admin: true, instructor: false, coordinator: false, receptionist: false },

  // Students
  { label: "View Students", category: "Students", admin: true, instructor: true, coordinator: true, receptionist: true },
  { label: "Create / Edit Students", category: "Students", admin: true, instructor: false, coordinator: true, receptionist: true },
  { label: "Delete Students", category: "Students", admin: true, instructor: false, coordinator: false, receptionist: false },

  // Classes & Programs
  { label: "View Classes & Schedule", category: "Classes", admin: true, instructor: true, coordinator: true, receptionist: true },
  { label: "Create / Edit Classes", category: "Classes", admin: true, instructor: false, coordinator: true, receptionist: false },
  { label: "Manage Attendance", category: "Classes", admin: true, instructor: true, coordinator: true, receptionist: false },

  // Academic Progress
  { label: "View Academic Progress", category: "Academic", admin: true, instructor: true, coordinator: true, receptionist: false },
  { label: "Add / Edit Assessments", category: "Academic", admin: true, instructor: true, coordinator: false, receptionist: false },
  { label: "Generate Progress Reports", category: "Academic", admin: true, instructor: true, coordinator: true, receptionist: false },

  // Leads & Marketing
  { label: "View Leads Pipeline", category: "Sales & Marketing", admin: true, instructor: false, coordinator: true, receptionist: true },
  { label: "Manage Leads", category: "Sales & Marketing", admin: true, instructor: false, coordinator: true, receptionist: true },
  { label: "Email Marketing", category: "Sales & Marketing", admin: true, instructor: false, coordinator: true, receptionist: false },
  { label: "WhatsApp Templates", category: "Sales & Marketing", admin: true, instructor: false, coordinator: true, receptionist: true },

  // Contacts
  { label: "View Contacts", category: "Contacts", admin: true, instructor: true, coordinator: true, receptionist: true },
  { label: "Create / Edit Contacts", category: "Contacts", admin: true, instructor: false, coordinator: true, receptionist: true },
  { label: "Log Communications", category: "Contacts", admin: true, instructor: true, coordinator: true, receptionist: true },

  // Finance
  { label: "View Accounting", category: "Finance", admin: true, instructor: false, coordinator: false, receptionist: false },
  { label: "Record Payments", category: "Finance", admin: true, instructor: false, coordinator: false, receptionist: false },
  { label: "View Financial Dashboard", category: "Finance", admin: true, instructor: false, coordinator: false, receptionist: false },
  { label: "Manage Scholarships", category: "Finance", admin: true, instructor: false, coordinator: true, receptionist: false },

  // Programs & Events
  { label: "View Language Packages", category: "Programs & Events", admin: true, instructor: true, coordinator: true, receptionist: true },
  { label: "Manage Camps & Events", category: "Programs & Events", admin: true, instructor: false, coordinator: true, receptionist: false },

  // Admin
  { label: "Manage Users & Roles", category: "Administration", admin: true, instructor: false, coordinator: false, receptionist: false },
  { label: "System Settings", category: "Administration", admin: true, instructor: false, coordinator: false, receptionist: false },
  { label: "Meta Leads & Webhooks", category: "Administration", admin: true, instructor: false, coordinator: false, receptionist: false },
  { label: "Integrations", category: "Administration", admin: true, instructor: false, coordinator: false, receptionist: false },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  coordinator: "Coordinator",
  receptionist: "Receptionist",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Full system access including financial data, user management, and all settings.",
  instructor: "Access to their classes, student progress, attendance, and communications.",
  coordinator: "Manages students, leads, scheduling, events, and marketing campaigns.",
  receptionist: "Front-desk access: view students, manage leads, log communications.",
  user: "Basic access — no specific role assigned yet.",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  instructor: "bg-blue-100 text-blue-700 border-blue-200",
  coordinator: "bg-violet-100 text-violet-700 border-violet-200",
  receptionist: "bg-emerald-100 text-emerald-700 border-emerald-200",
  user: "bg-gray-100 text-gray-600 border-gray-200",
};

function PermissionCell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-4 py-2.5 text-center">
      {allowed ? (
        <Check className="w-4 h-4 text-emerald-600 mx-auto" strokeWidth={2.5} />
      ) : (
        <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" strokeWidth={1.5} />
      )}
    </td>
  );
}

function PermissionsTab() {
  const categories = Array.from(new Set(PERMISSIONS.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Role Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["admin", "instructor", "coordinator", "receptionist"] as Role[]).map((role) => (
          <Card key={role} className="border border-border">
            <CardContent className="p-4">
              <Badge className={`text-xs mb-2 ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
              <p className="text-xs font-semibold mt-2 text-foreground">
                {PERMISSIONS.filter((p) => p[role as keyof Permission] === true).length} permissions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <Card className="border border-border overflow-hidden">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Role Permissions Matrix
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-64">Permission</th>
                <th className="px-4 py-3 text-center font-semibold text-red-700 w-28">Admin</th>
                <th className="px-4 py-3 text-center font-semibold text-blue-700 w-28">Instructor</th>
                <th className="px-4 py-3 text-center font-semibold text-violet-700 w-28">Coordinator</th>
                <th className="px-4 py-3 text-center font-semibold text-emerald-700 w-28">Receptionist</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <>
                  <tr key={`cat-${category}`} className="bg-muted/20 border-y border-border">
                    <td colSpan={5} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {category}
                    </td>
                  </tr>
                  {PERMISSIONS.filter((p) => p.category === category).map((perm) => (
                    <tr key={perm.label} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-sm text-foreground">{perm.label}</td>
                      <PermissionCell allowed={perm.admin} />
                      <PermissionCell allowed={perm.instructor} />
                      <PermissionCell allowed={perm.coordinator} />
                      <PermissionCell allowed={perm.receptionist} />
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users = [], isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const { data: invitations = [], refetch: refetchInvitations } = trpc.admin.listInvitations.useQuery();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "user" as any, message: "" });
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("Role updated successfully"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createInviteMutation = trpc.admin.createInvitation.useMutation({
    onSuccess: (data) => {
      setLastInviteUrl(data.inviteUrl);
      setShowInviteSuccess(true);
      setShowInviteDialog(false);
      setInviteForm({ email: "", role: "user", message: "" });
      refetchInvitations();
      toast.success(`Invitation link created for ${inviteForm.email}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeInviteMutation = trpc.admin.revokeInvitation.useMutation({
    onSuccess: () => { toast.success("Invitation revoked"); refetchInvitations(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteInviteMutation = trpc.admin.deleteInvitation.useMutation({
    onSuccess: () => { toast.success("Invitation deleted"); refetchInvitations(); },
    onError: (e) => toast.error(e.message),
  });

  const pendingInvitations = (invitations as any[]).filter((i: any) => i.status === "pending");
  const pastInvitations = (invitations as any[]).filter((i: any) => i.status !== "pending");

  return (
    <div className="space-y-4">
      {/* Invite Staff Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Invite Staff Member
          </CardTitle>
          <p className="text-xs text-muted-foreground">Send an invitation link to a new team member. They'll click it to access the LIOTA CRM with the role you assign.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label className="text-xs mb-1 block">Email Address *</Label>
              <Input type="email" placeholder="teacher@liota.institute" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="instructor">Instructor — Classes & students</SelectItem>
                  <SelectItem value="coordinator">Coordinator — Students, leads, events</SelectItem>
                  <SelectItem value="receptionist">Receptionist — Front desk</SelectItem>
                  <SelectItem value="user">User — Basic access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={() => { if (!inviteForm.email) { toast.error("Email is required"); return; } createInviteMutation.mutate({ ...inviteForm, origin: window.location.origin }); }} disabled={createInviteMutation.isPending}>
                {createInviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send Invitation
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">An invitation link will be generated (valid for 7 days). Copy and share it via WhatsApp, email, or any channel.</p>
        </CardContent>
      </Card>

      {/* Invite Success Banner */}
      {showInviteSuccess && lastInviteUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Invitation link created!</p>
                <p className="text-xs text-green-700 mt-0.5">Share this link with the invitee. It expires in 7 days.</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-green-100 border border-green-300 rounded px-2 py-1 text-green-900 break-all">{lastInviteUrl}</code>
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs" onClick={() => { navigator.clipboard.writeText(lastInviteUrl); toast.success("Link copied!"); }}>
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="shrink-0 h-7 text-xs" onClick={() => setShowInviteSuccess(false)}>Dismiss</Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex-1 mr-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Role changes take effect immediately. Only <strong>Admin</strong> users can access the Financial Dashboard and Admin Panel.
              See the <strong>Permissions</strong> tab for a full breakdown of what each role can access.
            </p>
          </div>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="shrink-0 gap-2">
          <UserPlus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input type="email" placeholder="colleague@example.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="instructor">Instructor — Classes & students</SelectItem>
                  <SelectItem value="coordinator">Coordinator — Students, leads, events</SelectItem>
                  <SelectItem value="receptionist">Receptionist — Front desk access</SelectItem>
                  <SelectItem value="user">User — Basic access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Personal Message (optional)</Label>
              <Textarea placeholder="Welcome to the LIOTA CRM team! Click the link below to set up your account." value={inviteForm.message} onChange={e => setInviteForm(f => ({ ...f, message: e.target.value }))} rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">An invitation link will be generated (valid for 7 days). Share it with the invitee — they'll click it to access the CRM.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={() => { if (!inviteForm.email) { toast.error("Email is required"); return; } createInviteMutation.mutate({ ...inviteForm, origin: window.location.origin }); }} disabled={createInviteMutation.isPending} className="gap-2">
              {createInviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Generate Invite Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3" style={{display:'none'}}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Role changes take effect immediately. Only <strong>Admin</strong> users can access the Financial Dashboard and Admin Panel.
            See the <strong>Permissions</strong> tab for a full breakdown of what each role can access.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (users as any[]).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No users found.</div>
      ) : (
        <div className="space-y-2">
          {(users as any[]).map((user: any) => (
            <Card key={user.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{(user.name ?? user.email ?? "?")[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.name ?? "Unnamed User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email ?? "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={`text-xs border ${ROLE_COLORS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                    <Select value={user.role} onValueChange={(v) => updateRoleMutation.mutate({ userId: user.id, role: v as any })}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="coordinator">Coordinator</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="user">User (No Role)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                  <span>Last sign-in: {new Date(user.lastSignedIn).toLocaleDateString()}</span>
                  <span className="text-xs text-muted-foreground/70 italic">{ROLE_DESCRIPTIONS[user.role] ?? ""}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingInvitations.map((inv: any) => {
                const daysLeft = Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / 86400000);
                return (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          <Badge className={`text-xs border mr-1 ${ROLE_COLORS[inv.role] ?? "bg-gray-100 text-gray-600"}`}>{ROLE_LABELS[inv.role] ?? inv.role}</Badge>
                          Invited by {inv.invitedByName ?? "Admin"} · Expires in {daysLeft}d
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { const url = `${window.location.origin}/invite/${inv.token}`; navigator.clipboard.writeText(url); toast.success("Invite link copied!"); }}>
                        <Copy className="w-3 h-3" /> Copy Link
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => revokeInviteMutation.mutate({ id: inv.id })} disabled={revokeInviteMutation.isPending}>
                        <Ban className="w-3 h-3" /> Revoke
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Invitations */}
      {pastInvitations.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-4 h-4" /> Past Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pastInvitations.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">{inv.status === "accepted" ? "✅ Accepted" : inv.status === "revoked" ? "🚫 Revoked" : "⏰ Expired"} · {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => deleteInviteMutation.mutate({ id: inv.id })}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Summary */}
      <Card className="border border-border mt-6">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {(["admin", "instructor", "coordinator", "receptionist", "user"] as Role[]).map((role) => {
              const count = (users as any[]).filter((u: any) => u.role === role).length;
              return (
                <div key={role} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs border ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role] ?? role}</Badge>
                    <span className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{count} {count === 1 ? "member" : "members"}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── System Settings Tab ──────────────────────────────────────────────────────

function SystemSettingsTab() {
  const { language, toggleLanguage } = useLanguage();
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [showPinForm, setShowPinForm] = useState(false);

  const updatePinMutation = trpc.admin.updateFinancialPin.useMutation({
    onSuccess: () => {
      toast.success("Financial PIN updated successfully");
      setShowPinForm(false);
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handlePinUpdate = () => {
    if (pinForm.newPin !== pinForm.confirmPin) { toast.error("PINs do not match"); return; }
    if (pinForm.newPin.length !== 4) { toast.error("PIN must be exactly 4 digits"); return; }
    updatePinMutation.mutate({ currentPin: pinForm.currentPin, newPin: pinForm.newPin });
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" /> Language Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Interface Language</p>
              <p className="text-xs text-muted-foreground mt-0.5">Current: {language === "en" ? "English" : "Spanish"}</p>
            </div>
            <Button variant="outline" onClick={toggleLanguage} className="gap-2">
              <Globe className="w-4 h-4" />
              Switch to {language === "en" ? "Español" : "English"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> Financial Dashboard PIN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The Financial Dashboard is protected by a 4-digit PIN. Only Admin users can access it.
            Change the PIN regularly for security.
          </p>
          {!showPinForm ? (
            <Button variant="outline" onClick={() => setShowPinForm(true)} className="gap-2">
              <Edit2 className="w-4 h-4" /> Change Financial PIN
            </Button>
          ) : (
            <div className="space-y-3 max-w-xs">
              <div className="space-y-1.5">
                <Label>Current PIN</Label>
                <Input type="password" maxLength={4} value={pinForm.currentPin}
                  onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, "") })}
                  placeholder="••••" className="font-mono tracking-widest text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label>New PIN (4 digits)</Label>
                <Input type="password" maxLength={4} value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, "") })}
                  placeholder="••••" className="font-mono tracking-widest text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New PIN</Label>
                <Input type="password" maxLength={4} value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "") })}
                  placeholder="••••" className="font-mono tracking-widest text-center text-lg" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPinForm(false)}>Cancel</Button>
                <Button onClick={handlePinUpdate} disabled={updatePinMutation.isPending || pinForm.newPin.length !== 4}>
                  {updatePinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update PIN
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" /> Campus & Program Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold mb-2">Active Campuses</p>
              <div className="space-y-1.5">
                {CAMPUSES.map((campus) => (
                  <div key={campus} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{campus}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Active Programs</p>
              <div className="space-y-1.5">
                {PROGRAMS.map((prog) => (
                  <div key={prog} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{prog}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── System Info Tab ──────────────────────────────────────────────────────────

function SystemInfoTab() {
  const { data: stats, isLoading } = trpc.admin.systemStats.useQuery();

  const items = stats ? [
    { label: "Total Users", value: (stats as any).totalUsers ?? 0, icon: <Users className="w-4 h-4" />, color: "text-blue-600" },
    { label: "Total Students", value: (stats as any).totalStudents ?? 0, icon: <Users className="w-4 h-4" />, color: "text-green-600" },
    { label: "Total Leads", value: (stats as any).totalLeads ?? 0, icon: <Activity className="w-4 h-4" />, color: "text-amber-600" },
    { label: "Total Payments", value: (stats as any).totalPayments ?? 0, icon: <Database className="w-4 h-4" />, color: "text-violet-600" },
    { label: "Total Campaigns", value: (stats as any).totalCampaigns ?? 0, icon: <Activity className="w-4 h-4" />, color: "text-pink-600" },
    { label: "Total Classes", value: (stats as any).totalClasses ?? 0, icon: <Database className="w-4 h-4" />, color: "text-cyan-600" },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.map((item) => (
          <Card key={item.label} className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={item.color}>{item.icon}</span>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { label: "Application", value: "LIOTA CRM v2.0" },
              { label: "Organization", value: "Language Institute Of The Americas" },
              { label: "Stack", value: "React 19 + tRPC + MySQL" },
              { label: "Campuses", value: "Mérida · Dallas · Denver · Vienna · Online" },
              { label: "Payment Methods", value: "Stripe · Zelle · Dolla App · PayPal · Cash · Bank Transfer" },
              { label: "Languages", value: "English / Spanish" },
              { label: "Roles", value: "Admin · Instructor · Coordinator · Receptionist · User" },
            ].map((info) => (
              <div key={info.label} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground w-36 shrink-0">{info.label}</span>
                <span className="font-medium">{info.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user?.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="border border-red-200 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-foreground mb-2">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              The Admin Panel is only accessible to users with the <strong>Admin</strong> role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" /> Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          System administration, user management, role permissions, and configuration
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="w-4 h-4" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> Users & Roles
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="w-4 h-4" /> System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SystemSettingsTab />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <SystemInfoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
