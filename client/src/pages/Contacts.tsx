import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Contact, Plus, Search, Mail, Phone, Tag, MessageSquare, Loader2, Edit2, Trash2, User, X } from "lucide-react";

const contactTypeLabels: Record<string, string> = { parent: "Padre/Madre", student: "Estudiante", lead: "Prospecto", other: "Otro" };
const contactTypeColors: Record<string, string> = {
  parent: "bg-blue-100 text-blue-700 border-blue-200",
  student: "bg-emerald-100 text-emerald-700 border-emerald-200",
  lead: "bg-amber-100 text-amber-700 border-amber-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const emptyForm = { firstName: "", lastName: "", email: "", phone: "", contactType: "parent" as const, company: "", notes: "", tags: "" };
const emptyCommForm = { contactId: 0, type: "email" as const, subject: "", body: "", direction: "outbound" as const };

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [contactType, setContactType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showCommForm, setShowCommForm] = useState(false);
  const [commForm, setCommForm] = useState({ ...emptyCommForm });
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const { data: contacts = [], isLoading, refetch } = trpc.contacts.list.useQuery({ search, type: contactType !== "all" ? contactType : undefined });
  const { data: communications = [] } = trpc.contacts.communications.list.useQuery(
    { contactId: selectedContact?.id ?? 0 },
    { enabled: !!selectedContact }
  );

  const createMutation = trpc.contacts.create.useMutation({
    onSuccess: () => { toast.success("Contacto creado"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.contacts.update.useMutation({
    onSuccess: () => { toast.success("Contacto actualizado"); setShowForm(false); setEditId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => { toast.success("Contacto eliminado"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createCommMutation = trpc.contacts.communications.create.useMutation({
    onSuccess: () => { toast.success("Comunicación registrada"); setShowCommForm(false); setCommForm({ ...emptyCommForm }); },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (c: any) => {
    setForm({ firstName: c.firstName, lastName: c.lastName, email: c.email ?? "", phone: c.phone ?? "", contactType: c.contactType, company: c.company ?? "", notes: c.notes ?? "", tags: c.tags ?? "" });
    setEditId(c.id);
    setShowForm(true);
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Contact className="w-6 h-6 text-primary" /> Contactos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Padres, estudiantes y prospectos — historial de comunicaciones</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setEditId(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo Contacto
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-border card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar contacto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={contactType} onValueChange={setContactType}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(contactTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || contactType !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setContactType("all"); }} className="gap-1 h-9 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : contacts.length === 0 ? (
        <Card className="border border-dashed border-border">
          <CardContent className="py-16 text-center">
            <Contact className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No se encontraron contactos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contacts.map((c: any) => (
            <Card key={c.id} className="border border-border card-shadow hover:card-shadow-lg transition-all group cursor-pointer" onClick={() => setSelectedContact(c)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{c.firstName[0]}{c.lastName[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{c.firstName} {c.lastName}</p>
                      {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); openEdit(c); }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className={`text-xs border ${contactTypeColors[c.contactType] ?? ""}`}>
                    {contactTypeLabels[c.contactType] ?? c.contactType}
                  </Badge>
                  {c.tags && c.tags.split(",").slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                      <Tag className="w-2.5 h-2.5 mr-1" />{tag.trim()}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {c.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 flex-shrink-0" /><span>{c.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Detail Dialog */}
      {selectedContact && (
        <Dialog open={!!selectedContact} onOpenChange={(o) => { if (!o) setSelectedContact(null); }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{selectedContact.firstName[0]}{selectedContact.lastName[0]}</span>
                </div>
                {selectedContact.firstName} {selectedContact.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-xs border ${contactTypeColors[selectedContact.contactType]}`}>
                  {contactTypeLabels[selectedContact.contactType]}
                </Badge>
              </div>
              {selectedContact.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{selectedContact.email}</div>}
              {selectedContact.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{selectedContact.phone}</div>}
              {selectedContact.notes && <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">{selectedContact.notes}</div>}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Historial de Comunicaciones</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setCommForm({ ...emptyCommForm, contactId: selectedContact.id }); setShowCommForm(true); }}>
                    <Plus className="w-3 h-3" /> Agregar
                  </Button>
                </div>
                {communications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sin comunicaciones registradas</p>
                ) : (
                  <div className="space-y-2">
                    {communications.map((comm: any) => (
                      <div key={comm.id} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">{comm.type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(comm.createdAt).toLocaleDateString("es-MX")}</span>
                        </div>
                        {comm.subject && <p className="text-sm font-medium">{comm.subject}</p>}
                        {comm.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{comm.body}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedContact(null)}>Cerrar</Button>
              <Button onClick={() => { openEdit(selectedContact); setSelectedContact(null); }}>Editar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Communication Form */}
      <Dialog open={showCommForm} onOpenChange={(o) => { if (!o) setShowCommForm(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Comunicación</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={commForm.type} onValueChange={(v: any) => setCommForm({ ...commForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Teléfono</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="in_person">Presencial</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Asunto</Label><Input value={commForm.subject} onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Contenido</Label><Textarea value={commForm.body} onChange={(e) => setCommForm({ ...commForm, body: e.target.value })} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommForm(false)}>Cancelar</Button>
            <Button onClick={() => createCommMutation.mutate(commForm as any)} disabled={createCommMutation.isPending}>
              {createCommMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>Nombre *</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Apellido *</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Tipo de Contacto</Label>
              <Select value={form.contactType} onValueChange={(v: any) => setForm({ ...form, contactType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(contactTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Empresa / Organización</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Etiquetas</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="padre,activo,vip (separadas por comas)" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => editId ? updateMutation.mutate({ id: editId, ...form }) : createMutation.mutate(form as any)} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editId ? "Guardar" : "Crear Contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar contacto?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate({ id: deleteId! })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
