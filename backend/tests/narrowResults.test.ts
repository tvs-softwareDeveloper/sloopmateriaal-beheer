// tests for the second step of smart search: the ai crosses off found materials that don't fit the question.
// uses a fake client and a fake database, so nothing goes to openai or mysql.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readAiConfig } from "../src/ai/aiConfig";
import { buildNarrowSchema, narrowResults, type Candidate } from "../src/ai/narrowResults";
import { createSearchCache } from "../src/ai/searchCache";
import type { AiClient } from "../src/ai/structuredCall";
import { createUsageTracker } from "../src/ai/usage";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const STOCK: Candidate[] = [
  { id: "id-lamp", name: "TL-armaturen 120 cm", material_type: "electrical" },
  { id: "id-balk", name: "Stalen balk HEA 200, licht roestig", material_type: "metal" },
  { id: "id-spot", name: "Inbouwspots", material_type: "electrical" },
];

function completed(answer: object) {
  const text = JSON.stringify(answer);
  return {
    status: "completed",
    incomplete_details: null,
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
    output_text: text,
    usage: { input_tokens: 300, output_tokens: 10 },
  };
}

function fakeClient(answer: object) {
  const calls: any[] = [];
  const client = {
    responses: {
      create: async (params: unknown) => {
        calls.push(params);
        return answer;
      },
    },
  } as unknown as AiClient;
  return { client, calls };
}

// the fake database only knows the ids in STOCK, like the real query
const loadCandidates = async (ids: string[]) => STOCK.filter((c) => ids.includes(c.id)).sort((a, b) => a.id.localeCompare(b.id));

function deps(client: AiClient | null) {
  return { client, config: readAiConfig({ OPENAI_API_KEY: "sk-test" }), usage: createUsageTracker(() => {}), loadCandidates };
}

describe("narrowResults input", () => {
  it("answers 503 without a client", async () => {
    expect(await narrowResults(deps(null), { query: "verlichting", ids: ["id-lamp"] })).toEqual({
      status: 503,
      body: { error: "AI_NOT_CONFIGURED" },
    });
  });

  it("refuses a missing question, missing ids or too many ids without calling openai", async () => {
    const { client, calls } = fakeClient(completed({ not_matching: [] }));
    expect((await narrowResults(deps(client), { query: " ", ids: ["id-lamp"] })).status).toBe(400);
    expect((await narrowResults(deps(client), { query: "lamp", ids: [] })).body).toEqual({
      error: "INVALID_INPUT",
      reason: "INVALID_IDS",
    });
    expect((await narrowResults(deps(client), { query: "lamp", ids: [42] })).status).toBe(400);
    const tooMany = Array.from({ length: 51 }, (_, i) => `id-${i}`);
    expect((await narrowResults(deps(client), { query: "lamp", ids: tooMany })).body).toEqual({
      error: "INVALID_INPUT",
      reason: "TOO_MANY_IDS",
    });
    expect(calls).toHaveLength(0);
  });

  it("does not call openai when none of the ids exist", async () => {
    const { client, calls } = fakeClient(completed({ not_matching: [] }));
    const result = await narrowResults(deps(client), { query: "lamp", ids: ["gone"] });
    expect(result.status).toBe(200);
    expect((result.body as any).hide).toEqual([]);
    expect(calls).toHaveLength(0);
  });
});

describe("narrowResults request and answer", () => {
  it("sends only numbered names and types, never the ids", async () => {
    const { client, calls } = fakeClient(completed({ not_matching: [] }));
    await narrowResults(deps(client), { query: "verlichting", ids: ["id-lamp", "id-balk", "id-spot"] });

    const params = calls[0];
    expect(params.model).toBe("gpt-6-luna");
    expect(params.store).toBe(false);
    expect(params.temperature).toBe(0);
    expect(params.input).toContain("Question: verlichting");
    expect(params.input).toContain("Stalen balk HEA 200, licht roestig (metal)");
    expect(params.input).not.toContain("id-");
    expect(params.text.format.schema).toEqual(buildNarrowSchema(3));
  });

  it("turns the numbers the ai crossed off back into ids", async () => {
    // sorted by id: 1 = id-balk, 2 = id-lamp, 3 = id-spot
    const { client } = fakeClient(completed({ not_matching: ["1"] }));
    const result = await narrowResults(deps(client), { query: "verlichting", ids: ["id-lamp", "id-balk", "id-spot"] });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      hide: ["id-balk"],
      usage: expect.objectContaining({ feature: "search-narrow", model: "gpt-6-luna" }),
    });
  });

  it("ignores numbers that were not on the list", async () => {
    const { client } = fakeClient(completed({ not_matching: ["0", "9", "2", "2"] }));
    const result = await narrowResults(deps(client), { query: "verlichting", ids: ["id-lamp", "id-balk", "id-spot"] });
    expect((result.body as any).hide).toEqual(["id-lamp"]);
  });

  it("answers the same check from the cache", async () => {
    const { client, calls } = fakeClient(completed({ not_matching: ["1"] }));
    const d = { ...deps(client), cache: createSearchCache<string[]>(60_000, 10) };
    await narrowResults(d, { query: "Verlichting?", ids: ["id-spot", "id-balk"] });
    const second = await narrowResults(d, { query: "verlichting", ids: ["id-balk", "id-spot"] });
    expect(calls).toHaveLength(1);
    expect(second.body).toMatchObject({ hide: ["id-balk"], cached: true });
  });

  it("passes on a broken answer as AI_FAILED", async () => {
    const { client } = fakeClient(completed({ something: "else" }));
    expect((await narrowResults(deps(client), { query: "lamp", ids: ["id-lamp"] })).body).toEqual({
      error: "AI_FAILED",
      reason: "INVALID_ANSWER",
    });
  });
});
