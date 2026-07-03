import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/tests/$testId")({
  head: () => ({ meta: [{ title: "Mock Test — Khakhi Pro" }] }),
  component: TestRunner,
});

type SafeQuestion = {
  id: string;
  question: string;
  options: unknown;
  subject: string | null;
  marks: number | null;
  order_index: number | null;
};

type ReviewQuestion = SafeQuestion & {
  correct_answer: number;
  explanation: string | null;
};

type SubmitResult = {
  result_id: string;
  score: number;
  total: number;
  questions: ReviewQuestion[];
};

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (raw && typeof raw === "object") return Object.values(raw as Record<string, unknown>).map(String);
  return [];
}

function TestRunner() {
  const { testId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const testQ = useQuery({
    queryKey: ["mock_test", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("id", testId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const questionsQ = useQuery({
    queryKey: ["questions_public", testId],
    queryFn: async () => {
      // Safe view: no correct_answer / explanation exposed until submission.
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (col: string, val: string) => {
              order: (
                col: string,
                opts: { ascending: boolean }
              ) => Promise<{ data: SafeQuestion[] | null; error: unknown }>;
            };
          };
        };
      })
        .from("questions_public")
        .select("id, mock_test_id, question, options, subject, marks, order_index")
        .eq("mock_test_id", testId)
        .order("order_index", { ascending: true });
      if (error) throw error as Error;
      return (data ?? []) as SafeQuestion[];
    },
  });

  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = questionsQ.data ?? [];
  const current = questions[idx];

  // Timer
  useEffect(() => {
    if (!started || submitted) return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
      setSecondsLeft((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [started, submitted]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && started && !submitted) {
      void handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const startTest = () => {
    if (testQ.data?.duration_minutes) {
      setSecondsLeft(testQ.data.duration_minutes * 60);
    }
    setStarted(true);
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    setSubmitError(null);
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await (
        supabase as unknown as {
          rpc: (
            name: string,
            args: Record<string, unknown>
          ) => Promise<{ data: SubmitResult | null; error: { message: string } | null }>;
        }
      ).rpc("submit_test", {
        p_mock_test_id: testId,
        p_answers: answers,
        p_time_taken_seconds: elapsed,
      });
      if (error) throw new Error(error.message);
      setResult(data);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (testQ.isLoading || questionsQ.isLoading) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">Loading test…</div>
      </Shell>
    );
  }

  if (!testQ.data) {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link to="/tests" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <p>Test not found.</p>
        </div>
      </Shell>
    );
  }

  // Start screen
  if (!started) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Link to="/tests" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to tests
          </Link>
          <div className="rounded-xl border border-border bg-card p-6">
            <h1 className="text-2xl font-bold">{testQ.data.name}</h1>
            {testQ.data.description && (
              <p className="mt-2 text-muted-foreground">{testQ.data.description}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-muted-foreground text-xs">Duration</div>
                <div className="font-semibold">{testQ.data.duration_minutes ?? "—"} min</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-muted-foreground text-xs">Questions</div>
                <div className="font-semibold">{questions.length}</div>
              </div>
            </div>
            {questions.length === 0 ? (
              <p className="mt-6 text-sm text-destructive">
                This test has no questions yet.
              </p>
            ) : (
              <button
                onClick={startTest}
                className="mt-6 w-full rounded-md bg-[var(--khakhi-navy)] text-white text-sm font-medium py-2.5 hover:brightness-110"
              >
                Start Test
              </button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  // Result screen
  if (submitted) {
    const total = result?.total ?? questions.length;
    const score = result?.score ?? 0;
    const pct = total ? Math.round((score / total) * 100) : 0;
    const reviewQs: ReviewQuestion[] = result?.questions ?? [];
    return (
      <Shell>
        <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <h1 className="text-2xl font-bold">Test Complete</h1>
            <div className="mt-4 text-5xl font-bold text-[var(--khakhi-saffron-deep)]">
              {score}/{total}
            </div>
            <p className="mt-1 text-muted-foreground">{pct}% · {fmt(elapsed)}</p>
            {saving && <p className="text-xs text-muted-foreground mt-2">Saving result…</p>}
            {submitError && (
              <p className="text-xs text-destructive mt-2">Could not save: {submitError}</p>
            )}
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => navigate({ to: "/tests" })}
                className="rounded-md bg-[var(--khakhi-navy)] text-white text-sm font-medium px-4 py-2"
              >
                Back to tests
              </button>
            </div>
          </div>

          {reviewQs.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Review</h2>
              {reviewQs.map((q, i) => {
                const opts = parseOptions(q.options);
                const picked = answers[q.id];
                const correct = picked === q.correct_answer;
                return (
                  <div key={q.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start gap-2">
                      {correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Q{i + 1}</div>
                        <p className="font-medium">{q.question}</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {opts.map((o, oi) => {
                            const isCorrect = oi === q.correct_answer;
                            const isPicked = oi === picked;
                            return (
                              <li
                                key={oi}
                                className={`px-2 py-1 rounded ${
                                  isCorrect
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : isPicked
                                      ? "bg-destructive/15"
                                      : ""
                                }`}
                              >
                                <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
                                {o}
                              </li>
                            );
                          })}
                        </ul>
                        {q.explanation && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            <span className="font-semibold">Explanation: </span>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  // Question screen
  if (!current) return null;
  const opts = parseOptions(current.options);
  const picked = answers[current.id];

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Question {idx + 1} of {questions.length}
          </div>
          {secondsLeft != null && (
            <div className={`inline-flex items-center gap-1 text-sm font-semibold ${secondsLeft < 60 ? "text-destructive" : ""}`}>
              <Clock className="h-4 w-4" /> {fmt(secondsLeft)}
            </div>
          )}
        </div>

        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[var(--khakhi-saffron)]"
            style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          {current.subject && (
            <span className="text-xs font-medium text-[var(--khakhi-navy)] bg-secondary px-2 py-0.5 rounded">
              {current.subject}
            </span>
          )}
          <h2 className="mt-2 text-lg font-semibold">{current.question}</h2>
          <div className="mt-4 space-y-2">
            {opts.map((o, i) => {
              const isPicked = picked === i;
              return (
                <button
                  key={i}
                  onClick={() => setAnswers((a) => ({ ...a, [current.id]: i }))}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm flex items-start gap-3 transition-colors ${
                    isPicked
                      ? "border-[var(--khakhi-saffron)] bg-[var(--khakhi-saffron)]/10"
                      : "border-border hover:border-[var(--khakhi-saffron)]"
                  }`}
                >
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isPicked
                        ? "bg-[var(--khakhi-saffron)] text-white"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{o}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          {idx < questions.length - 1 ? (
            <button
              onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
              className="rounded-md bg-[var(--khakhi-navy)] text-white px-4 py-2 text-sm font-medium"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-md bg-[var(--khakhi-saffron-deep)] text-white px-4 py-2 text-sm font-medium"
            >
              Submit Test
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}
