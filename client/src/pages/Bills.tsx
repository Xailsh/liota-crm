import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreditCard, Plus, CheckCircle2, Bell, BellOff, Trash2, Edit2,
  AlertTriangle, Clock, XCircle, RefreshCw, Filter, DollarSign,
  Building2, Loader2, ToggleLeft, ToggleRight, ChevronDown
} from "lucide-react";
import LiotaLayout from "@/components/LiotaLayout";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "rent", label: "🏢 Rent" },
  { value: "utilities", label: "💡 Utilities" },
  { value: "software", label: "💻 Software" },
  { value: "payroll", label: "👥 Payroll" },
  { value: "insurance", label: "🛡️ Insurance" },
  { value: "marketing", label: "📣 Marketing" },
  { value: "supplies", label: "📦 Supplies" },
  { value: "taxes", label: "🏛️ Taxes" },
  { value: "subscriptions", label: "🔄 Subscriptions" },
  { value: "maintenance", label: "🔧 Maintenance" },
  { value: "other", label: "📌 Other" },
];

const CAMPUSES = [
  { value: "all", label: "All Campuses" },
  { value: "merida", label: "Mérida" },
  { value: "dallas", label: "Dallas" },
  { value: "denver", label: "Denver" },
  { value: "vienna", label: "Vienna" },
  { value: "nottingham", label: "Nottingham" },
  { value: "online", label: "Online" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "MXN"];
const FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "one_time", label: "One Time" },
];

function getDaysUntilDue(nextDueDate: Date | string) {
  const due = new Date(nextDueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusBadge(status: string, daysUntilDue: number) {
  if (status === "disabled") return <Badge variant="secondary" className="gap-1"><XCircle className="w-3 h-3" />Disabled</Badge>;
  if (status === "overdue" || daysUntilDue < 0) return <Badge className="gap-1 bg-red-500 text-white"><AlertTriangle className="w-3 h-3" />Overdue {Math.abs(daysUntilDue)}d</Badge>;
  if (daysUntilDue <= 1) return <Badge className="gap-1 bg-orange-500 text-white"><Clock className="w-3 h-3" />Due Tomorrow</Badge>;
  if (daysUntilDue <= 3) return <Badge className="gap-1 bg-yellow-500 text-white"><Clock className="w-3 h-3" />Due in {daysUntilDue}d</Badge>;
  if (daysUntilDue <= 7) return <Badge className="gap-1 bg-blue-500 text-white"><Bell className="w-3 h-3" />Due in {daysUntilDue}d</Badge>;
  return <Badge variant="outline" className="gap-1 text-green-600 border-green-300"><CheckCircle2 className="w-3 h-3" />Due {new Date(new Date().getTime() + daysUntilDue * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    rent: "🏢", utilities: "💡", software: "💻", payroll: "👥",
    insurance: "🛡️", marketing: "📣", supplies: "📦", taxes: "🏛️",
    subscriptions: "🔄", maintenance: "🔧", other: "📌",
  };
  return icons[category] || "📌";
}

type Bill = {
  id: number;
  name: string;
  category: string;
  amount: string;
  currency: string;
  campus: string;
  frequency: string;
  dueDayOfMonth: number;
  nextDueDate: Date | string;
  lastPaidDate: Date | string | null;
  status: string;
  notes: string | null;
  vendor: string | null;
  isPreset: boolean | null;
  remindersEnabled: boolean | null;
};

export default function Bills() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", category: "other" as any, amount: "", currency: "USD",
    campus: "all", frequency: "monthly" as any, dueDayOfMonth: 1,
    notes: "", vendor: "",
  });

  const { data: metrics, refetch: refetchMetrics } = trpc.bills.getMetrics.useQuery();
  const { data: bills = [], refetch, isLoading } = trpc.bills.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    campus: campusFilter !== "all" ? campusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const createBill = trpc.bills.create.useMutation({
    onSuccess: () => { toast.success("Bill added successfully"); refetch(); setShowAddDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateBill = trpc.bills.update.useMutation({
    onSuccess: () => { toast.success("Bill updated"); refetch(); setEditBill(null); },
    onError: (e) => toast.error(e.message),
  });
  const markPaid = trpc.bills.markPaid.useMutation({
    onSuccess: () => { toast.success("Bill marked as paid! Next cycle scheduled."); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const disableBill = trpc.bills.disable.useMutation({
    onSuccess: () => { toast.success("Bill disabled"); refetch(); },
  });
  const enableBill = trpc.bills.enable.useMutation({
    onSuccess: () => { toast.success("Bill re-enabled"); refetch(); },
  });
  const deleteBill = trpc.bills.delete.useMutation({
    onSuccess: () => { toast.success("Bill deleted"); refetch(); },
  });
  const checkReminders = trpc.bills.checkReminders.useMutation({
    onSuccess: (data) => toast.success(`Reminder check complete: ${data.notified} notifications sent`),
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ name: "", category: "other", amount: "", currency: "USD", campus: "all", frequency: "monthly", dueDayOfMonth: 1, notes: "", vendor: "" });
  }

  function getNextDueDate(day: number) {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    if (d <= now) d.setMonth(d.getMonth() + 1);
    return d;
  }

  function handleCreate() {
    if (!form.name || !form.amount) return toast.error("Name and amount are required");
    createBill.mutate({ ...form, nextDueDate: getNextDueDate(form.dueDayOfMonth) });
  }

  function handleUpdate() {
    if (!editBill) return;
    updateBill.mutate({ id: editBill.id, name: editBill.name, amount: editBill.amount, currency: editBill.currency, notes: editBill.notes || "", vendor: editBill.vendor || "" });
  }

  // Summary stats
  const activeBills = bills.filter(b => b.status !== "disabled");
  const overdueBills = bills.filter(b => b.status === "overdue" || getDaysUntilDue(b.nextDueDate) < 0);
  const dueSoonBills = bills.filter(b => { const d = getDaysUntilDue(b.nextDueDate); return d >= 0 && d <= 7 && b.status !== "disabled"; });
  const totalMonthly = bills
    .filter(b => b.status !== "disabled" && b.frequency === "monthly")
    .reduce((sum, b) => sum + (b.currency === "USD" ? Number(b.amount) : 0), 0);

  return (
    <LiotaLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-blue-600" />
              LIOTA Bills & Recurring Expenses
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track mandatory payments with automatic reminders 7, 3, 1 day before and 3 days after due
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => checkReminders.mutate()} disabled={checkReminders.isPending}>
              {checkReminders.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Check Reminders
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Bill
            </Button>
          </div>
        </div>

        {/* ── Financial Dashboard Panel ── */}
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Active Bills</p>
              <p className="text-3xl font-bold">{metrics?.totalActive ?? activeBills.length}</p>
              <p className="text-xs text-muted-foreground">{bills.length} total registered</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-red-600 uppercase tracking-wide font-medium">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{metrics?.totalOverdue ?? overdueBills.length}</p>
              <p className="text-xs text-red-500">Requires immediate attention</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-amber-700 uppercase tracking-wide font-medium">Due in 7 Days</p>
              <p className="text-3xl font-bold text-amber-700">{metrics?.totalUpcoming7Days ?? dueSoonBills.length}</p>
              <p className="text-xs text-amber-600">Upcoming payments</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-xs text-green-700 uppercase tracking-wide font-medium">Paid This Month</p>
              <p className="text-3xl font-bold text-green-700">{metrics?.totalPaidThisMonth ?? 0}</p>
              <p className="text-xs text-green-600">Completed payments</p>
            </div>
          </div>

          {/* Currency Totals */}
          {metrics?.byCurrency && Object.keys(metrics.byCurrency).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(metrics.byCurrency).map(([cur, vals]) => (
                <div key={cur} className="bg-card border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-2">{cur} Monthly Commitment</p>
                  <p className="text-xl font-bold">{cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : ""}{(vals as any).total?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-sm font-normal text-muted-foreground">{cur}</span></p>
                  <div className="mt-2 space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-600">Pending</span>
                      <span className="font-medium">{cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : ""}{(vals as any).pending?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Paid</span>
                      <span className="font-medium">{cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : ""}{(vals as any).paid?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    {(vals as any).overdue > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-red-600">Overdue</span>
                        <span className="font-medium text-red-600">{cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : ""}{(vals as any).overdue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts Row */}
          {metrics && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Donut Chart — By Category */}
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4">Expenses by Category</h3>
                {metrics.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={metrics.byCategory}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {metrics.byCategory.map((_, i) => (
                          <Cell key={i} fill={[
                            "#3b82f6","#f59e0b","#10b981","#8b5cf6",
                            "#ef4444","#06b6d4","#f97316","#84cc16",
                            "#ec4899","#6366f1","#14b8a6","#a78bfa"
                          ][i % 12]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Amount"]} />
                      <Legend formatter={(v) => {
                        const icons: Record<string,string> = { rent:"🏢",utilities:"💡",software:"💻",payroll:"👥",insurance:"🛡️",marketing:"📣",supplies:"📦",taxes:"🏛️",subscriptions:"🔄",maintenance:"🔧",other:"📌" };
                        return `${icons[v] || ""} ${v}`;
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-10">No data available</p>}
              </div>

              {/* Bar Chart — By Campus */}
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4">Expenses by Campus (USD)</h3>
                {metrics.byCampus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={metrics.byCampus} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v) => v === "all" ? "Shared" : v.charAt(0).toUpperCase() + v.slice(1)} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Total"]} labelFormatter={(l) => l === "all" ? "Shared (All Campuses)" : l.charAt(0).toUpperCase() + l.slice(1)} />
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {metrics.byCampus.map((_, i) => (
                          <Cell key={i} fill={[
                            "#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316"
                          ][i % 7]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-10">No data available</p>}
              </div>
            </div>
          )}

          {/* Upcoming Bills in 7 Days */}
          {metrics && metrics.upcoming7Days.length > 0 && (
            <div className="bg-card border rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Upcoming Bills — Next 7 Days
              </h3>
              <div className="divide-y">
                {metrics.upcoming7Days.map(b => {
                  const days = getDaysUntilDue(b.nextDueDate);
                  const sym = b.currency === "USD" ? "$" : b.currency === "EUR" ? "€" : b.currency === "GBP" ? "£" : "";
                  return (
                    <div key={b.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(b.category || "")}</span>
                        <div>
                          <p className="text-sm font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.campus === "all" ? "All Campuses" : b.campus} · Due {new Date(b.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{sym}{Number(b.amount).toLocaleString()} {b.currency}</p>
                        <p className={`text-xs font-medium ${days <= 1 ? "text-orange-600" : days <= 3 ? "text-yellow-600" : "text-blue-600"}`}>
                          {days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `In ${days} days`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-card border rounded-xl p-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={campusFilter} onValueChange={setCampusFilter}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Campus" />
            </SelectTrigger>
            <SelectContent>
              {CAMPUSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(statusFilter !== "all" || campusFilter !== "all" || categoryFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setCampusFilter("all"); setCategoryFilter("all"); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Bills Table */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : bills.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No bills found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bill</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Campus</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Frequency</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Due Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const daysUntilDue = getDaysUntilDue(bill.nextDueDate);
                  const isExpanded = expandedId === bill.id;
                  const rowBg = bill.status === "disabled" ? "opacity-50" :
                    (bill.status === "overdue" || daysUntilDue < 0) ? "bg-red-50/50" :
                    daysUntilDue <= 1 ? "bg-orange-50/50" :
                    daysUntilDue <= 3 ? "bg-yellow-50/30" : "";
                  return (
                    <>
                      <tr key={bill.id} className={`border-b hover:bg-muted/30 transition-colors ${rowBg}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(bill.category)}</span>
                            <div>
                              <p className="font-medium">{bill.name}</p>
                              <p className="text-xs text-muted-foreground">{bill.vendor || bill.category}</p>
                            </div>
                            {bill.isPreset && <Badge variant="outline" className="text-xs ml-1">Preset</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Badge variant="secondary" className="text-xs capitalize">{bill.campus}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground capitalize">{bill.frequency}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {bill.currency} {Number(bill.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(bill.status, daysUntilDue)}</td>
                        <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground text-xs">
                          {new Date(bill.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {bill.status !== "disabled" && (
                              <Button
                                size="sm" variant="outline"
                                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                onClick={() => markPaid.mutate({ id: bill.id })}
                                disabled={markPaid.isPending}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpandedId(isExpanded ? null : bill.id)}>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${bill.id}-expanded`} className="border-b bg-muted/20">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="flex flex-wrap gap-6 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                <p>{bill.notes || "—"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Last Paid</p>
                                <p>{bill.lastPaidDate ? new Date(bill.lastPaidDate).toLocaleDateString() : "Never"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Reminders</p>
                                <p>{bill.remindersEnabled ? "✅ Enabled" : "❌ Disabled"}</p>
                              </div>
                              <div className="flex items-center gap-2 ml-auto">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditBill(bill as Bill)}>
                                  <Edit2 className="w-3 h-3 mr-1" /> Edit
                                </Button>
                                {bill.status === "disabled" ? (
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600" onClick={() => enableBill.mutate({ id: bill.id })}>
                                    <ToggleRight className="w-3 h-3 mr-1" /> Enable
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => disableBill.mutate({ id: bill.id })}>
                                    <ToggleLeft className="w-3 h-3 mr-1" /> Disable
                                  </Button>
                                )}
                                {!bill.isPreset && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300" onClick={() => { if (confirm("Delete this bill?")) deleteBill.mutate({ id: bill.id }); }}>
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Reminder Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Automatic Reminder Schedule</p>
              <p className="mt-1 text-blue-700">
                Admin notifications are sent automatically: <strong>7 days before</strong> due date, <strong>3 days before</strong>, <strong>1 day before</strong>, and <strong>3 days after</strong> if still unpaid (marked overdue). Click "Check Reminders" to trigger manually, or set up a daily cron job for fully automatic operation.
              </p>
            </div>
          </div>
        </div>

        {/* Add Bill Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add New Bill
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Bill Name *</label>
                  <Input placeholder="e.g. Office Rent - Mérida" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category *</label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.filter(c => c.value !== "all").map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Campus</label>
                  <Select value={form.campus} onValueChange={v => setForm(f => ({ ...f, campus: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CAMPUSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount *</label>
                  <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Frequency</label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Due Day of Month</label>
                  <Input type="number" min={1} max={31} value={form.dueDayOfMonth} onChange={e => setForm(f => ({ ...f, dueDayOfMonth: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Vendor / Payee</label>
                  <Input placeholder="e.g. CFE, Google, Landlord" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <Textarea placeholder="Additional details..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 h-20" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createBill.isPending}>
                {createBill.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Add Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bill Dialog */}
        {editBill && (
          <Dialog open={!!editBill} onOpenChange={() => setEditBill(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5" /> Edit Bill
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Bill Name</label>
                    <Input value={editBill.name} onChange={e => setEditBill(b => b ? { ...b, name: e.target.value } : b)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Amount</label>
                    <Input type="number" value={editBill.amount} onChange={e => setEditBill(b => b ? { ...b, amount: e.target.value } : b)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Currency</label>
                    <Select value={editBill.currency} onValueChange={v => setEditBill(b => b ? { ...b, currency: v } : b)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Vendor / Payee</label>
                    <Input value={editBill.vendor || ""} onChange={e => setEditBill(b => b ? { ...b, vendor: e.target.value } : b)} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Notes</label>
                    <Textarea value={editBill.notes || ""} onChange={e => setEditBill(b => b ? { ...b, notes: e.target.value } : b)} className="mt-1 h-20" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditBill(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={updateBill.isPending}>
                  {updateBill.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </LiotaLayout>
  );
}
