/**
 * Lead Form Manager
 *
 * Protected page for admins/marketing/coordinators to:
 * - View form submissions
 * - Get the embed code snippet for external websites
 * - See stats (total, today, this week)
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Globe,
  Copy,
  CheckCircle2,
  Users,
  Calendar,
  TrendingUp,
  ExternalLink,
  Code2,
  Mail,
  Phone,
  MapPin,
  BookOpen,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import LiotaLayout from "@/components/LiotaLayout";

const FORM_URL = `${window.location.origin}/lead-form`;

const EMBED_SNIPPET = `<!-- LIOTA Lead Capture Form -->
<div id="liota-lead-form"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${FORM_URL}';
    iframe.style.cssText = 'width:100%;min-height:700px;border:none;border-radius:12px;';
    iframe.allow = 'fullscreen';
    document.getElementById('liota-lead-form').appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'liota-form-height') {
        iframe.style.minHeight = e.data.height + 'px';
      }
    });
  })();
</script>`;

export default function LeadFormManager() {
  const [copied, setCopied] = useState(false);

  const { data: stats } = trpc.leadCapture.stats.useQuery();
  const { data: result } = trpc.leadCapture.listSubmissions.useQuery({ limit: 100, offset: 0 });
  const submissions = result?.submissions ?? [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <LiotaLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lead Capture Form</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Embeddable web form that auto-creates CRM leads and enrolls them in drip sequences
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(FORM_URL, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Form
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Submissions</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">{stats?.today ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">{stats?.thisWeek ?? 0}</div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="embed">
          <TabsList>
            <TabsTrigger value="embed">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              Embed Code
            </TabsTrigger>
            <TabsTrigger value="submissions">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Submissions ({submissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Embed Code Tab */}
          <TabsContent value="embed" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Embed on Your Website
                </CardTitle>
                <CardDescription>
                  Copy and paste this 2-line snippet into any HTML page to embed the LIOTA lead capture form.
                  The form auto-submits to the CRM, enrolls leads in the drip sequence, and notifies your marketing team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {EMBED_SNIPPET}
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(EMBED_SNIPPET)}
                  >
                    {copied ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Direct Form URL</h4>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono">
                      {FORM_URL}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(FORM_URL)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(FORM_URL, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-blue-600 mb-2">What happens when someone submits?</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Lead is saved to the CRM with source = "website_form"</li>
                    <li>Lead is automatically enrolled in the default drip email sequence</li>
                    <li>Marketing team receives an instant email notification</li>
                    <li>Submitter sees a success confirmation page</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="mt-4">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No submissions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Share the embed code or direct URL to start collecting leads.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <Card key={sub.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {sub.firstName} {sub.lastName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {sub.source ?? "website_form"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                            {sub.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {sub.email}
                              </span>
                            )}
                            {sub.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {sub.phone}
                              </span>
                            )}
                            {sub.interestedProgram && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> {sub.interestedProgram}
                              </span>
                            )}
                            {sub.preferredCampus && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {sub.preferredCampus}
                              </span>
                            )}
                          </div>
                          {sub.hearAboutUs && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Heard via: {sub.hearAboutUs}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          {new Date(sub.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </LiotaLayout>
  );
}
