import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Lock } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/study/$id")({
  head: () => ({ meta: [{ title: "Study Material — Khakhi Pro" }] }),
  component: StudyDetail,
});

function formatSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StudyDetail() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["study_materials", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/study"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to materials
        </Link>
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {data && (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-[var(--khakhi-saffron)]/15 text-[var(--khakhi-saffron-deep)] flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {data.subject && (
                    <span className="text-xs font-medium text-[var(--khakhi-navy)] bg-secondary px-2 py-0.5 rounded">
                      {data.subject}
                    </span>
                  )}
                  {data.exam_type && (
                    <span className="text-xs font-medium text-white bg-[var(--khakhi-navy)] px-2 py-0.5 rounded">
                      {data.exam_type}
                    </span>
                  )}
                  {data.is_premium && (
                    <span className="text-xs font-semibold text-[var(--khakhi-saffron-deep)] bg-[var(--khakhi-saffron)]/15 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Premium
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-bold">{data.title}</h1>
              </div>
            </div>
            {data.description && (
              <p className="mt-4 text-sm text-foreground/90 whitespace-pre-wrap">{data.description}</p>
            )}
            {data.file_url ? (
              <a
                href={data.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--khakhi-navy)] text-white text-sm font-medium px-4 py-2 hover:brightness-110"
              >
                <Download className="h-4 w-4" />
                Download {data.file_name ?? "file"}
                {formatSize(data.file_size) && (
                  <span className="text-xs opacity-80">({formatSize(data.file_size)})</span>
                )}
              </a>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">No downloadable file attached.</p>
            )}
          </div>
        )}
        {!isLoading && !data && (
          <p className="text-muted-foreground">Material not found.</p>
        )}
      </div>
    </Shell>
  );
}
