// one openai call that has to answer in a fixed json schema (strict mode). shared by every ai feature:
// it sends the request, writes down the cost and turns every outcome (a refusal, a cut-off answer, a
// timeout, an openai error) into a clear error code. the feature itself only checks its own answer.
import OpenAI, { APIConnectionTimeoutError, APIError } from "openai";
import type { UsageEntry, UsageTracker } from "./usage";

// only the part of the openai client we use, so tests can pass a fake one
export type AiClient = Pick<OpenAI, "responses">;

export type StructuredRequest = {
  feature: string; // for the cost log, e.g. "photo" or "search"
  model: string;
  instructions: string;
  input: OpenAI.Responses.ResponseCreateParams["input"];
  schemaName: string;
  schema: Record<string, unknown>;
  reasoningEffort: "none" | "low" | "medium" | "high";
  maxOutputTokens: number;
  // 0 = as steady as possible: the same question gives (almost) the same answer. left out = the model's default
  temperature?: number;
};

export type StructuredFailure = { ok: false; status: number; error: string; reason?: string };

export type StructuredResult = { ok: true; answer: unknown; usage: UsageEntry } | StructuredFailure;

export function failure(feature: string, status: number, error: string, reason?: string): StructuredFailure {
  console.log(`[ai] ${feature} failed: ${error}${reason ? ` (${reason})` : ""}`);
  return reason ? { ok: false, status, error, reason } : { ok: false, status, error };
}

export async function callStructured(
  client: AiClient,
  usage: UsageTracker,
  request: StructuredRequest
): Promise<StructuredResult> {
  const { feature, model } = request;
  const start = Date.now();
  try {
    const response = await client.responses.create({
      model,
      instructions: request.instructions,
      input: request.input,
      text: { format: { type: "json_schema", name: request.schemaName, schema: request.schema, strict: true } },
      reasoning: { effort: request.reasoningEffort },
      max_output_tokens: request.maxOutputTokens,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      // openai keeps nothing (photos, questions) after the answer
      store: false,
    });

    // paid for, whatever the answer turns out to be
    const entry = usage.record(feature, model, Date.now() - start, response.usage ?? { input_tokens: 0, output_tokens: 0 });

    const refusal = response.output
      .flatMap((item) => (item.type === "message" ? item.content : []))
      .find((part) => part.type === "refusal");
    if (refusal) return failure(feature, 422, "AI_REFUSED");

    if (response.status === "incomplete") {
      return failure(feature, 502, "AI_FAILED", response.incomplete_details?.reason ?? "incomplete");
    }

    try {
      return { ok: true, answer: JSON.parse(response.output_text), usage: entry };
    } catch {
      return failure(feature, 502, "AI_FAILED", "INVALID_JSON");
    }
  } catch (err) {
    // the timeout error is also an APIError, so it goes first
    if (err instanceof APIConnectionTimeoutError) return failure(feature, 504, "AI_TIMEOUT");
    if (err instanceof APIError) return failure(feature, 502, "AI_FAILED", err.code ?? String(err.status ?? ""));
    return failure(feature, 502, "AI_FAILED", err instanceof Error ? err.message : undefined);
  }
}
