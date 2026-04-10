import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BookOpen, Plus, Loader2, DollarSign, Clock, Globe, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const PRESET_PACKAGES = [
  { name: "Single Language - Starter", type: "single_language", languages: 1, hours: 20, priceUSD: 400, priceMXN: 8000, description: "20 hours of instruction in one language. Perfect for beginners." },
  { name: "Single Language - Standard", type: "single_language", languages: 1, hours: 40, priceUSD: 750, priceMXN: 15000, description: "40 hours of instruction. Recommended for intermediate learners." },
  { name: "Dual Language Package", type: "dual_language", languages: 2, hours: 40, priceUSD: 1200, priceMXN: 24000, description: "Learn two languages simultaneously with 20 hours each." },
  { name: "ESL - English as Second Language", type: "esl", languages: 1, hours: 60, priceUSD: 1000, priceMXN: 20000, description: "Intensive English program for non-native speakers." },
  { name: "SSL - Spanish as Second Language", type: "ssl", languages: 1, hours: 60, priceUSD: 1000, priceMXN: 20000, description: "Intensive Spanish program for non-native speakers." },
  { name: "Polyglot Package - 3 Languages", type: "polyglot", languages: 3, hours: 60, priceUSD: 1800, priceMXN: 36000, description: "Master three languages with expert instructors." },
  { name: "Full Polyglot Immersion", type: "full_polyglot", languages: 4, hours: 120, priceUSD: 3200, priceMXN: 64000, description: "Complete immersion in 4 languages. Our most comprehensive offering." },
  { name: "Business English Intensive", type: "business", languages: 1, hours: 30, priceUSD: 700, priceMXN: 14000, description: "Professional English for business communication and presentations." },
];

const typeColors: Record<string, string> = {
  single_language: "bg-blue-100 text-blue-700", dual_language: "bg-violet-100 text-violet-700",
  esl: "bg-emerald-100 text-emerald-700", ssl: "bg-amber-100 text-amber-700",
  polyglot: "bg-rose-100 text-rose-700", full_polyglot: "bg-purple-100 text-purple-700",
  business: "bg-slate-100 text-slate-700", custom: "bg-gray-100 text-gray-700",
};

export default function LanguagePackages() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "single_language", description: "", priceUSD: "", priceMXN: "",
    totalHours: "", sessionsPerWeek: "", sessionDurationMinutes: "60",
    languagesIncluded: "1", isActive: true, isOnline: true, isOnsite: true,
  });

  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'sales';

  const { data: packages, isLoading, refetch } = trpc.packages.list.useQuery({});
  const createMutation = trpc.packages.create.useMutation({
    onSuccess: () => { toast.success("Package created!"); setOpen(false); refetch(); },
    onError: (e: any) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.packages.update.useMutation({
    onSuccess: () => { toast.success("Package updated"); refetch(); },
  });

  const handlePreset = (preset: typeof PRESET_PACKAGES[0]) => {
    setForm({
      name: preset.name, type: preset.type, description: preset.description,
      priceUSD: String(preset.priceUSD), priceMXN: String(preset.priceMXN),
      totalHours: String(preset.hours), sessionsPerWeek: "2", sessionDurationMinutes: "60",
      languagesIncluded: String(preset.languages), isActive: true, isOnline: true, isOnsite: true,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.priceUSD) return toast.error("Name and USD price are required");
    // Map form type to router enum
    const typeMap: Record<string, string> = {
      single_language: "one_language", dual_language: "two_language",
      esl: "esl", ssl: "ssl", polyglot: "polyglot", full_polyglot: "full_package",
      business: "business_english", custom: "custom",
    };
    createMutation.mutate({
      name: form.name,
      type: (typeMap[form.type] ?? form.type) as any,
      description: form.description || undefined,
      priceUSD: Number(form.priceUSD),
      priceMXN: form.priceMXN ? Number(form.priceMXN) : undefined,
      totalHours: form.totalHours ? Number(form.totalHours) : 20,
      sessionsPerWeek: form.sessionsPerWeek ? Number(form.sessionsPerWeek) : 2,
      sessionDurationMin: Number(form.sessionDurationMinutes),
      languages: form.languagesIncluded,
      isActive: form.isActive,
    });
  };

  const activePackages = (packages ?? []).filter((p: any) => p.isActive);
  const inactivePackages = (packages ?? []).filter((p: any) => !p.isActive);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Language Packages &amp; Rates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage course packages, pricing, and hourly rates</p>
        </div>
        {canEdit && <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Package</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Language Package</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Package Name *</Label>
                  <Input className="mt-1" placeholder="e.g. ESL Intensive 60h" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_language">Single Language</SelectItem>
                      <SelectItem value="dual_language">Dual Language</SelectItem>
                      <SelectItem value="esl">ESL</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="polyglot">Polyglot (3 langs)</SelectItem>
                      <SelectItem value="full_polyglot">Full Polyglot (4+ langs)</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Languages Included</Label>
                  <Input className="mt-1" type="number" min="1" max="6" value={form.languagesIncluded} onChange={(e) => setForm({ ...form, languagesIncluded: e.target.value })} />
                </div>
                <div>
                  <Label>Price (USD) *</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input className="pl-7" type="number" placeholder="0.00" value={form.priceUSD} onChange={(e) => setForm({ ...form, priceUSD: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Price (MXN)</Label>
                  <Input className="mt-1" type="number" placeholder="0.00" value={form.priceMXN} onChange={(e) => setForm({ ...form, priceMXN: e.target.value })} />
                </div>
                <div>
                  <Label>Total Hours</Label>
                  <Input className="mt-1" type="number" placeholder="e.g. 40" value={form.totalHours} onChange={(e) => setForm({ ...form, totalHours: e.target.value })} />
                </div>
                <div>
                  <Label>Sessions/Week</Label>
                  <Input className="mt-1" type="number" placeholder="e.g. 2" value={form.sessionsPerWeek} onChange={(e) => setForm({ ...form, sessionsPerWeek: e.target.value })} />
                </div>
                <div>
                  <Label>Session Duration (min)</Label>
                  <Select value={form.sessionDurationMinutes} onValueChange={(v) => setForm({ ...form, sessionDurationMinutes: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min (1 hr)</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min (2 hr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" rows={2} placeholder="Package description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.isOnline} onCheckedChange={(v) => setForm({ ...form, isOnline: v })} />
                  <Label className="cursor-pointer">Online</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isOnsite} onCheckedChange={(v) => setForm({ ...form, isOnsite: v })} />
                  <Label className="cursor-pointer">On-Site</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  <Label className="cursor-pointer">Active</Label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Package
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>}
      </div>

      {/* Hourly Rates Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 card-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">USA Rate</p>
                <p className="text-xs text-muted-foreground">Dallas · Denver · Vienna</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">$20 <span className="text-base font-normal text-muted-foreground">USD/hour</span></p>
            <p className="text-xs text-muted-foreground mt-1">Per student · Group max 6 students</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 card-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-200 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Mexico Rate</p>
                <p className="text-xs text-muted-foreground">Mérida · Online MX</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-700">$200 <span className="text-base font-normal text-muted-foreground">MXN/hour</span></p>
            <p className="text-xs text-muted-foreground mt-1">Per student · Groups max. 6 students</p>
          </CardContent>
        </Card>
      </div>

      {/* Preset Packages */}
      {(packages ?? []).length === 0 && (
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Quick-Start Preset Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Click any preset to pre-fill the form and create it quickly.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_PACKAGES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePreset(preset)}
                  className="text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Badge variant="secondary" className={`text-xs mb-2 ${typeColors[preset.type] ?? ""}`}>
                    {preset.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                  <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">{preset.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{preset.hours}h</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{preset.languages} lang</span>
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">${preset.priceUSD.toLocaleString()} USD</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Packages */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {activePackages.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Packages ({activePackages.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePackages.map((pkg: any) => (
                  <Card key={pkg.id} className="border border-border card-shadow hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <Badge variant="secondary" className={`text-xs mb-1.5 ${typeColors[pkg.type] ?? ""}`}>
                            {pkg.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </Badge>
                          <p className="font-semibold text-foreground text-sm leading-tight">{pkg.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => updateMutation.mutate({ id: pkg.id, data: { isActive: false } })}
                        >×</Button>
                      </div>
                      {pkg.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pkg.description}</p>}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">USD Price</span>
                          <span className="font-bold text-primary">${Number(pkg.priceUSD).toLocaleString()}</span>
                        </div>
                        {pkg.priceMXN && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">MXN Price</span>
                            <span className="font-semibold text-emerald-600">${Number(pkg.priceMXN).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          {pkg.totalHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pkg.totalHours}h total</span>}
                          {pkg.languagesIncluded > 1 && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{pkg.languagesIncluded} languages</span>}
                          {pkg.isOnline && <Badge variant="outline" className="text-xs h-4 px-1">Online</Badge>}
                          {pkg.isOnsite && <Badge variant="outline" className="text-xs h-4 px-1">On-Site</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {activePackages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm">No packages yet. Use the presets above or create a custom one.</p>
            </div>
          )}
          {inactivePackages.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Inactive Packages ({inactivePackages.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {inactivePackages.map((pkg: any) => (
                  <Card key={pkg.id} className="border border-border opacity-60 card-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">${Number(pkg.priceUSD).toLocaleString()} USD</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateMutation.mutate({ id: pkg.id, data: { isActive: true } })}>
                        Reactivate
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
