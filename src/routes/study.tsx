import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, BookOpen, Lock } from "lucide-react";
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
  exam_type?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  is_premium?: boolean | null;
  order_index?: number | null;
};

function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StudyPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["study_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("order_index", { ascending: true });
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.subject && (
                      <span className="text-xs font-medium text-[var(--khakhi-navy)] bg-secondary px-2 py-0.5 rounded">
                        {m.subject}
                      </span>
                    )}
                    {m.exam_type && (
                      <span className="text-xs font-medium text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">
                        {m.exam_type}
                      </span>
                    )}
                    {m.is_premium && (
                      <span className="text-xs font-semibold text-[var(--khakhi-saffron-deep)] bg-[var(--khakhi-saffron)]/15 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Premium
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold leading-tight">{m.title}</h3>
                  {m.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{m.description}</p>
                  )}
                </div>
              </div>
              {m.file_url && (
                <div className="mt-4 flex items-center justify-between">
                  <a
                    href={m.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--khakhi-navy)] hover:text-[var(--khakhi-saffron-deep)]"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                  {formatSize(m.file_size) && (
                    <span className="text-xs text-muted-foreground">{formatSize(m.file_size)}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
