import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Schemas ----------
const generateQuestionsInput = z.object({
  mockTestId: z.string().uuid(),
  topic: z.string().min(2).max(500),
  subject: z.string().min(1).max(80).optional(),
  count: z.number().int().min(5).max(50).default(50),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const bulkFillMaterialsInput = z.object({
  examTypes: z.array(z.string()).default(["LRD", "PSI", "Constable"]),
  perSubject: z.number().int().min(1).max(15).default(8),
  subjects: z.array(z.string()).optional(),
});

const createMaterialWithTestInput = z.object({
  material: z.object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    subject: z.string().optional().nullable(),
    exam_type: z.string().optional().nullable(),
    file_url: z.string().optional().nullable(),
    file_name: z.string().optional().nullable(),
    file_size: z.number().optional().nullable(),
    is_premium: z.boolean().default(false),
    order_index: z.number().default(0),
  }),
  autoGenerateTest: z.boolean().default(false),
  questionCount: z.number().int().min(5).max(50).default(25),
});

// ---------- Helpers ----------
async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("users")
    .select("is_admin")
    .eq("id", ctx.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.is_admin) throw new Error("Forbidden: admin only");
}

type AIQuestion = {
  question: string;
  options: [string, string, string, string];
  correct_answer: number; // 0..3
  explanation: string;
  subject?: string;
};

async function generateQuestionsWithAI(params: {
  topic: string;
  subject?: string;
  count: number;
  difficulty: string;
}): Promise<AIQuestion[]> {
  const { chatJSON } = await import("@/lib/ai.server");
  const system =
    "You are an expert Gujarat Police (LRD / PSI / Constable) competitive exam question setter. Produce factually accurate multiple-choice questions in clear English. Return ONLY valid JSON.";
  const user = `Generate exactly ${params.count} unique multiple-choice questions on the topic: "${params.topic}"${
    params.subject ? ` (subject: ${params.subject})` : ""
  }. Difficulty: ${params.difficulty}.

Return JSON of shape:
{
  "questions": [
    {
      "question": "...",
      "options": ["A option", "B option", "C option", "D option"],
      "correct_answer": 0,
      "explanation": "1-2 sentence explanation",
      "subject": "${params.subject ?? ""}"
    }
  ]
}

Rules:
- Exactly 4 options per question.
- correct_answer is the index (0-3) of the correct option.
- Vary correct answer positions.
- No duplicates.
- Keep questions concise.`;

  // Chunk if > 25 to keep responses reliable
  const chunks: number[] = [];
  let remaining = params.count;
  while (remaining > 0) {
    const take = Math.min(25, remaining);
    chunks.push(take);
    remaining -= take;
  }

  const all: AIQuestion[] = [];
  for (const size of chunks) {
    const res = await chatJSON<{ questions: AIQuestion[] }>({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user.replace(`${params.count}`, `${size}`) },
      ],
      maxTokens: 8000,
    });
    const qs = Array.isArray(res?.questions) ? res.questions : [];
    for (const q of qs) {
      if (
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.correct_answer) &&
        q.correct_answer >= 0 &&
        q.correct_answer <= 3
      ) {
        all.push(q);
      }
    }
  }
  return all.slice(0, params.count);
}

// ---------- Server functions ----------

/**
 * Generate `count` MCQs with AI and insert into `questions` table for the given mock_test_id.
 */
export const generateQuestionsForTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => generateQuestionsInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);

    const generated = await generateQuestionsWithAI({
      topic: data.topic,
      subject: data.subject,
      count: data.count,
      difficulty: data.difficulty,
    });
    if (generated.length === 0) throw new Error("AI produced no valid questions");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = generated.map((q, i) => ({
      mock_test_id: data.mockTestId,
      question: q.question,
      options: q.options as unknown,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      subject: q.subject ?? data.subject ?? null,
      marks: 1,
      order_index: i,
    }));
    const { error } = await supabaseAdmin.from("questions").insert(rows as never);
    if (error) throw new Error(error.message);

    // Update the mock_test total_questions to reflect the true count
    await supabaseAdmin
      .from("mock_tests")
      .update({ total_questions: rows.length } as never)
      .eq("id", data.mockTestId);

    return { inserted: rows.length };
  });

/**
 * Create a study material and (optionally) auto-generate a linked mock test with AI questions.
 */
export const createMaterialWithOptionalTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createMaterialWithTestInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: mat, error: mErr } = await supabaseAdmin
      .from("study_materials")
      .insert(data.material as never)
      .select("*")
      .single();
    if (mErr) throw new Error(mErr.message);

    let mockTestId: string | null = null;
    let insertedQuestions = 0;

    if (data.autoGenerateTest) {
      const testName = `${data.material.title} — Practice Test`;
      const { data: test, error: tErr } = await supabaseAdmin
        .from("mock_tests")
        .insert({
          name: testName,
          description: `Auto-generated practice test for "${data.material.title}"`,
          exam_type: data.material.exam_type ?? null,
          duration_minutes: Math.max(15, Math.round(data.questionCount * 0.75)),
          total_questions: data.questionCount,
          difficulty: "medium",
          subjects: data.material.subject ? [data.material.subject] : null,
          is_premium: data.material.is_premium ?? false,
          is_active: true,
        } as never)
        .select("id")
        .single();
      if (tErr) throw new Error(tErr.message);
      mockTestId = (test as { id: string }).id;

      const topic = `${data.material.title}${data.material.description ? ` — ${data.material.description}` : ""}`;
      const generated = await generateQuestionsWithAI({
        topic,
        subject: data.material.subject ?? undefined,
        count: data.questionCount,
        difficulty: "medium",
      });

      if (generated.length > 0) {
        const rows = generated.map((q, i) => ({
          mock_test_id: mockTestId,
          question: q.question,
          options: q.options as unknown,
          correct_answer: q.correct_answer,
          explanation: q.explanation ?? null,
          subject: q.subject ?? data.material.subject ?? null,
          marks: 1,
          order_index: i,
        }));
        const { error: qErr } = await supabaseAdmin.from("questions").insert(rows as never);
        if (qErr) throw new Error(qErr.message);
        insertedQuestions = rows.length;
        await supabaseAdmin
          .from("mock_tests")
          .update({ total_questions: insertedQuestions } as never)
          .eq("id", mockTestId);
      }
    }

    return { material: mat, mockTestId, insertedQuestions };
  });

/**
 * AI-generates and bulk-inserts study material entries across many subjects & exam types.
 */
export const bulkFillStudyMaterials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => bulkFillMaterialsInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { chatJSON } = await import("@/lib/ai.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const subjects =
      data.subjects && data.subjects.length > 0
        ? data.subjects
        : [
            "Gujarati",
            "Mathematics",
            "Reasoning",
            "General Knowledge",
            "English",
            "Indian Polity",
            "History",
            "Geography",
            "Current Affairs",
          ];

    const allRows: Array<{
      title: string;
      description: string;
      subject: string;
      exam_type: string;
      is_premium: boolean;
      order_index: number;
    }> = [];

    for (const subject of subjects) {
      for (const examType of data.examTypes) {
        try {
          const res = await chatJSON<{ items: Array<{ title: string; description: string; level?: string }> }>({
            messages: [
              {
                role: "system",
                content:
                  "You create study-material index entries for Gujarat Police exam preparation apps. Return only JSON.",
              },
              {
                role: "user",
                content: `Generate ${data.perSubject} study-material topics for the subject "${subject}" for the Gujarat Police "${examType}" exam. Cover basic, intermediate and advanced levels.

Return JSON of shape:
{
  "items": [
    { "title": "Concise topic title (English)", "description": "2-4 sentence detailed description of what this material covers, key points, and why it matters for ${examType}.", "level": "basic|intermediate|advanced" }
  ]
}
No duplicates. Titles should be concrete (e.g. "Sandhi rules in Gujarati grammar"), not generic.`,
              },
            ],
            maxTokens: 3500,
          });
          const items = Array.isArray(res?.items) ? res.items : [];
          items.slice(0, data.perSubject).forEach((it, idx) => {
            if (it?.title && it?.description) {
              allRows.push({
                title: it.title,
                description: it.description,
                subject,
                exam_type: examType,
                is_premium: false,
                order_index: idx,
              });
            }
          });
        } catch (e) {
          // continue with other subjects/exam types
          console.error(`[bulkFill] ${subject}/${examType}:`, (e as Error).message);
        }
      }
    }

    if (allRows.length === 0) throw new Error("AI produced no material entries");

    const { error } = await supabaseAdmin.from("study_materials").insert(allRows as never);
    if (error) throw new Error(error.message);

    return { inserted: allRows.length };
  });
