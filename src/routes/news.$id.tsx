import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/news/$id")({
  head: () => ({
    meta: [{ title: "News Detail — Khakhi Pro" }],
  }),
  component: NewsDetail,
});

function NewsDetail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["news", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/news"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">Failed to load.</p>}
        {data && (
          <article className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {data.category && (
                <span className="font-semibold text-[var(--khakhi-saffron-deep)] uppercase">
                  {data.category}
                </span>
              )}
              {data.exam_type && (
                <span className="text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">
                  {data.exam_type}
                </span>
              )}
              {data.is_important && (
                <span className="inline-flex items-center gap-1 text-destructive font-medium">
                  <AlertCircle className="h-3 w-3" /> Important
                </span>
              )}
              {data.is_new && (
                <span className="inline-flex items-center gap-1 text-[var(--khakhi-saffron-deep)] font-medium">
                  <Sparkles className="h-3 w-3" /> New
                </span>
              )}
              {data.published_date && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(data.published_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-bold">{data.title}</h1>
            {data.title_en && data.title_en !== data.title && (
              <p className="text-sm text-muted-foreground italic mt-1">{data.title_en}</p>
            )}
            {data.summary && <p className="mt-4 font-medium">{data.summary}</p>}
            {data.content && (
              <div className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {data.content}
              </div>
            )}
            {(data as { apply_link?: string | null }).apply_link && (
              <div className="mt-6">
                <a
                  href={(data as { apply_link?: string | null }).apply_link!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--khakhi-saffron-deep)] text-white text-sm font-semibold px-5 py-2.5 hover:brightness-110"
                >
                  Apply Now <ExternalLink className="h-4 w-4" />
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opens the official application / notification page in a new tab.
                </p>
              </div>
            )}
          </article>
        )}
        {!isLoading && !data && !error && (
          <p className="text-muted-foreground">News item not found.</p>
        )}
      </div>
    </Shell>
  );
}
