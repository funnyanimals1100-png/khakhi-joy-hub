// Server-only helper for calling the Lovable AI Gateway.
// Do NOT import from client code.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatJSON<T = unknown>(opts: {
  model?: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<T> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-2.5-flash",
      messages: opts.messages,
      response_format: { type: "json_object" },
      max_completion_tokens: opts.maxTokens ?? 8000,
    }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up in Lovable settings.");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI gateway error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") throw new Error("AI returned no content");
  // Some models wrap JSON in ```json fences
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("AI returned invalid JSON");
  }
}
