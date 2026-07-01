import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, Sparkles, AlertCircle } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News — Khakhi Pro" },
      { name: "description", content: "Latest news for Gujarat Police exam aspirants." },
    ],
  }),
  component: NewsPage,
});

type News = {
  id: string;
  title: string;
  title_en?: string | null;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  exam_type?: string | null;
  is_important?: boolean | null;
  is_new?: boolean | null;
  published_date?: string | null;
};

function NewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_date", { ascending: false });
      if (error) throw error;
      return data as News[];
    },
  });

  return (
    <Shell>
      <PageHeader title="News" subtitle="Latest updates on recruitment & exams" />
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-5">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No news yet.</p>
          </div>
        )}
        {data?.map((n) => (
          <Link
            key={n.id}
            to="/news/$id"
            params={{ id: n.id }}
            className="block rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-[var(--khakhi-saffron)] transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {n.category && (
                <span className="font-semibold text-[var(--khakhi-saffron-deep)] uppercase">{n.category}</span>
              )}
              {n.exam_type && (
                <span className="text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">{n.exam_type}</span>
              )}
              {n.is_important && (
                <span className="inline-flex items-center gap-1 text-destructive font-medium">
                  <AlertCircle className="h-3 w-3" /> Important
                </span>
              )}
              {n.is_new && (
                <span className="inline-flex items-center gap-1 text-[var(--khakhi-saffron-deep)] font-medium">
                  <Sparkles className="h-3 w-3" /> New
                </span>
              )}
              {n.published_date && <span>· {new Date(n.published_date).toLocaleDateString()}</span>}
            </div>
            <h2 className="mt-2 text-xl font-semibold">{n.title}</h2>
            {n.title_en && n.title_en !== n.title && (
              <p className="text-sm text-muted-foreground italic mt-0.5">{n.title_en}</p>
            )}
            {n.summary && <p className="mt-2 text-sm font-medium">{n.summary}</p>}
            {n.content && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">{n.content}</p>
            )}
          </Link>
        ))}
      </div>
    </Shell>
  );
}
