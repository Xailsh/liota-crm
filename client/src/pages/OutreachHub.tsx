import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail, MessageCircle, Facebook, Instagram, Youtube, Linkedin, Twitter, Video,
  Edit2, Trash2, CheckCircle, XCircle, RefreshCw, Globe, Eye, EyeOff,
  Send, Clock, BarChart2, Zap
} from "lucide-react";

const PLATFORMS = [
  { id: "email", label: "Email (Resend)", icon: Mail, color: "bg-blue-500", description: "Send bulk emails via Resend from contact@liota.institute" },
  { id: "whatsapp", label: "WhatsApp Business", icon: MessageCircle, color: "bg-green-500", description: "Send messages via WhatsApp Business API" },
  { id: "meta", label: "Meta / Facebook", icon: Facebook, color: "bg-blue-600", description: "Facebook Lead Ads, Messenger, Facebook Pages" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-pink-500", description: "Instagram DMs and story replies" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "bg-black", description: "TikTok for Business messaging" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-red-500", description: "YouTube channel management and comments" },
  { id: "x", label: "X (Twitter)", icon: Twitter, color: "bg-gray-900", description: "X/Twitter DMs and mentions" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-700", description: "LinkedIn company page and InMail" },
];

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-100 text-green-800 border-green-200",
  disconnected: "bg-gray-100 text-gray-600 border-gray-200",
  error: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  connected: <CheckCircle className="w-3 h-3" />,
  disconnected: <XCircle className="w-3 h-3" />,
  error: <XCircle className="w-3 h-3" />,
  pending: <Clock className="w-3 h-3" />,
};

type PlatformId = "email" | "whatsapp" | "meta" | "instagram" | "tiktok" | "youtube" | "x" | "linkedin";

interface CredentialForm {
  platform: PlatformId;
  handle: string;
  appId: string;
  appSecret: string;
  accessToken: string;
  refreshToken: string;
  pageId: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  notes: string;
}

const EMPTY_FORM: CredentialForm = {
  platform: "email",
  handle: "",
  appId: "",
  appSecret: "",
  accessToken: "",
  refreshToken: "",
  pageId: "",
  phoneNumberId: "",
  webhookVerifyToken: "",
  notes: "",
};

export default function OutreachHub() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [showDialog, setShowDialog] = useState(false);
  const [editPlatform, setEditPlatform] = useState<PlatformId | null>(null);
  const [form, setForm] = useState<CredentialForm>(EMPTY_FORM);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const { data: credentials = [], refetch } = trpc.socialCredentials.list.useQuery();
  const upsertMutation = trpc.socialCredentials.upsert.useMutation({
    onSuccess: () => { refetch(); setShowDialog(false); toast.success("Credentials saved successfully."); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.socialCredentials.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Platform credentials removed."); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMutation = trpc.socialCredentials.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const credentialMap = new Map(credentials.map(c => [c.platform, c]));

  function openEdit(platformId: PlatformId) {
    const existing = credentialMap.get(platformId);
    setEditPlatform(platformId);
    setForm({
      platform: platformId,
      handle: existing?.handle ?? "",
      appId: existing?.appId ?? "",
      appSecret: existing?.appSecret ?? "",
      accessToken: existing?.accessToken ?? "",
      refreshToken: existing?.refreshToken ?? "",
      pageId: existing?.pageId ?? "",
      phoneNumberId: existing?.phoneNumberId ?? "",
      webhookVerifyToken: existing?.webhookVerifyToken ?? "",
      notes: existing?.notes ?? "",
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (!form.platform) return;
    upsertMutation.mutate({
      platform: form.platform,
      handle: form.handle || undefined,
      appId: form.appId || undefined,
      appSecret: form.appSecret || undefined,
      accessToken: form.accessToken || undefined,
      refreshToken: form.refreshToken || undefined,
      pageId: form.pageId || undefined,
      phoneNumberId: form.phoneNumberId || undefined,
      webhookVerifyToken: form.webhookVerifyToken || undefined,
      notes: form.notes || undefined,
    });
  }

  function toggleSecret(key: string) {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const connectedCount = credentials.filter(c => c.status === "connected").length;
  const totalPlatforms = PLATFORMS.length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Outreach Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all your social media and messaging platform connections in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
            {connectedCount} / {totalPlatforms} Connected
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Connected</p>
                <p className="text-xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg"><XCircle className="w-5 h-5 text-gray-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Disconnected</p>
                <p className="text-xl font-bold">{totalPlatforms - connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Globe className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Platforms</p>
                <p className="text-xl font-bold">{totalPlatforms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><Send className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Channels Ready</p>
                <p className="text-xl font-bold">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Platform Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORMS.map((platform) => {
            const cred = credentialMap.get(platform.id as PlatformId);
            const status = cred?.status ?? "disconnected";
            const Icon = platform.icon;
            return (
              <Card key={platform.id} className={`relative overflow-hidden transition-all hover:shadow-md ${status === "connected" ? "ring-1 ring-green-200" : ""}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl text-white ${platform.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge className={`text-xs flex items-center gap-1 border ${STATUS_COLORS[status]}`} variant="outline">
                      {STATUS_ICONS[status]}
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{platform.label}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{platform.description}</p>
                  {cred?.handle && (
                    <p className="text-xs text-blue-600 font-mono mb-2 truncate">@{cred.handle}</p>
                  )}
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => openEdit(platform.id as PlatformId)}>
                        <Edit2 className="w-3 h-3 mr-1" />
                        {cred ? "Edit" : "Connect"}
                      </Button>
                      {cred && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 text-red-500 hover:text-red-700"
                          onClick={() => deleteMutation.mutate({ id: cred.id })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Admin access required to configure</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Credentials Table */}
      {credentials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Platforms — Credentials Overview</CardTitle>
            <CardDescription>Configured platform credentials. Sensitive values are masked.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Platform</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Handle / Account</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">App ID</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Access Token</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Last Verified</th>
                    {isAdmin && <th className="text-left py-2 px-3 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((cred) => {
                    const platform = PLATFORMS.find(p => p.id === cred.platform);
                    const Icon = platform?.icon ?? Globe;
                    const showToken = showSecrets[`token_${cred.id}`];
                    return (
                      <tr key={cred.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded text-white ${platform?.color ?? "bg-gray-400"}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="font-medium">{platform?.label ?? cred.platform}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                          {cred.handle ? `@${cred.handle}` : "—"}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-mono text-xs">
                          {cred.appId ? `${cred.appId.slice(0, 8)}...` : "—"}
                        </td>
                        <td className="py-2 px-3">
                          {cred.accessToken ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {showToken ? cred.accessToken.slice(0, 20) + "..." : "••••••••••••••••"}
                              </span>
                              <button onClick={() => toggleSecret(`token_${cred.id}`)} className="text-muted-foreground hover:text-foreground">
                                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-2 px-3">
                          <Badge className={`text-xs flex items-center gap-1 w-fit border ${STATUS_COLORS[cred.status]}`} variant="outline">
                            {STATUS_ICONS[cred.status]}
                            {cred.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">
                          {cred.lastVerifiedAt ? new Date(cred.lastVerifiedAt).toLocaleDateString() : "Never"}
                        </td>
                        {isAdmin && (
                          <td className="py-2 px-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(cred.platform as PlatformId)}>
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => updateStatusMutation.mutate({ id: cred.id, status: cred.status === "connected" ? "disconnected" : "connected" })}
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => deleteMutation.mutate({ id: cred.id })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            Platform Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Email (Resend) — Already Connected</p>
              <p className="text-muted-foreground text-xs">Domain liota.institute is verified. Emails send from contact@liota.institute.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-1"><MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp Business API</p>
              <p className="text-muted-foreground text-xs">Requires Meta Business Account → WhatsApp Business API → Phone Number ID + Access Token.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-1"><Facebook className="w-4 h-4 text-blue-600" /> Meta / Facebook Lead Ads</p>
              <p className="text-muted-foreground text-xs">Requires Meta App ID, App Secret, Page Access Token with leads_retrieval permission. Form ID: 1652859402713081.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-1"><Instagram className="w-4 h-4 text-pink-500" /> Instagram</p>
              <p className="text-muted-foreground text-xs">Connect via Meta Business Suite. Requires Instagram Business Account linked to Facebook Page.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Connect Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editPlatform ? `Configure ${PLATFORMS.find(p => p.id === editPlatform)?.label}` : "Connect Platform"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="handle">Handle / Username</Label>
                <Input id="handle" placeholder="@liotainstitute" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="appId">App ID / Client ID</Label>
                <Input id="appId" placeholder="123456789" value={form.appId} onChange={e => setForm(f => ({ ...f, appId: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="appSecret">App Secret / Client Secret</Label>
              <Input id="appSecret" type="password" placeholder="••••••••" value={form.appSecret} onChange={e => setForm(f => ({ ...f, appSecret: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="accessToken">Access Token / API Key</Label>
              <Textarea id="accessToken" placeholder="EAABx..." rows={2} value={form.accessToken} onChange={e => setForm(f => ({ ...f, accessToken: e.target.value }))} className="font-mono text-xs" />
            </div>
            <div>
              <Label htmlFor="refreshToken">Refresh Token (optional)</Label>
              <Input id="refreshToken" type="password" placeholder="Optional" value={form.refreshToken} onChange={e => setForm(f => ({ ...f, refreshToken: e.target.value }))} />
            </div>
            {(form.platform === "meta" || form.platform === "instagram") && (
              <div>
                <Label htmlFor="pageId">Page ID</Label>
                <Input id="pageId" placeholder="Facebook Page ID" value={form.pageId} onChange={e => setForm(f => ({ ...f, pageId: e.target.value }))} />
              </div>
            )}
            {form.platform === "whatsapp" && (
              <div>
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input id="phoneNumberId" placeholder="WhatsApp Phone Number ID" value={form.phoneNumberId} onChange={e => setForm(f => ({ ...f, phoneNumberId: e.target.value }))} />
              </div>
            )}
            <div>
              <Label htmlFor="webhookVerifyToken">Webhook Verify Token (optional)</Label>
              <Input id="webhookVerifyToken" placeholder="my_verify_token" value={form.webhookVerifyToken} onChange={e => setForm(f => ({ ...f, webhookVerifyToken: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Any notes about this connection..." rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Saving..." : "Save Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
