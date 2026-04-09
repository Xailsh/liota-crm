import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link2, Plus, Edit2, Trash2, Loader2, Copy, CheckCircle, Zap, Globe, Shield, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { nanoid } from "nanoid";

const sourceColors: Record<string, string> = {
  meta: "bg-blue-50 text-blue-700 border-blue-200",
  whatsapp: "bg-green-50 text-green-700 border-green-200",
  stripe: "bg-violet-50 text-violet-700 border-violet-200",
  zapier: "bg-orange-50 text-orange-700 border-orange-200",
  make: "bg-pink-50 text-pink-700 border-pink-200",
  custom: "bg-gray-50 text-gray-700 border-gray-200",
};

const sourceIcons: Record<string, string> = {
  meta: "📘",
  whatsapp: "💬",
  stripe: "💳",
  zapier: "⚡",
  make: "🔄",
  custom: "🔗",
};

type FormState = {
  name: string;
  source: "meta"|"whatsapp"|"stripe"|"zapier"|"make"|"custom";
  endpointToken: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "", source: "meta", endpointToken: "", description: "", isActive: true,
};

export default function Integrations() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const { data: webhooks = [], isLoading, refetch } = trpc.inboundWebhooks.list.useQuery();
  const createMutation = trpc.inboundWebhooks.create.useMutation({
    onSuccess: () => { toast.success("Webhook created"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.inboundWebhooks.update.useMutation({
    onSuccess: () => { toast.success("Webhook updated"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.inboundWebhooks.delete.useMutation({
    onSuccess: () => { toast.success("Webhook deleted"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (editId) updateMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };

  const openEdit = (wh: any) => {
    setForm({ name: wh.name, source: wh.source, endpointToken: wh.endpointToken, description: wh.description ?? "", isActive: wh.isActive ?? true });
    setEditId(wh.id);
    setShowForm(true);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhook/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Webhook URL copied to clipboard");
  };

  const generateToken = () => {
    setForm({ ...form, endpointToken: nanoid(32) });
  };

  const toggleActive = (wh: any) => {
    updateMutation.mutate({ id: wh.id, data: { isActive: !wh.isActive } });
  };

  const activeCount = (webhooks as any[]).filter((w: any) => w.isActive).length;
  const totalReceived = (webhooks as any[]).reduce((s: number, w: any) => s + (w.totalReceived ?? 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link2 className="w-6 h-6 text-violet-600" /> Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage inbound webhooks and external service connections</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm, endpointToken: nanoid(32) }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Webhook
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Webhooks", value: (webhooks as any[]).length, color: "text-violet-600" },
          { label: "Active", value: activeCount, color: "text-green-600" },
          { label: "Total Received", value: totalReceived.toLocaleString(), color: "text-blue-600" },
          { label: "Sources", value: new Set((webhooks as any[]).map((w: any) => w.source)).size, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { source: "meta", name: "Meta / Facebook", desc: "Capture leads from Facebook & Instagram ads automatically", status: "Configure" },
          { source: "whatsapp", name: "WhatsApp Business", desc: "Receive and respond to WhatsApp messages from students", status: "Configure" },
          { source: "stripe", name: "Stripe Payments", desc: "Sync payment events and subscription updates from Stripe", status: "Configure" },
          { source: "zapier", name: "Zapier", desc: "Connect LIOTA CRM with 5,000+ apps via Zapier automation", status: "Configure" },
          { source: "make", name: "Make (Integromat)", desc: "Advanced automation workflows with Make scenarios", status: "Configure" },
          { source: "custom", name: "Custom Webhook", desc: "Create custom webhook endpoints for any integration", status: "Configure" },
        ].map((integration) => {
          const existingWebhook = (webhooks as any[]).find((w: any) => w.source === integration.source);
          return (
            <Card key={integration.source} className="border border-border hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sourceIcons[integration.source]}</span>
                    <div>
                      <p className="font-semibold text-sm">{integration.name}</p>
                      <Badge variant="outline" className={`text-xs border ${sourceColors[integration.source] ?? ""}`}>{integration.source}</Badge>
                    </div>
                  </div>
                  {existingWebhook && (
                    <div className={`w-2 h-2 rounded-full mt-1 ${existingWebhook.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{integration.desc}</p>
                {existingWebhook ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Received: {existingWebhook.totalReceived ?? 0}</span>
                      <Switch checked={existingWebhook.isActive ?? true} onCheckedChange={() => toggleActive(existingWebhook)} />
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => copyToken(existingWebhook.endpointToken)}>
                      {copiedToken === existingWebhook.endpointToken ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      Copy Webhook URL
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => {
                    setForm({ name: `${integration.name} Webhook`, source: integration.source as any, endpointToken: nanoid(32), description: integration.desc, isActive: true });
                    setEditId(null);
                    setShowForm(true);
                  }}>
                    <Plus className="w-3 h-3" /> {integration.status}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Webhooks List */}
      {(webhooks as any[]).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Configured Webhooks</h2>
          <div className="space-y-3">
            {(webhooks as any[]).map((wh: any) => (
              <Card key={wh.id} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xl">{sourceIcons[wh.source] ?? "🔗"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{wh.name}</p>
                          <Badge variant="outline" className={`text-xs border ${sourceColors[wh.source] ?? ""}`}>{wh.source}</Badge>
                          <Badge className={`text-xs ${wh.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {wh.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {window.location.origin}/api/webhook/{wh.endpointToken}
                        </p>
                        {wh.description && <p className="text-xs text-muted-foreground mt-0.5">{wh.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{wh.totalReceived ?? 0} received</span>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => copyToken(wh.endpointToken)}>
                        {copiedToken === wh.endpointToken ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      <Switch checked={wh.isActive ?? true} onCheckedChange={() => toggleActive(wh)} />
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(wh)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => setDeleteId(wh.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Webhook" : "New Inbound Webhook"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Meta Leads Webhook" />
            </div>
            <div className="space-y-1.5">
              <Label>Source *</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["meta","whatsapp","stripe","zapier","make","custom"].map(s => (
                    <SelectItem key={s} value={s}>{sourceIcons[s]} {s.replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint Token *</Label>
              <div className="flex gap-2">
                <Input value={form.endpointToken} onChange={(e) => setForm({ ...form, endpointToken: e.target.value })} placeholder="Unique token" className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={generateToken} title="Generate new token">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {form.endpointToken && (
                <p className="text-xs text-muted-foreground font-mono bg-muted rounded p-2 break-all">
                  {window.location.origin}/api/webhook/{form.endpointToken}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.endpointToken || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editId ? "Save Changes" : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Webhook</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete the webhook endpoint. Any services sending to this URL will stop working.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
