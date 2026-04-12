/**
 * Public Lead Capture Form
 *
 * Accessible at /lead-form (no auth required).
 * Can be embedded on external websites via a 2-line script snippet.
 * On submit: creates CRM lead, enrolls in drip sequence, notifies marketing team.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Globe, BookOpen, MapPin, Phone, Mail, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

const PROGRAMS = [
  "ESL – English as a Second Language",
  "SSL – Spanish as a Second Language",
  "Polyglot Program",
  "Business Language",
  "STEAM Integration",
  "Seasonal Camp",
  "Other / Not Sure",
];

const CAMPUSES = [
  "Mérida, Mexico",
  "Dallas, Texas",
  "Denver, Colorado",
  "Vienna, Austria",
  "Nottingham, UK",
  "Online",
];

const HEAR_ABOUT_US = [
  "Facebook / Instagram Ad",
  "Google Search",
  "Friend or Family Referral",
  "School / University",
  "Event or Fair",
  "Other",
];

export default function LeadCaptureForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    interestedProgram: "",
    preferredCampus: "",
    hearAboutUs: "",
  });

  const submit = trpc.leadCapture.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e) => {
      toast.error(e.message || "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    submit.mutate({
      ...form,
      source: "website_form",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Thank You!</h2>
          <p className="text-slate-300 mb-2">
            We've received your information and will be in touch within 24 hours.
          </p>
          <p className="text-slate-400 text-sm">
            Check your email for a welcome message from LIOTA Institute.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500">
              © 2026 Language Institute of The Americas (LIOTA)
            </p>
            <a
              href="https://liota.institute"
              className="text-xs text-amber-400 hover:underline"
            >
              liota.institute
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
            <Globe className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">Free Consultation Available</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">LIOTA</h1>
          <p className="text-slate-400 text-sm">Language Institute of The Americas</p>
          <p className="text-white/80 mt-3 text-base">
            Start your language learning journey today
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                  <User className="h-3 w-3" /> First Name *
                </label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Maria"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Last Name *</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="García"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                <Mail className="h-3 w-3" /> Email Address *
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="maria@example.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number
              </label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/50"
              />
            </div>

            {/* Program of Interest */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Program of Interest
              </label>
              <Select
                value={form.interestedProgram}
                onValueChange={(v) => setForm({ ...form, interestedProgram: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a program..." />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campus */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Preferred Campus
              </label>
              <Select
                value={form.preferredCampus}
                onValueChange={(v) => setForm({ ...form, preferredCampus: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a campus..." />
                </SelectTrigger>
                <SelectContent>
                  {CAMPUSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* How did you hear */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">How did you hear about us?</label>
              <Select
                value={form.hearAboutUs}
                onValueChange={(v) => setForm({ ...form, hearAboutUs: v })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  {HEAR_ABOUT_US.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold h-11 mt-2"
              disabled={submit.isPending}
            >
              {submit.isPending ? "Submitting..." : "Request Free Consultation →"}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              By submitting this form, you agree to be contacted by LIOTA Institute.
              We respect your privacy and will never share your information.
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-600">
            © 2026 Language Institute of The Americas (LIOTA) ·{" "}
            <a href="https://liota.institute" className="text-amber-500/70 hover:text-amber-400">
              liota.institute
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
