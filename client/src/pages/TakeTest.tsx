import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BookOpen, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800 border-green-200",
  A2: "bg-emerald-100 text-emerald-800 border-emerald-200",
  B1: "bg-blue-100 text-blue-800 border-blue-200",
  B2: "bg-indigo-100 text-indigo-800 border-indigo-200",
  C1: "bg-purple-100 text-purple-800 border-purple-200",
  C2: "bg-rose-100 text-rose-800 border-rose-200",
};

const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: "Beginner — You can understand and use familiar everyday expressions and basic phrases.",
  A2: "Elementary — You can communicate in simple, routine tasks on familiar topics.",
  B1: "Intermediate — You can deal with most situations likely to arise while travelling.",
  B2: "Upper Intermediate — You can interact with a degree of fluency and spontaneity with native speakers.",
  C1: "Advanced — You can express ideas fluently and spontaneously without much obvious searching for expressions.",
  C2: "Proficiency — You can understand with ease virtually everything heard or read.",
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TakeTest() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, error } = trpc.placementTests.getByToken.useQuery(
    { token },
    { retry: false }
  );

  const submitMutation = trpc.placementTests.submitAnswers.useMutation();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; percent: number; cefrResult: string; certificateUrl?: string | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize timer
  useEffect(() => {
    if (data?.status === "active" && data.test?.durationMinutes && timeLeft === null) {
      setTimeLeft(data.test.durationMinutes * 60);
    }
  }, [data, timeLeft]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  const handleAutoSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitMutation.mutateAsync({ token, answers });
      setResult(res);
      setSubmitted(true);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [token, answers, submitted, submitting]);

  const handleSubmit = async () => {
    if (submitting) return;
    const questions = data?.status === "active" ? data.questions : [];
    const unanswered = questions.filter((q) => !answers[String(q.id)]);
    if (unanswered.length > 0) {
      const confirmed = confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`);
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      const res = await submitMutation.mutateAsync({ token, answers });
      setResult(res);
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <BookOpen className="h-12 w-12 mx-auto mb-4 animate-pulse text-amber-400" />
          <p className="text-lg">Loading your test...</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Test Not Found</h2>
          <p className="text-muted-foreground">This test link is invalid or has expired. Please contact your instructor for a new link.</p>
        </div>
      </div>
    );
  }

  // ── Expired ──────────────────────────────────────────────────────────────
  if (data.status === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <Clock className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Test Link Expired</h2>
          <p className="text-muted-foreground">This test link has expired. Please contact your instructor to receive a new test link.</p>
        </div>
      </div>
    );
  }

  // ── Already Completed ────────────────────────────────────────────────────
  if (data.status === "completed" && !submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Test Already Completed</h2>
          <p className="text-muted-foreground">You have already completed this test.</p>
          {data.cefrResult && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Your result:</p>
              <Badge className={`text-lg px-4 py-2 ${CEFR_COLORS[data.cefrResult]}`}>{data.cefrResult}</Badge>
              {data.percentScore != null && <p className="mt-2 text-muted-foreground">Score: {data.percentScore}%</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Results Screen ───────────────────────────────────────────────────────
  if (submitted && result) {
    const cefr = result.cefrResult as string;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
          {/* LIOTA Header */}
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-amber-600 tracking-widest uppercase mb-1">LIOTA Institute</p>
            <h1 className="text-2xl font-bold text-slate-900">Test Complete!</h1>
          </div>

          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />

          {/* Score */}
          <div className="text-center mb-6">
            <p className="text-5xl font-bold text-slate-900">{result.percent}%</p>
            <p className="text-muted-foreground mt-1">{result.score} / {result.maxScore} points</p>
          </div>

          {/* CEFR Result */}
          <div className={`rounded-xl border-2 p-6 text-center mb-6 ${CEFR_COLORS[cefr]}`}>
            <p className="text-sm font-semibold uppercase tracking-widest mb-2">Your English Level</p>
            <p className="text-5xl font-bold mb-3">{cefr}</p>
            <p className="text-sm leading-relaxed">{CEFR_DESCRIPTIONS[cefr]}</p>
          </div>

          {/* Score bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>A1</span><span>A2</span><span>B1</span><span>B2</span><span>C1</span><span>C2</span>
            </div>
            <Progress value={result.percent} className="h-3" />
          </div>

          {result.certificateUrl && (
            <div className="text-center mb-5">
              <a href={result.certificateUrl} target="_blank" rel="noopener noreferrer">
                <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
                  🏅 Download Your Certificate (PDF)
                </button>
              </a>
            </div>
          )}
          <div className="text-center text-sm text-muted-foreground">
            <p>Your results have been sent to LIOTA Institute.</p>
            <p className="mt-1">Your instructor will be in touch soon to discuss your placement.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Test ──────────────────────────────────────────────────────────
  if (data.status !== "active") return null;

  const questions = data.questions;
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentQ];
  const options: string[] = typeof currentQuestion.options === "string"
    ? JSON.parse(currentQuestion.options)
    : currentQuestion.options;
  const progress = ((currentQ + 1) / totalQ) * 100;
  const isTimeLow = timeLeft !== null && timeLeft < 120;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase">LIOTA Institute</p>
            <p className="text-white font-semibold text-sm truncate max-w-[200px]">{data.test.title}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-400">Progress</p>
              <p className="text-white font-bold text-sm">{currentQ + 1}/{totalQ}</p>
            </div>
            {timeLeft !== null && (
              <div className={`text-center px-3 py-1 rounded-lg ${isTimeLow ? "bg-red-500/20 border border-red-500" : "bg-slate-800"}`}>
                <p className="text-xs text-slate-400">Time Left</p>
                <p className={`font-bold text-sm font-mono ${isTimeLow ? "text-red-400" : "text-white"}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <Progress value={progress} className="h-1.5 bg-slate-700" />
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Question Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Question {currentQ + 1} of {totalQ}</span>
              <div className="flex gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                  {currentQuestion.skill}
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                  {currentQuestion.cefrLevel}
                </Badge>
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className="px-6 py-6">
            <p className="text-lg font-semibold text-slate-900 leading-relaxed mb-6">
              {currentQuestion.questionText}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {options.map((opt, i) => {
                const isSelected = answers[String(currentQuestion.id)] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [String(currentQuestion.id)]: opt }))}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 font-medium ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full mr-3 text-sm font-bold ${
                      isSelected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              {answeredCount}/{totalQ} answered
            </div>

            {currentQ < totalQ - 1 ? (
              <Button
                onClick={() => setCurrentQ((q) => Math.min(totalQ - 1, q + 1))}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-6 bg-white/10 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-3 uppercase tracking-widest">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isAnswered = !!answers[String(q.id)];
              const isCurrent = i === currentQ;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-amber-500 text-white scale-110"
                      : isAnswered
                      ? "bg-green-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit all button at bottom */}
        {answeredCount === totalQ && (
          <div className="mt-4 text-center">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-10"
            >
              {submitting ? "Submitting..." : "Submit All Answers"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
