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
import { Star, Plus, Loader2, Calendar, MapPin, Users, DollarSign, Globe, GraduationCap, Music, Trophy } from "lucide-react";

const typeIcons: Record<string, any> = {
  cultural: Globe, competition: Trophy, graduation: GraduationCap, open_house: Users,
  workshop: Star, webinar: Globe, parent_meeting: Users, holiday: Music,
  fundraiser: DollarSign, other: Star,
};
const typeColors: Record<string, string> = {
  cultural: "bg-violet-100 text-violet-700", competition: "bg-amber-100 text-amber-700",
  graduation: "bg-emerald-100 text-emerald-700", open_house: "bg-blue-100 text-blue-700",
  workshop: "bg-rose-100 text-rose-700", webinar: "bg-cyan-100 text-cyan-700",
  parent_meeting: "bg-orange-100 text-orange-700", holiday: "bg-pink-100 text-pink-700",
  fundraiser: "bg-lime-100 text-lime-700", other: "bg-gray-100 text-gray-600",
};
const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700", open: "bg-emerald-100 text-emerald-700",
  full: "bg-red-100 text-red-700", in_progress: "bg-violet-100 text-violet-700",
  completed: "bg-gray-100 text-gray-600", cancelled: "bg-red-50 text-red-400",
};

export default function SpecialEvents() {
  const [open, setOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({
    name: "", type: "cultural", date: "", startTime: "", endTime: "",
    campus: "online", capacity: "", priceUSD: "0", priceMXN: "0",
    isFree: true, description: "", status: "upcoming",
  });

  const { data: eventsList, isLoading, refetch } = trpc.events.list.useQuery(
    typeFilter !== "all" ? { type: typeFilter } : {}
  );
  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => { toast.success("Event created!"); setOpen(false); refetch(); resetForm(); },
    onError: (e: any) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.events.update.useMutation({
    onSuccess: () => { toast.success("Event updated"); refetch(); },
  });

  const resetForm = () => setForm({
    name: "", type: "cultural", date: "", startTime: "", endTime: "",
    campus: "online", capacity: "", priceUSD: "0", priceMXN: "0",
    isFree: true, description: "", status: "upcoming",
  });

  const handleSubmit = () => {
    if (!form.name || !form.date) return toast.error("Name and date are required");
    createMutation.mutate({
      name: form.name, type: form.type as any, date: form.date,
      startTime: form.startTime || undefined, endTime: form.endTime || undefined,
      campus: form.campus as any,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      priceUSD: form.isFree ? 0 : Number(form.priceUSD),
      priceMXN: form.isFree ? 0 : Number(form.priceMXN),
      isFree: form.isFree, description: form.description || undefined,
      status: form.status as any,
    });
  };

  const upcomingEvents = (eventsList ?? []).filter((e: any) => ["upcoming", "open"].includes(e.status));
  const pastEvents = (eventsList ?? []).filter((e: any) => ["completed", "cancelled"].includes(e.status));
  const activeEvents = (eventsList ?? []).filter((e: any) => e.status === "in_progress");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" /> Special Events
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Graduations, workshops, cultural events, and more</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Special Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Event Name *</Label>
                  <Input className="mt-1" placeholder="e.g. Spring Graduation Ceremony 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cultural">Cultural Event</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="graduation">Graduation</SelectItem>
                      <SelectItem value="open_house">Open House</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="parent_meeting">Parent Meeting</SelectItem>
                      <SelectItem value="holiday">Holiday Event</SelectItem>
                      <SelectItem value="fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>Date *</Label>
                  <Input className="mt-1" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input className="mt-1" type="number" placeholder="Unlimited" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input className="mt-1" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input className="mt-1" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
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
              <div className="flex items-center gap-3">
                <Switch checked={form.isFree} onCheckedChange={(v) => setForm({ ...form, isFree: v })} />
                <Label className="cursor-pointer">Free Event</Label>
              </div>
              {!form.isFree && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Price (USD)</Label>
                    <Input className="mt-1" type="number" value={form.priceUSD} onChange={(e) => setForm({ ...form, priceUSD: e.target.value })} />
                  </div>
                  <div>
                    <Label>Price (MXN)</Label>
                    <Input className="mt-1" type="number" value={form.priceMXN} onChange={(e) => setForm({ ...form, priceMXN: e.target.value })} />
                  </div>
                </div>
              )}
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1" rows={2} placeholder="Event description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Event
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All Types" },
          { value: "graduation", label: "🎓 Graduations" },
          { value: "cultural", label: "🌎 Cultural" },
          { value: "workshop", label: "🛠 Workshops" },
          { value: "competition", label: "🏆 Competitions" },
          { value: "open_house", label: "🏠 Open House" },
          { value: "webinar", label: "💻 Webinars" },
        ].map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={typeFilter === t.value ? "default" : "outline"}
            onClick={() => setTypeFilter(t.value)}
            className="text-xs"
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (eventsList ?? []).length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Star className="w-16 h-16 text-muted-foreground/20 mx-auto" />
          <p className="text-muted-foreground">No events scheduled. Create your first special event!</p>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create First Event
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" /> Happening Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeEvents.map((event: any) => <EventCard key={event.id} event={event} onUpdate={updateMutation.mutate} />)}
              </div>
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming Events ({upcomingEvents.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event: any) => <EventCard key={event.id} event={event} onUpdate={updateMutation.mutate} />)}
              </div>
            </div>
          )}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Past Events ({pastEvents.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 opacity-70">
                {pastEvents.map((event: any) => <EventCard key={event.id} event={event} onUpdate={updateMutation.mutate} compact />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onUpdate, compact = false }: { event: any; onUpdate: (args: any) => void; compact?: boolean }) {
  const TypeIcon = typeIcons[event.type] ?? Star;
  return (
    <Card className="border border-border card-shadow hover:shadow-md transition-shadow">
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="secondary" className={`text-xs ${typeColors[event.type] ?? ""}`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {event.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Badge>
              <Badge variant="secondary" className={`text-xs ${statusColors[event.status] ?? ""}`}>
                {event.status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Badge>
              {event.isFree && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">Free</Badge>}
            </div>
            <p className="font-semibold text-foreground text-sm leading-tight">{event.name}</p>
          </div>
        </div>
        {!compact && event.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{new Date(event.date).toLocaleDateString()}{event.startTime ? ` · ${event.startTime}` : ""}{event.endTime ? ` – ${event.endTime}` : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="capitalize">{event.campus}</span>
          </div>
          {event.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{event.registeredCount ?? 0} / {event.capacity} registered</span>
            </div>
          )}
          {!event.isFree && (event.priceUSD > 0 || event.priceMXN > 0) && (
            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                {event.priceUSD > 0 ? `$${Number(event.priceUSD).toLocaleString()} USD` : ""}
                {event.priceUSD > 0 && event.priceMXN > 0 ? " · " : ""}
                {event.priceMXN > 0 ? `$${Number(event.priceMXN).toLocaleString()} MXN` : ""}
              </span>
            </div>
          )}
        </div>
        {!compact && event.status === "upcoming" && (
          <Button
            size="sm"
            className="w-full mt-3 h-7 text-xs"
            onClick={() => onUpdate({ id: event.id, data: { status: "open" } })}
          >
            Open Registration
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
