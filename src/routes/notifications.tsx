import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, AlertCircle } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Khakhi Pro" },
      { name: "description", content: "Exam notifications and announcements." },
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

function NotificationsPage() {
  const { data, isLoading } = useQuery({
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

  return (
    <Shell>
      <PageHeader title="Notifications" subtitle="Official exam announcements" />
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-3">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data && data.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No notifications yet.</p>
          </div>
        )}
        {data?.map((n) => (
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
    </Shell>
  );
}
