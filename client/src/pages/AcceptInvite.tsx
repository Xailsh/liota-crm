import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Mail, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  instructor: "Instructor",
  coordinator: "Coordinator",
  receptionist: "Receptionist",
  user: "User",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  instructor: "bg-blue-100 text-blue-700 border-blue-200",
  coordinator: "bg-violet-100 text-violet-700 border-violet-200",
  receptionist: "bg-emerald-100 text-emerald-700 border-emerald-200",
  user: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const token = window.location.pathname.split("/invite/")[1] ?? "";
  const [accepted, setAccepted] = useState(false);

  const { data: invitation, isLoading, error } = trpc.invitations.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMutation = trpc.invitations.accept.useMutation({
    onSuccess: () => {
      setAccepted(true);
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-sm">This invitation link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invitation Not Valid</h2>
            <p className="text-muted-foreground text-sm mb-4">{error.message}</p>
            <Button variant="outline" onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invitation Accepted!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your account has been set up with <strong>{ROLE_LABELS[invitation?.role ?? "user"]}</strong> access.
              Sign in with <strong>{invitation?.email}</strong> to get started.
            </p>
            <Button
              className="w-full gap-2"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <Shield className="w-4 h-4" /> Sign In to LIOTA CRM
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">You're Invited!</h1>
            <p className="text-muted-foreground text-sm mt-1">
              You've been invited to join the <strong>LIOTA CRM</strong>
            </p>
          </div>

          {/* Invitation Details */}
          <div className="bg-muted/40 rounded-lg p-4 space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited to</span>
              <span className="text-sm font-medium">Language Institute of The Americas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{invitation?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge className={`text-xs border ${ROLE_COLORS[invitation?.role ?? "user"]}`}>
                {ROLE_LABELS[invitation?.role ?? "user"]}
              </Badge>
            </div>
            {invitation?.invitedByName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Invited by</span>
                <span className="text-sm font-medium">{invitation.invitedByName}</span>
              </div>
            )}
          </div>

          {/* Personal Message */}
          {invitation?.message && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800 italic">"{invitation.message}"</p>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2"
              onClick={() => acceptMutation.mutate({ token })}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Accept Invitation & Sign In
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By accepting, you'll be redirected to sign in with your Manus account using <strong>{invitation?.email}</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
