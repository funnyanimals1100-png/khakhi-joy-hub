import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/news")({
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
  content?: string | null;
  category?: string | null;
  image_url?: string | null;
  created_at?: string;
};

function NewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "general"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });
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
          <article key={n.id} className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
            {n.image_url && (
              <img src={n.image_url} alt={n.title} className="w-full h-48 object-cover" loading="lazy" />
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {n.category && (
                  <span className="font-medium text-[var(--khakhi-saffron-deep)] uppercase">{n.category}</span>
                )}
                {n.created_at && <span>· {new Date(n.created_at).toLocaleDateString()}</span>}
              </div>
              <h2 className="mt-2 text-xl font-semibold">{n.title}</h2>
              {n.content && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{n.content}</p>}
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}
