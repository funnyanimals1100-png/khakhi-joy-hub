import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
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
  content?: string | null;
  category?: string | null;
  created_at?: string;
};

function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["news", "notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .ilike("category", "%notification%")
        .order("created_at", { ascending: false });
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
            <p>No notifications. Admin can post news with "notification" category.</p>
          </div>
        )}
        {data?.map((n) => (
          <div key={n.id} className="flex gap-3 rounded-xl border border-border bg-card p-4 hover:border-[var(--khakhi-saffron)]">
            <div className="h-10 w-10 rounded-full bg-[var(--khakhi-saffron)]/15 text-[var(--khakhi-saffron-deep)] flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold">{n.title}</h3>
              {n.content && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.content}</p>}
              {n.created_at && (
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
