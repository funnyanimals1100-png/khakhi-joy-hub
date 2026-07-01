import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Clock, TrendingUp, Lock } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "Mock Tests — Khakhi Pro" },
      { name: "description", content: "Full-length and topic-wise mock tests for Gujarat Police exams." },
    ],
  }),
  component: TestsPage,
});

type MockTest = {
  id: string;
  name: string;
  description?: string | null;
  exam_type?: string | null;
  duration_minutes?: number | null;
  total_questions?: number | null;
  difficulty?: string | null;
  subjects?: string[] | null;
  is_premium?: boolean | null;
  is_active?: boolean | null;
};
type TestResult = {
  id: string;
  user_id: string;
  mock_test_id: string;
  score?: number | null;
  total_questions?: number | null;
  time_taken_seconds?: number | null;
  completed_at?: string | null;
};

function TestsPage() {
  const { user } = useAuth();

  const tests = useQuery({
    queryKey: ["mock_tests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as MockTest[];
    },
  });

  const results = useQuery({
    queryKey: ["test_results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data as TestResult[];
    },
  });

  const bestByTest = new Map<string, TestResult>();
  results.data?.forEach((r) => {
    const cur = bestByTest.get(r.mock_test_id);
    if (!cur || (r.score ?? 0) > (cur.score ?? 0)) bestByTest.set(r.mock_test_id, r);
  });

  return (
    <Shell>
      <PageHeader title="Mock Tests" subtitle="Practice with real exam patterns" />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {user && results.data && results.data.length > 0 && (
          <div className="mb-8 rounded-xl bg-card border border-border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <TrendingUp className="h-4 w-4 text-[var(--khakhi-saffron-deep)]" /> Your recent attempts
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              {results.data.slice(0, 3).map((r) => (
                <div key={r.id} className="bg-secondary rounded-lg p-3">
                  <div className="text-muted-foreground text-xs">
                    {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : ""}
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {r.score ?? 0} <span className="text-sm text-muted-foreground">/ {r.total_questions ?? "-"}</span>
                  </div>
                  {r.time_taken_seconds != null && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {Math.floor(r.time_taken_seconds / 60)}m {r.time_taken_seconds % 60}s
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tests.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {tests.error && <p className="text-destructive">Failed to load tests.</p>}
        {tests.data && tests.data.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No mock tests yet.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.data?.map((t) => {
            const myBest = bestByTest.get(t.id);
            return (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 hover:border-[var(--khakhi-saffron)] transition-colors flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {t.exam_type && (
                      <span className="text-xs font-medium text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">
                        {t.exam_type}
                      </span>
                    )}
                    {t.difficulty && (
                      <span className="text-xs font-medium text-[var(--khakhi-navy)] bg-secondary px-2 py-0.5 rounded capitalize">
                        {t.difficulty}
                      </span>
                    )}
                    {t.is_premium && (
                      <span className="text-xs font-semibold text-[var(--khakhi-saffron-deep)] bg-[var(--khakhi-saffron)]/15 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Premium
                      </span>
                    )}
                  </div>
                  {myBest && (
                    <span className="text-xs font-semibold text-[var(--khakhi-saffron-deep)] bg-[var(--khakhi-saffron)]/15 px-2 py-1 rounded shrink-0">
                      Best {myBest.score}/{myBest.total_questions}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-semibold leading-tight">{t.name}</h3>
                {t.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                )}
                {t.subjects && t.subjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.subjects.slice(0, 4).map((s) => (
                      <span key={s} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  {t.duration_minutes && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {t.duration_minutes} min
                    </span>
                  )}
                  {t.total_questions && <span>{t.total_questions} questions</span>}
                </div>
                <Link
                  to="/tests/$testId"
                  params={{ testId: t.id }}
                  className="mt-4 w-full rounded-md bg-[var(--khakhi-navy)] text-white text-sm font-medium py-2 hover:brightness-110 text-center"
                >
                  Start Test
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
