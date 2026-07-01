import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertCircle, Megaphone, ExternalLink, CalendarClock } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Khakhi Pro" },
      { name: "description", content: "Exam notifications and government recruitment announcements." },
    ],
  }),
  component: NotificationsPage,
});

type News = {
  id: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  is_important?: boolean | null;
  published_date?: string | null;
};

type ImportantDate = { label: string; date: string };
type Recruitment = {
  id: string;
  title: string;
  organization?: string | null;
  description?: string | null;
  exam_type?: string | null;
  apply_link?: string | null;
  official_link?: string | null;
  last_date?: string | null;
  important_dates?: ImportantDate[] | null;
  posted_at?: string | null;
};

function NotificationsPage() {
  const news = useQuery({
    queryKey: ["news", "notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .or("category.ilike.%notification%,is_important.eq.true")
        .order("published_date", { ascending: false });
      if (error) throw error;
      return data as News[];
    },
  });

  const recruitment = useQuery({
    queryKey: ["recruitment_notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruitment_notifications" as never)
        .select("*")
        .eq("is_active", true)
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Recruitment[];
    },
  });

  return (
    <Shell>
      <PageHeader title="Notifications" subtitle="Official exam announcements & recruitment" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <Megaphone className="h-5 w-5 text-[var(--khakhi-saffron-deep)]" />
            Government Recruitment
          </h2>
          {recruitment.isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {recruitment.data && recruitment.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No open recruitment right now.</p>
          )}
          <div className="space-y-3">
            {recruitment.data?.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--khakhi-saffron)]/15 text-[var(--khakhi-saffron-deep)] flex items-center justify-center shrink-0">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {r.organization && (
                        <span className="font-semibold text-[var(--khakhi-navy)]">{r.organization}</span>
                      )}
                      {r.exam_type && (
                        <span className="text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">{r.exam_type}</span>
                      )}
                    </div>
                    <h3 className="font-semibold mt-1">{r.title}</h3>
                    {r.description && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.description}</p>
                    )}
                    {r.last_date && (
                      <p className="text-xs mt-2 inline-flex items-center gap-1 text-destructive font-medium">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Last date: {new Date(r.last_date).toLocaleDateString()}
                      </p>
                    )}
                    {Array.isArray(r.important_dates) && r.important_dates.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {r.important_dates.map((d, i) => (
                          <li key={i}>
                            <span className="font-medium text-foreground">{d.label}:</span>{" "}
                            {d.date ? new Date(d.date).toLocaleDateString() : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.apply_link && (
                        <a
                          href={r.apply_link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--khakhi-saffron-deep)] text-white text-xs font-semibold px-3 py-1.5 hover:brightness-110"
                        >
                          Apply Now <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {r.official_link && (
                        <a
                          href={r.official_link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 rounded-md border border-border text-xs font-medium px-3 py-1.5 hover:bg-secondary"
                        >
                          Official Site <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <Bell className="h-5 w-5 text-[var(--khakhi-saffron-deep)]" />
            Announcements
          </h2>
          {news.isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {news.data && news.data.length === 0 && (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          )}
          <div className="space-y-3">
            {news.data?.map((n) => (
              <Link
                key={n.id}
                to="/news/$id"
                params={{ id: n.id }}
                className="flex gap-3 rounded-xl border border-border bg-card p-4 hover:border-[var(--khakhi-saffron)] transition-colors"
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${n.is_important ? "bg-destructive/15 text-destructive" : "bg-[var(--khakhi-saffron)]/15 text-[var(--khakhi-saffron-deep)]"}`}>
                  {n.is_important ? <AlertCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">{n.title}</h3>
                  {n.summary && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.summary}</p>}
                  {n.published_date && (
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.published_date).toLocaleString()}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
