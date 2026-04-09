import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Shield, Users, Settings, Database, Activity, Loader2, Edit2, CheckCircle, AlertTriangle, Globe, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

const CAMPUSES = ["Mérida", "Dallas", "Denver", "Vienna", "Online"];
const PROGRAMS = ["Children", "Teenagers", "Adults", "Business English", "ESL", "SSL", "Polyglot"];

function UsersTab() {
  const { data: users = [], isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    editor: "bg-blue-100 text-blue-700",
    user: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">Role changes take effect immediately. Admins have full access including the PIN-protected Financial Dashboard. Editors cannot access financial data.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
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
                    <Badge className={`text-xs ${roleColors[user.role] ?? ""}`}>{user.role}</Badge>
                    <Select value={user.role} onValueChange={(v) => updateRoleMutation.mutate({ userId: user.id, role: v as any })}>
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                  <span>Last sign-in: {new Date(user.lastSignedIn).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemSettingsTab() {
  const { language, toggleLanguage } = useLanguage();
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "", confirmPin: "" });
  const [showPinForm, setShowPinForm] = useState(false);

  const updatePinMutation = trpc.admin.updateFinancialPin.useMutation({
    onSuccess: () => { toast.success("Financial PIN updated successfully"); setShowPinForm(false); setPinForm({ currentPin: "", newPin: "", confirmPin: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const handlePinUpdate = () => {
    if (pinForm.newPin !== pinForm.confirmPin) { toast.error("PINs do not match"); return; }
    if (pinForm.newPin.length !== 4) { toast.error("PIN must be exactly 4 digits"); return; }
    updatePinMutation.mutate({ currentPin: pinForm.currentPin, newPin: pinForm.newPin });
  };

  return (
    <div className="space-y-6">
      {/* Language Settings */}
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

      {/* Financial PIN */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> Financial Dashboard PIN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">The Financial Dashboard is protected by a 4-digit PIN. Only admin users can access it. Change the PIN regularly for security.</p>
          {!showPinForm ? (
            <Button variant="outline" onClick={() => setShowPinForm(true)} className="gap-2">
              <Edit2 className="w-4 h-4" /> Change Financial PIN
            </Button>
          ) : (
            <div className="space-y-3 max-w-xs">
              <div className="space-y-1.5">
                <Label>Current PIN</Label>
                <Input type="password" maxLength={4} value={pinForm.currentPin} onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, "") })} placeholder="••••" className="font-mono tracking-widest text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label>New PIN (4 digits)</Label>
                <Input type="password" maxLength={4} value={pinForm.newPin} onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, "") })} placeholder="••••" className="font-mono tracking-widest text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New PIN</Label>
                <Input type="password" maxLength={4} value={pinForm.confirmPin} onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, "") })} placeholder="••••" className="font-mono tracking-widest text-center text-lg" />
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

      {/* Campus & Program Config */}
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
          <div className="col-span-3 flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
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
              { label: "Application", value: "LIOTA CRM v1.0" },
              { label: "Organization", value: "Language Institute Of The Americas" },
              { label: "Stack", value: "React 19 + tRPC + MySQL" },
              { label: "Campuses", value: "Mérida · Dallas · Denver · Vienna · Online" },
              { label: "Payment Methods", value: "Stripe · Zelle · Dolla App · PayPal · Cash · Bank Transfer" },
              { label: "Languages", value: "English / Spanish" },
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
            <p className="text-sm text-muted-foreground">The Admin Panel is only accessible to users with the <strong>Admin</strong> role.</p>
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
        <p className="text-sm text-muted-foreground mt-0.5">System administration, user management, and configuration</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-3">
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
