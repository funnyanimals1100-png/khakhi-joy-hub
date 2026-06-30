import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/current-affairs")({
  head: () => ({
    meta: [
      { title: "Current Affairs — Khakhi Pro" },
      { name: "description", content: "Daily current affairs for Gujarat Police exams." },
    ],
  }),
  component: CAPage,
});

type News = {
  id: string;
  title: string;
  title_en?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  published_date?: string | null;
};

function CAPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "current-affairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .ilike("category", "%current%")
        .order("published_date", { ascending: false });
      if (error) throw error;
      return data as News[];
    },
  });

  return (
    <Shell>
      <PageHeader title="Current Affairs" subtitle="Daily digest curated for your exam" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No current affairs posts yet. Tag news with category "current-affairs".</p>
          </div>
        )}
        {data?.map((n) => (
          <Link
            key={n.id}
            to="/news/$id"
            params={{ id: n.id }}
            className="block rounded-xl border border-border bg-card p-5 hover:border-[var(--khakhi-saffron)] transition-colors"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {n.published_date && new Date(n.published_date).toLocaleDateString()}
            </div>
            <h2 className="font-semibold">{n.title}</h2>
            {n.summary && <p className="mt-1 text-sm font-medium">{n.summary}</p>}
            {n.content && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{n.content}</p>}
          </Link>
        ))}
      </div>
    </Shell>
  );
}
