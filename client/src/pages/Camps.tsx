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
import { toast } from "sonner";
import { Tent, Plus, Loader2, Calendar, MapPin, Users, DollarSign, Sun, Snowflake, Leaf, Flower } from "lucide-react";

const seasonIcons: Record<string, any> = {
  winter: Snowflake, spring: Flower, summer: Sun, fall: Leaf,
};
const seasonColors: Record<string, string> = {
  winter: "bg-blue-100 text-blue-700 border-blue-200",
  spring: "bg-pink-100 text-pink-700 border-pink-200",
  summer: "bg-amber-100 text-amber-700 border-amber-200",
  fall: "bg-orange-100 text-orange-700 border-orange-200",
};
const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700", open: "bg-emerald-100 text-emerald-700",
  full: "bg-red-100 text-red-700", in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-gray-100 text-gray-600", cancelled: "bg-red-50 text-red-400",
};

export default function Camps() {
  const [open, setOpen] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [form, setForm] = useState({
    name: "", season: "summer", year: String(new Date().getFullYear()),
    startDate: "", endDate: "", campus: "online", ageGroup: "mixed",
    capacity: "20", priceUSD: "", priceMXN: "", description: "", highlights: "", status: "upcoming",
  });

  const { data: campsList, isLoading, refetch } = trpc.camps.list.useQuery(
    seasonFilter !== "all" ? { season: seasonFilter } : {}
  );
  const createMutation = trpc.camps.create.useMutation({
    onSuccess: () => { toast.success("Camp created!"); setOpen(false); refetch(); resetForm(); },
    onError: (e: any) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.camps.update.useMutation({
    onSuccess: () => { toast.success("Camp updated"); refetch(); },
  });

  const resetForm = () => setForm({
    name: "", season: "summer", year: String(new Date().getFullYear()),
    startDate: "", endDate: "", campus: "online", ageGroup: "mixed",
    capacity: "20", priceUSD: "", priceMXN: "", description: "", highlights: "", status: "upcoming",
  });

  const handleSubmit = () => {
    if (!form.name || !form.startDate || !form.endDate) return toast.error("Name and dates are required");
    createMutation.mutate({
      name: form.name, season: form.season as any, year: Number(form.year),
      startDate: form.startDate, endDate: form.endDate, campus: form.campus as any,
      ageGroup: form.ageGroup as any, capacity: Number(form.capacity),
      priceUSD: form.priceUSD ? Number(form.priceUSD) : undefined,
      priceMXN: form.priceMXN ? Number(form.priceMXN) : undefined,
      description: form.description || undefined, highlights: form.highlights || undefined,
      status: form.status as any,
    });
  };

  const grouped = {
    winter: (campsList ?? []).filter((c: any) => c.season === "winter"),
    spring: (campsList ?? []).filter((c: any) => c.season === "spring"),
    summer: (campsList ?? []).filter((c: any) => c.season === "summer"),
    fall: (campsList ?? []).filter((c: any) => c.season === "fall"),
  };

  const seasons = seasonFilter === "all" ? ["summer", "winter", "spring", "fall"] : [seasonFilter];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tent className="w-6 h-6 text-primary" /> Seasonal Camps
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Winter, Spring, Summer &amp; Fall language camps</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Camp</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Seasonal Camp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Camp Name *</Label>
                  <Input className="mt-1" placeholder="e.g. Summer English Immersion 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Season *</Label>
                  <Select value={form.season} onValueChange={(v) => setForm({ ...form, season: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winter">❄️ Winter</SelectItem>
                      <SelectItem value="spring">🌸 Spring</SelectItem>
                      <SelectItem value="summer">☀️ Summer</SelectItem>
                      <SelectItem value="fall">🍂 Fall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Input className="mt-1" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input className="mt-1" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input className="mt-1" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <Label>Campus</Label>
                  <Select value={form.campus} onValueChange={(v) => setForm({ ...form, campus: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merida">Mérida</SelectItem>
                      <SelectItem value="dallas">Dallas</SelectItem>
                      <SelectItem value="denver">Denver</SelectItem>
                      <SelectItem value="vienna">Vienna</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="all">All Campuses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Age Group</Label>
                  <Select value={form.ageGroup} onValueChange={(v) => setForm({ ...form, ageGroup: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kids">Kids</SelectItem>
                      <SelectItem value="teens">Teens</SelectItem>
                      <SelectItem value="adults">Adults</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input className="mt-1" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div>
                  <Label>Price (USD)</Label>
                  <Input className="mt-1" type="number" placeholder="0.00" value={form.priceUSD} onChange={(e) => setForm({ ...form, priceUSD: e.target.value })} />
                </div>
                <div>
                  <Label>Price (MXN)</Label>
                  <Input className="mt-1" type="number" placeholder="0.00" value={form.priceMXN} onChange={(e) => setForm({ ...form, priceMXN: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="open">Open for Registration</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" rows={2} placeholder="Camp description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <Label>Highlights (comma-separated)</Label>
                <Input className="mt-1" placeholder="e.g. Cultural activities, Field trips, Certificates" value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Camp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Season Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All Seasons" },
          { value: "winter", label: "❄️ Winter" },
          { value: "spring", label: "🌸 Spring" },
          { value: "summer", label: "☀️ Summer" },
          { value: "fall", label: "🍂 Fall" },
        ].map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={seasonFilter === s.value ? "default" : "outline"}
            onClick={() => setSeasonFilter(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (campsList ?? []).length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Tent className="w-16 h-16 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground">No camps scheduled yet. Create your first seasonal camp!</p>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create First Camp
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {seasons.map((season) => {
            const camps = grouped[season as keyof typeof grouped] ?? (campsList ?? []);
            const SeasonIcon = seasonIcons[season] ?? Tent;
            if (camps.length === 0) return null;
            return (
              <div key={season}>
                <div className="flex items-center gap-2 mb-4">
                  <SeasonIcon className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-foreground capitalize">{season} Camps</h2>
                  <Badge variant="secondary" className="text-xs">{camps.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {camps.map((camp: any) => (
                    <Card key={camp.id} className="border border-border card-shadow hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className={`text-xs border ${seasonColors[camp.season] ?? ""}`}>
                                {camp.season.charAt(0).toUpperCase() + camp.season.slice(1)}
                              </Badge>
                              <Badge variant="secondary" className={`text-xs ${statusColors[camp.status] ?? ""}`}>
                                {camp.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </Badge>
                            </div>
                            <p className="font-semibold text-foreground text-sm leading-tight">{camp.name}</p>
                          </div>
                        </div>
                        {camp.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{camp.description}</p>}
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{new Date(camp.startDate).toLocaleDateString()} – {new Date(camp.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="capitalize">{camp.campus}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{camp.enrolledCount ?? 0} / {camp.capacity} students · {camp.ageGroup}</span>
                          </div>
                          {(camp.priceUSD || camp.priceMXN) && (
                            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>
                                {camp.priceUSD ? `$${Number(camp.priceUSD).toLocaleString()} USD` : ""}
                                {camp.priceUSD && camp.priceMXN ? " · " : ""}
                                {camp.priceMXN ? `$${Number(camp.priceMXN).toLocaleString()} MXN` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                        {camp.status === "upcoming" && (
                          <Button
                            size="sm"
                            className="w-full mt-3 h-7 text-xs"
                            onClick={() => updateMutation.mutate({ id: camp.id, data: { status: "open" } })}
                          >
                            Open Registration
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
