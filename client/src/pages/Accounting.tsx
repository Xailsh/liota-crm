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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CreditCard, Plus, DollarSign, TrendingDown, Clock, CheckCircle, Loader2, Receipt, Building } from "lucide-react";

const paymentStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
};
const paymentStatusLabels: Record<string, string> = { pending: "Pending", completed: "Completed", failed: "Failed", refunded: "Refunded" };
const methodLabels: Record<string, string> = { paypal: "PayPal", card: "Credit/Debit Card", cash: "Cash", transfer: "Bank Transfer", stripe: "Stripe", zelle: "Zelle", dolla: "Dolla App (MX)" };
const methodIcons: Record<string, string> = { paypal: "🅿️", card: "💳", cash: "💵", transfer: "🏦", stripe: "⚡", zelle: "💜", dolla: "🇲🇽" };
const campusLabels: Record<string, string> = { merida: "Mérida", dallas: "Dallas", denver: "Denver", vienna: "Vienna", online: "Online", general: "General" };

const emptyPaymentForm = { studentId: "", programId: "", amount: "", currency: "USD", method: "stripe" as const, status: "pending" as const, description: "", invoiceNumber: "", dueDate: "" };
const emptyExpenseForm = { category: "", description: "", amount: "", currency: "USD", campus: "general" as const, date: new Date().toISOString().split("T")[0] };

export default function Accounting() {
  const [tab, setTab] = useState("payments");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ ...emptyPaymentForm });
  const [expenseForm, setExpenseForm] = useState({ ...emptyExpenseForm });

  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = trpc.payments.list.useQuery({ status: paymentStatus });
  const { data: expenses = [], isLoading: loadingExpenses, refetch: refetchExpenses } = trpc.expenses.list.useQuery({});
  const { data: students = [] } = trpc.students.list.useQuery({});
  const { data: programs = [] } = trpc.programs.list.useQuery();

  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => { toast.success("Payment recorded"); setShowPaymentForm(false); setPaymentForm({ ...emptyPaymentForm }); refetchPayments(); },
    onError: (e) => toast.error(e.message),
  });
  const updatePaymentMutation = trpc.payments.update.useMutation({
    onSuccess: () => { toast.success("Payment updated"); refetchPayments(); },
    onError: (e) => toast.error(e.message),
  });
  const createExpenseMutation = trpc.expenses.create.useMutation({
    onSuccess: () => { toast.success("Expense recorded"); setShowExpenseForm(false); setExpenseForm({ ...emptyExpenseForm }); refetchExpenses(); },
    onError: (e) => toast.error(e.message),
  });

  const totalRevenue = payments.filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pendingRevenue = payments.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  const getStudentName = (id: number) => { const s = students.find((s: any) => s.id === id); return s ? `${s.firstName} ${s.lastName}` : `#${id}`; };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Accounting
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Payments, invoices, expenses, and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExpenseForm(true)} className="gap-2">
            <TrendingDown className="w-4 h-4" /> Record Expense
          </Button>
          <Button onClick={() => setShowPaymentForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Collected Revenue", value: totalRevenue, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Receivables", value: pendingRevenue, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
          { label: "Net Profit", value: totalRevenue - totalExpenses, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <Card key={s.label} className="border border-border card-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>${s.value.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
          {tab === "payments" && (
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(paymentStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="payments" className="mt-4 space-y-3">
          {loadingPayments ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : payments.length === 0 ? (
            <Card className="border border-dashed border-border">
              <CardContent className="py-12 text-center">
                <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">No payments recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((p: any) => (
              <Card key={p.id} className="border border-border card-shadow hover:card-shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-base">
                        {methodIcons[p.method] ?? "💰"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{p.description ?? `Payment #${p.id}`}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">{getStudentName(p.studentId)}</p>
                          {p.invoiceNumber && <span className="text-xs text-muted-foreground">· {p.invoiceNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-foreground">${Number(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{p.currency} · {methodLabels[p.method]}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs border ${paymentStatusColors[p.status] ?? ""}`}>
                        {paymentStatusLabels[p.status] ?? p.status}
                      </Badge>
                      {p.status === "pending" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updatePaymentMutation.mutate({ id: p.id, status: "completed", paidAt: new Date().toISOString() })}>
                          <CheckCircle className="w-3 h-3" /> Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-3">
          {loadingExpenses ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : expenses.length === 0 ? (
            <Card className="border border-dashed border-border">
              <CardContent className="py-12 text-center">
                <TrendingDown className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground">No expenses recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            expenses.map((e: any) => (
              <Card key={e.id} className="border border-border card-shadow hover:card-shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{e.description ?? e.category}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">{e.category}</Badge>
                          <span className="text-xs text-muted-foreground">{campusLabels[e.campus] ?? e.campus}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-red-600">-${Number(e.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{e.currency} · {new Date(e.date).toLocaleDateString("en-US")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Payment Form */}
      <Dialog open={showPaymentForm} onOpenChange={(o) => { if (!o) setShowPaymentForm(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Student *</Label>
              <Select value={paymentForm.studentId} onValueChange={(v) => setPaymentForm({ ...paymentForm, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="299.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method *</Label>
              <Select value={paymentForm.method} onValueChange={(v: any) => setPaymentForm({ ...paymentForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">⚡ Stripe</SelectItem>
                  <SelectItem value="zelle">💜 Zelle</SelectItem>
                  <SelectItem value="dolla">🇲🇽 Dolla App (Mexico)</SelectItem>
                  <SelectItem value="paypal">🅿️ PayPal</SelectItem>
                  <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="transfer">🏦 Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={paymentForm.status} onValueChange={(v: any) => setPaymentForm({ ...paymentForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Invoice #</Label>
              <Input value={paymentForm.invoiceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, invoiceNumber: e.target.value })} placeholder="INV-2026-001" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={paymentForm.description} onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })} placeholder="e.g. Adult English Program - April 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={paymentForm.dueDate} onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentForm(false)}>Cancel</Button>
            <Button onClick={() => createPaymentMutation.mutate({ ...paymentForm, studentId: Number(paymentForm.studentId) } as any)} disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Form */}
      <Dialog open={showExpenseForm} onOpenChange={(o) => { if (!o) setShowExpenseForm(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Input value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} placeholder="Rent, Salaries, Marketing..." />
            </div>
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="1200.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Campus</Label>
              <Select value={expenseForm.campus} onValueChange={(v: any) => setExpenseForm({ ...expenseForm, campus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(campusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Expense description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseForm(false)}>Cancel</Button>
            <Button onClick={() => createExpenseMutation.mutate(expenseForm as any)} disabled={createExpenseMutation.isPending}>
              {createExpenseMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Record Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
