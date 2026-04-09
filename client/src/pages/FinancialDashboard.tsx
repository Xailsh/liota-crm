import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Lock, Eye, EyeOff, DollarSign, TrendingUp, TrendingDown, AlertCircle, Loader2, RefreshCw, X } from "lucide-react";

const PIN_LENGTH = 4;

function PinInput({ onSubmit, onClose }: { onSubmit: (pin: string) => void; onClose: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = pin.substring(0, index) + value.substring(value.length - 1) + pin.substring(index + 1);
    setPin(newPin);
    setError(false);
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newPin.length === PIN_LENGTH) {
      onSubmit(newPin);
    }
  };

  const handleBackspace = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Enter the 4-digit PIN para acceder a los datos financieros sensibles</p>
      </div>
      <div className="flex gap-3 justify-center">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={pin[i] ?? ""}
            onChange={(e) => handleKey(i, e.target.value)}
            onKeyDown={(e) => handleBackspace(i, e)}
            onFocus={() => setError(false)}
            className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-background outline-none transition-all ${
              error
                ? "border-red-400 bg-red-50 text-red-600"
                : pin[i]
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-foreground focus:border-primary"
            }`}
            autoFocus={i === 0}
          />
        ))}
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
          <AlertCircle className="w-4 h-4" />
          <span>Incorrect PIN. Inténtalo de nuevo.</span>
        </div>
      )}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          className="flex-1"
          disabled={pin.length < PIN_LENGTH}
          onClick={() => onSubmit(pin)}
        >
          Verificar PIN
        </Button>
      </div>
    </div>
  );
}

function BlurredValue({ value, revealed, onClick }: { value: string; revealed: boolean; onClick: () => void }) {
  return (
    <div className="relative inline-block cursor-pointer group" onClick={onClick}>
      <span className={`text-2xl font-bold transition-all duration-300 ${revealed ? "" : "blur-md select-none pointer-events-none"}`}>
        {value}
      </span>
      {!revealed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-foreground/10 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-1.5 border border-border/50">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Click para ver</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinancialDashboard() {
  const { user } = useAuth();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const { data: financialData, isLoading, refetch } = trpc.financial.dashboard.useQuery(
    { pin },
    { enabled: pin.length === PIN_LENGTH, retry: false }
  );

  const verifyPinMutation = trpc.financial.verifyPin.useMutation({
    onSuccess: () => {
      setRevealed(true);
      setShowPinDialog(false);
      setPinError(false);
      toast.success("Acceso concedido — datos financieros visibles");
    },
    onError: () => {
      setPinError(true);
      toast.error("Incorrect PIN");
    },
  });

  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    verifyPinMutation.mutate({ pin: enteredPin });
  };

  const handleRevealClick = () => {
    if (revealed) return;
    setShowPinDialog(true);
  };

  const handleLock = () => {
    setRevealed(false);
    setPin("");
    toast.info("Dashboard financiero bloqueado");
  };

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <Card className="max-w-sm w-full border border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="font-semibold text-red-700">Acceso Restringido</p>
            <p className="text-sm text-red-600 mt-1">Solo los administradores pueden acceder al dashboard financiero.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fd = financialData;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Financial Dashboard
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 ml-1">
              <Lock className="w-3 h-3 mr-1" /> Solo Administradores
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Datos financieros sensibles protegidos con PIN · Click any figure para desbloquear
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          {revealed && (
            <Button variant="outline" size="sm" onClick={handleLock} className="gap-2 text-xs text-amber-600 border-amber-300 hover:bg-amber-50">
              <Lock className="w-3.5 h-3.5" /> Bloquear
            </Button>
          )}
        </div>
      </div>

      {/* Security Banner */}
      {!revealed && (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Protected financial data</p>
              <p className="text-xs text-amber-700">Haz clic sobre cualquier cifra bloqueada to enter the PIN y revelar los datos.</p>
            </div>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-2 flex-shrink-0" onClick={() => setShowPinDialog(true)}>
              <Eye className="w-4 h-4" /> Desbloquear Todo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Estimated Revenue",
            value: revealed && fd ? `$${fd.estimatedRevenue.toLocaleString("en-US")}` : "$●●●●●",
            sub: "Total cobrado + pendiente",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
          },
          {
            label: "Revenue Cobrados",
            value: revealed && fd ? `$${fd.collectedRevenue.toLocaleString("en-US")}` : "$●●●●●",
            sub: "Payments completados",
            icon: DollarSign,
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            label: "Receivables",
            value: revealed && fd ? `$${fd.pendingRevenue.toLocaleString("en-US")}` : "$●●●●●",
            sub: "Payments pendientes",
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
          },
          {
            label: "Total Expenses",
            value: revealed && fd ? `$${fd.totalExpenses.toLocaleString("en-US")}` : "$●●●●●",
            sub: "All recorded expenses",
            icon: TrendingDown,
            color: "text-red-500",
            bg: "bg-red-50",
            border: "border-red-100",
          },
        ].map((card) => (
          <Card
            key={card.label}
            className={`border card-shadow cursor-pointer hover:card-shadow-lg transition-all ${card.border} ${!revealed ? "hover:border-primary/30" : ""}`}
            onClick={handleRevealClick}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <div className="relative">
                    <BlurredValue value={card.value} revealed={revealed} onClick={handleRevealClick} />
                  </div>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center flex-shrink-0 ml-2`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Net Profit Card */}
      <Card className="border border-border card-shadow cursor-pointer hover:card-shadow-lg transition-all" onClick={handleRevealClick}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Net Profit del Período</p>
              <div className="mt-2">
                <BlurredValue
                  value={fd ? `$${(fd.collectedRevenue - fd.totalExpenses).toLocaleString("en-US")} USD` : "$●●●●●"}
                  revealed={revealed}
                  onClick={handleRevealClick}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue cobrados − Expenses totales</p>
            </div>
            {revealed && fd && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Margen</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {fd.collectedRevenue > 0 ? Math.round(((fd.collectedRevenue - fd.totalExpenses) / fd.collectedRevenue) * 100) : 0}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      {revealed && fd?.expensesByCategory && fd.expensesByCategory.length > 0 && (
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {fd.expensesByCategory.map((c: any) => (
                <div key={c.category} className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-foreground capitalize">{c.category}</p>
                  <p className="text-lg font-bold text-red-500 mt-1">${Number(c.total ?? 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Payment Method */}
      {revealed && fd?.revenueByMethod && fd.revenueByMethod.length > 0 && (
        <Card className="border border-border card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Revenue por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {fd.revenueByMethod.map((m: any) => (
                <div key={m.method} className="bg-muted rounded-xl p-3 text-center">
                  <p className="text-sm font-semibold text-foreground capitalize">{m.method}</p>
                  <p className="text-lg font-bold text-primary mt-1">${Number(m.total ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{m.count} transacciones</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={(o) => { if (!o) { setShowPinDialog(false); setPinError(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Verificación de Seguridad
            </DialogTitle>
          </DialogHeader>
          <PinInput
            onSubmit={handlePinSubmit}
            onClose={() => { setShowPinDialog(false); setPinError(false); }}
          />
          {verifyPinMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
