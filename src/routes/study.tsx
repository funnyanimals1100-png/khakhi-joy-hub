import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, BookOpen } from "lucide-react";
import { Shell, PageHeader } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study Material — Khakhi Pro" },
      { name: "description", content: "Subject-wise study material for Gujarat Police LRD, PSI and Constable exams." },
    ],
  }),
  component: StudyPage,
});

type Material = {
  id: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  category?: string | null;
  file_url?: string | null;
  created_at?: string;
};

function StudyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["study_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Material[];
    },
  });

  return (
    <Shell>
      <PageHeader title="Study Material" subtitle="Curated notes, PDFs and resources" />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">Failed to load materials.</p>}
        {data && data.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No study materials yet. Check back soon.</p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--khakhi-saffron)]/15 text-[var(--khakhi-saffron-deep)] flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  {m.subject && (
                    <span className="text-xs font-medium text-[var(--khakhi-navy)] bg-secondary px-2 py-0.5 rounded">
                      {m.subject}
                    </span>
                  )}
                  <h3 className="mt-2 font-semibold leading-tight">{m.title}</h3>
                  {m.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{m.description}</p>
                  )}
                </div>
              </div>
              {m.file_url && (
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--khakhi-navy)] hover:text-[var(--khakhi-saffron-deep)]"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
