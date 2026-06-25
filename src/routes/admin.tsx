import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shield, Newspaper, BookOpen, ClipboardCheck, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Shell, PageHeader, RequireAuth } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase, STORAGE_BUCKET, ADMIN_EMAIL } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Khakhi Pro" }],
  }),
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

function AdminPanel() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Tabs defaultValue="news">
        <TabsList>
          <TabsTrigger value="news"><Newspaper className="h-4 w-4 mr-2" />News</TabsTrigger>
          <TabsTrigger value="materials"><BookOpen className="h-4 w-4 mr-2" />Materials</TabsTrigger>
          <TabsTrigger value="tests"><ClipboardCheck className="h-4 w-4 mr-2" />Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="news"><NewsAdmin /></TabsContent>
        <TabsContent value="materials"><MaterialsAdmin /></TabsContent>
        <TabsContent value="tests"><TestsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ----- NEWS ----- */
function NewsAdmin() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin", "news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; title: string; category?: string | null }>;
    },
  });

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      const { error } = await supabase.from("news").insert({
        title: fd.get("title"),
        content: fd.get("content"),
        category: fd.get("category") || "general",
      });
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
        <div><Label>Title</Label><Input name="title" required /></div>
        <div><Label>Category</Label>
          <select name="category" className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="general">General</option>
            <option value="current-affairs">Current Affairs</option>
            <option value="notification">Notification</option>
          </select>
        </div>
        <div><Label>Content</Label><Textarea name="content" rows={5} /></div>
        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">{busy ? "Saving..." : "Publish"}</Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Existing</h3>
        <ul className="divide-y divide-border max-h-[500px] overflow-auto">
          {data?.map((n) => (
            <li key={n.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.category}</p>
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
  const { data } = useQuery({
    queryKey: ["admin", "materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_materials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; title: string; subject?: string | null; file_url?: string | null }>;
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
      if (file && file.size > 0) {
        const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        file_url = pub.publicUrl;
      }
      const { error } = await supabase.from("study_materials").insert({
        title: fd.get("title"),
        description: fd.get("description"),
        subject: fd.get("subject"),
        file_url,
      });
      if (error) throw error;
      toast.success("Material added");
      form.reset();
      qc.invalidateQueries({ queryKey: ["admin", "materials"] });
      qc.invalidateQueries({ queryKey: ["study_materials"] });
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

  return (
    <div className="mt-5 grid lg:grid-cols-2 gap-6">
      <form onSubmit={create} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Add Study Material</h3>
        <div><Label>Title</Label><Input name="title" required /></div>
        <div><Label>Subject</Label><Input name="subject" placeholder="e.g. Gujarati Grammar" /></div>
        <div><Label>Description</Label><Textarea name="description" rows={3} /></div>
        <div>
          <Label className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> File (PDF / Image)</Label>
          <Input name="file" type="file" accept=".pdf,image/*" />
          <p className="text-xs text-muted-foreground mt-1">Uploaded to bucket: <code>{STORAGE_BUCKET}</code></p>
        </div>
        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">{busy ? "Uploading..." : "Add Material"}</Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Existing</h3>
        <ul className="divide-y divide-border max-h-[500px] overflow-auto">
          {data?.map((m) => (
            <li key={m.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.subject}</p>
              </div>
              <button onClick={() => remove(m.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
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
      const { data, error } = await supabase.from("mock_tests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{ id: string; title: string; category?: string | null }>;
    },
  });

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      const { error } = await supabase.from("mock_tests").insert({
        title: fd.get("title"),
        description: fd.get("description"),
        category: fd.get("category"),
        duration_minutes: Number(fd.get("duration_minutes")) || null,
        total_questions: Number(fd.get("total_questions")) || null,
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
        <div><Label>Title</Label><Input name="title" required /></div>
        <div><Label>Category</Label><Input name="category" placeholder="LRD / PSI / Constable" /></div>
        <div><Label>Description</Label><Textarea name="description" rows={3} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Duration (min)</Label><Input name="duration_minutes" type="number" /></div>
          <div><Label>Total Questions</Label><Input name="total_questions" type="number" /></div>
        </div>
        <Button type="submit" disabled={busy} className="bg-[var(--khakhi-navy)] text-white">{busy ? "Saving..." : "Create Test"}</Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold mb-3">Existing</h3>
        <ul className="divide-y divide-border max-h-[500px] overflow-auto">
          {data?.map((t) => (
            <li key={t.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.category}</p>
              </div>
              <button onClick={() => remove(t.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
