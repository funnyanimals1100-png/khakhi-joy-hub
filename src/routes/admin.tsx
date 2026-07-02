import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Newspaper, BookOpen, ClipboardCheck, Trash2, Upload, Megaphone, Plus, X, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Shell, PageHeader, RequireAuth } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase, STORAGE_BUCKET, ADMIN_EMAIL } from "@/lib/supabase";
import {
  generateQuestionsForTest,
  createMaterialWithOptionalTest,
  bulkFillStudyMaterials,
} from "@/lib/ai-admin.functions";

const s = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");
const sn = (v: FormDataEntryValue | null) => {
  const x = typeof v === "string" ? v.trim() : "";
  return x ? x : null;
};

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Khakhi Pro" }] }),
  component: () => (
    <Shell>
      <PageHeader title="Admin Panel" subtitle="Manage news, study material and tests" />
      <RequireAuth>
        <AdminGate />
      </RequireAuth>
    </Shell>
  ),
});

function AdminGate() {
  const { user, isAdmin } = useAuth();
  if (!isAdmin || user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <Shield className="h-12 w-12 mx-auto text-destructive mb-3" />
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="mt-2 text-muted-foreground">Admin access only.</p>
      </div>
    );
  }
  return <AdminPanel />;
}

const EXAM_TYPES = ["LRD", "PSI", "Constable"];

function AdminPanel() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Tabs defaultValue="recruitment">
        <TabsList>
          <TabsTrigger value="recruitment"><Megaphone className="h-4 w-4 mr-2" />Recruitment</TabsTrigger>
          <TabsTrigger value="news"><Newspaper className="h-4 w-4 mr-2" />News</TabsTrigger>
          <TabsTrigger value="materials"><BookOpen className="h-4 w-4 mr-2" />Materials</TabsTrigger>
          <TabsTrigger value="tests"><ClipboardCheck className="h-4 w-4 mr-2" />Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="recruitment"><RecruitmentAdmin /></TabsContent>
        <TabsContent value="news"><NewsAdmin /></TabsContent>
        <TabsContent value="materials"><MaterialsAdmin /></TabsContent>
        <TabsContent value="tests"><TestsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

const selectCls = "w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm";

/* ----- NEWS ----- */
function NewsAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin", "news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").order("published_date", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; title: string; category?: string | null; exam_type?: string | null }>;
    },
  });

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      const { error } = await supabase.from("news").insert({
        title: s(fd.get("title")),
        title_en: sn(fd.get("title_en")),
        summary: sn(fd.get("summary")),
        content: sn(fd.get("content")),
        category: s(fd.get("category")) || "general",
        exam_type: sn(fd.get("exam_type")),
        apply_link: sn(fd.get("apply_link")),
        is_important: fd.get("is_important") === "on",
        is_new: true,
        published_date: new Date().toISOString(),
      } as never);
      if (error) throw error;
      toast.success("News published");
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin", "news"] });
      qc.invalidateQueries({ queryKey: ["news"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin", "news"] });
  };

  return (
    <div className="mt-5 grid lg:grid-cols-2 gap-6">
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Add News</h3>
        <div><Label>Title (Gujarati)</Label><Input name="title" required /></div>
        <div><Label>Title (English)</Label><Input name="title_en" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Category</Label>
            <select name="category" className={selectCls} defaultValue="general">
              <option value="general">General</option>
              <option value="current-affairs">Current Affairs</option>
              <option value="notification">Notification</option>
              <option value="result">Result</option>
            </select>
          </div>
          <div><Label>Exam Type</Label>
            <select name="exam_type" className={selectCls} defaultValue="">
              <option value="">All</option>
              {EXAM_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Summary</Label><Input name="summary" /></div>
        <div><Label>Content</Label><Textarea name="content" rows={4} /></div>
        <div>
          <Label>Apply / Notification Link (OJAS URL)</Label>
          <Input name="apply_link" type="url" placeholder="https://ojas.gujarat.gov.in/..." />
          <p className="text-xs text-muted-foreground mt-1">If set, an "Apply Now" button will appear on the news detail page.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_important" /> Mark as important
        </label>
        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">{busy ? "Saving..." : "Publish"}</Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Existing</h3>
        <ul className="divide-y divide-border max-h-[500px] overflow-auto">
          {data?.map((n) => (
            <li key={n.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.category} · {n.exam_type ?? "All"}</p>
              </div>
              <button onClick={() => remove(n.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ----- MATERIALS ----- */
function MaterialsAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [bulking, setBulking] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin", "materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_materials").select("*").order("order_index", { ascending: true });
      if (error) throw error;
      return data as Array<{ id: string; title: string; subject?: string | null; exam_type?: string | null }>;
    },
  });

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      const file = fd.get("file") as File | null;
      let file_url: string | null = null;
      let file_name: string | null = null;
      let file_size: number | null = null;
      if (file && file.size > 0) {
        const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (upErr) throw upErr;
        // Bucket is private -> use a long-lived signed URL (10 years) for downloads
        const { data: signed, error: signErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;
        file_url = signed.signedUrl;
        file_name = file.name;
        file_size = file.size;
      }

      const autoGen = fd.get("auto_generate_test") === "on";
      const questionCount = Number(fd.get("question_count")) || 25;

      const res = await createMaterialWithOptionalTest({
        data: {
          material: {
            title: s(fd.get("title")),
            description: sn(fd.get("description")),
            subject: sn(fd.get("subject")),
            exam_type: sn(fd.get("exam_type")),
            file_url,
            file_name,
            file_size,
            is_premium: fd.get("is_premium") === "on",
            order_index: Number(fd.get("order_index")) || 0,
          },
          autoGenerateTest: autoGen,
          questionCount,
        },
      });

      if (res.mockTestId) {
        toast.success(`Material added + ${res.insertedQuestions} AI questions generated`);
      } else {
        toast.success("Material added");
      }
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin", "materials"] });
      qc.invalidateQueries({ queryKey: ["admin", "tests"] });
      qc.invalidateQueries({ queryKey: ["study_materials"] });
      qc.invalidateQueries({ queryKey: ["mock_tests"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("study_materials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin", "materials"] });
  };

  const runBulkFill = async () => {
    if (!confirm("Generate 8 study-material entries per subject × 3 exam types with AI? This can take 1–2 minutes.")) return;
    setBulking(true);
    const tId = toast.loading("Generating study materials with AI…");
    try {
      const res = await bulkFillStudyMaterials({
        data: { perSubject: 8, examTypes: ["LRD", "PSI", "Constable"] },
      });
      toast.success(`Inserted ${res.inserted} study materials`, { id: tId });
      qc.invalidateQueries({ queryKey: ["admin", "materials"] });
      qc.invalidateQueries({ queryKey: ["study_materials"] });
    } catch (err) {
      toast.error((err as Error).message, { id: tId });
    } finally {
      setBulking(false);
    }
  };

  return (
    <div className="mt-5 grid lg:grid-cols-2 gap-6">
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Add Study Material</h3>
        <div><Label>Title</Label><Input name="title" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Subject</Label><Input name="subject" placeholder="e.g. Gujarati Grammar" /></div>
          <div><Label>Exam Type</Label>
            <select name="exam_type" className={selectCls} defaultValue="">
              <option value="">All</option>
              {EXAM_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div><Label>Description</Label><Textarea name="description" rows={3} /></div>
        <div><Label>Order Index</Label><Input name="order_index" type="number" defaultValue={0} /></div>
        <div>
          <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> File (PDF / Image)</Label>
          <Input name="file" type="file" accept=".pdf,image/*" />
          <p className="text-xs text-muted-foreground mt-1">Bucket: <code>{STORAGE_BUCKET}</code> (private, served via signed URL)</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_premium" /> Premium only
        </label>
        <div className="rounded-lg border border-dashed border-[var(--khakhi-saffron)]/60 bg-[var(--khakhi-saffron)]/5 p-3 space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="auto_generate_test" />
            <Sparkles className="h-4 w-4 text-[var(--khakhi-saffron-deep)]" />
            Auto-generate a linked mock test with AI
          </label>
          <div className="flex items-center gap-2 text-xs">
            <Label className="text-xs">Questions:</Label>
            <Input name="question_count" type="number" defaultValue={25} min={5} max={50} className="h-7 w-20" />
          </div>
        </div>
        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">
          {busy ? "Working…" : "Add Material"}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-[var(--khakhi-saffron-deep)]" /> Bulk-fill with AI
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Generates 8 topics per subject (Gujarati, Maths, Reasoning, GK, English, Polity, History, Geography, Current Affairs) for LRD, PSI and Constable.
          </p>
          <Button
            type="button"
            onClick={runBulkFill}
            disabled={bulking}
            className="mt-3 bg-[var(--khakhi-saffron-deep)] text-white"
          >
            {bulking ? "Generating…" : "Generate study materials"}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Existing</h3>
          <ul className="divide-y divide-border max-h-[420px] overflow-auto">
            {data?.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.subject} · {m.exam_type ?? "All"}</p>
                </div>
                <button onClick={() => remove(m.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ----- TESTS ----- */
function TestsAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin", "tests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("mock_tests").select("*").order("name");
      if (error) throw error;
      return data as Array<{ id: string; name: string; exam_type?: string | null; is_active?: boolean | null }>;
    },
  });

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      const subjectsRaw = (fd.get("subjects") as string) || "";
      const subjects = subjectsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("mock_tests").insert({
        name: s(fd.get("name")),
        description: sn(fd.get("description")),
        exam_type: sn(fd.get("exam_type")),
        duration_minutes: Number(fd.get("duration_minutes")) || null,
        total_questions: Number(fd.get("total_questions")) || null,
        difficulty: sn(fd.get("difficulty")),
        subjects: subjects.length ? subjects : null,
        is_premium: fd.get("is_premium") === "on",
        is_active: true,
      });
      if (error) throw error;
      toast.success("Mock test created");
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin", "tests"] });
      qc.invalidateQueries({ queryKey: ["mock_tests"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("mock_tests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin", "tests"] });
  };

  return (
    <div className="mt-5 grid lg:grid-cols-2 gap-6">
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Add Mock Test</h3>
        <div><Label>Name</Label><Input name="name" required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Exam Type</Label>
            <select name="exam_type" className={selectCls} defaultValue="LRD">
              {EXAM_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div><Label>Difficulty</Label>
            <select name="difficulty" className={selectCls} defaultValue="medium">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div><Label>Description</Label><Textarea name="description" rows={2} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Duration (min)</Label><Input name="duration_minutes" type="number" /></div>
          <div><Label>Total Questions</Label><Input name="total_questions" type="number" /></div>
        </div>
        <div><Label>Subjects (comma-separated)</Label>
          <Input name="subjects" placeholder="Gujarati, Reasoning, GK" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_premium" /> Premium only
        </label>
        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">{busy ? "Saving..." : "Create Test"}</Button>
      </form>

      <div className="space-y-4">
        <AIGenerateQuestionsPanel tests={data ?? []} />

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-3">Existing</h3>
          <ul className="divide-y divide-border max-h-[420px] overflow-auto">
            {data?.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.exam_type} {t.is_active ? "" : "· inactive"}</p>
                </div>
                <button onClick={() => remove(t.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
}

/* ----- RECRUITMENT NOTIFICATIONS ----- */
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
  is_active?: boolean | null;
  posted_at?: string | null;
};

function RecruitmentAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dates, setDates] = useState<ImportantDate[]>([]);

  const { data } = useQuery({
    queryKey: ["admin", "recruitment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recruitment_notifications" as never)
        .select("*")
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Recruitment[];
    },
  });

  const editing = data?.find((r) => r.id === editingId) ?? null;

  const startEdit = (r: Recruitment) => {
    setEditingId(r.id);
    setDates(Array.isArray(r.important_dates) ? r.important_dates : []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDates([]);
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      const payload = {
        title: s(fd.get("title")),
        organization: sn(fd.get("organization")),
        description: sn(fd.get("description")),
        exam_type: sn(fd.get("exam_type")),
        apply_link: sn(fd.get("apply_link")),
        official_link: sn(fd.get("official_link")),
        last_date: sn(fd.get("last_date")),
        important_dates: dates.filter((d) => d.label && d.date),
        is_active: fd.get("is_active") !== "off",
      };
      if (editingId) {
        const { error } = await supabase
          .from("recruitment_notifications" as never)
          .update(payload as never)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Notification updated");
      } else {
        const { error } = await supabase
          .from("recruitment_notifications" as never)
          .insert(payload as never);
        if (error) throw error;
        toast.success("Notification published");
      }
      form.reset();
      cancelEdit();
      qc.invalidateQueries({ queryKey: ["admin", "recruitment"] });
      qc.invalidateQueries({ queryKey: ["recruitment_notifications"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const { error } = await supabase
      .from("recruitment_notifications" as never)
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin", "recruitment"] });
  };

  return (
    <div className="mt-5 grid lg:grid-cols-2 gap-6">
      <form onSubmit={save} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {editingId ? "Edit Recruitment Notification" : "Add Recruitment Notification"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs text-muted-foreground underline"
            >
              Cancel edit
            </button>
          )}
        </div>
        <div>
          <Label>Title</Label>
          <Input name="title" required defaultValue={editing?.title ?? ""} placeholder="e.g. Gujarat Police LRD Recruitment 2026" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Organization</Label>
            <Input name="organization" defaultValue={editing?.organization ?? ""} placeholder="Gujarat Police / GPSC" />
          </div>
          <div>
            <Label>Exam Type</Label>
            <select
              name="exam_type"
              className={selectCls}
              defaultValue={editing?.exam_type ?? ""}
            >
              <option value="">Any</option>
              {EXAM_TYPES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea name="description" rows={3} defaultValue={editing?.description ?? ""} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Apply Link</Label>
            <Input name="apply_link" type="url" defaultValue={editing?.apply_link ?? ""} placeholder="https://ojas.gujarat.gov.in" />
          </div>
          <div>
            <Label>Official Link</Label>
            <Input name="official_link" type="url" defaultValue={editing?.official_link ?? ""} placeholder="https://police.gujarat.gov.in" />
          </div>
        </div>
        <div>
          <Label>Last Date to Apply</Label>
          <Input
            name="last_date"
            type="date"
            defaultValue={editing?.last_date ? editing.last_date.slice(0, 10) : ""}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Important Dates</Label>
            <button
              type="button"
              onClick={() => setDates((d) => [...d, { label: "", date: "" }])}
              className="text-xs inline-flex items-center gap-1 text-[var(--khakhi-navy)] font-medium"
            >
              <Plus className="h-3 w-3" /> Add date
            </button>
          </div>
          <div className="space-y-2 mt-2">
            {dates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No dates added. E.g. "Prelims Exam", "Interview".
              </p>
            )}
            {dates.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Label (e.g. Prelims)"
                  value={d.label}
                  onChange={(e) =>
                    setDates((prev) => prev.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x))
                  }
                />
                <Input
                  type="date"
                  value={d.date}
                  onChange={(e) =>
                    setDates((prev) => prev.map((x, ix) => ix === i ? { ...x, date: e.target.value } : x))
                  }
                />
                <button
                  type="button"
                  onClick={() => setDates((prev) => prev.filter((_, ix) => ix !== i))}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded"
                  aria-label="Remove date"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={editing?.is_active ?? true}
          /> Active (visible to users)
        </label>

        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">
          {busy ? "Saving..." : editingId ? "Update Notification" : "Publish Notification"}
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Existing Notifications</h3>
        <ul className="divide-y divide-border max-h-[600px] overflow-auto">
          {data?.length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">No notifications yet.</li>
          )}
          {data?.map((r) => (
            <li key={r.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.organization ?? "—"}
                  {r.exam_type ? ` · ${r.exam_type}` : ""}
                  {r.last_date ? ` · Last: ${new Date(r.last_date).toLocaleDateString()}` : ""}
                  {r.is_active === false ? " · inactive" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(r)}
                  className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(r.id)}
                  className="text-destructive p-1 hover:bg-destructive/10 rounded"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
