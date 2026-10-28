// tests for smart search: checking the question, the request that goes to openai and how the answer
// becomes the filters of the materials page. uses a fake client, so nothing is sent to openai.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readAiConfig } from "../src/ai/aiConfig";
import { buildSearchSchema, smartSearch, toFilters, type CachedSearch, type KnownNames } from "../src/ai/smartSearch";
import { createSearchCache } from "../src/ai/searchCache";
import type { AiClient } from "../src/ai/structuredCall";
import { createUsageTracker } from "../src/ai/usage";

beforeEach(() => {
  // keep the "[ai] ..." log lines out of the test output
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const NAMES: KnownNames = {
  projects: ["Sloop kantoorpand Zwolle-Zuid", "Sloop boerderij Dalfsen"],
  locations: ["Loods A", "Loods B"],
};

// an answer with nothing filled in; tests override what they need
const EMPTY = {
  search: null,
  type: null,
  status: null,
  condition: null,
  price_min: null,
  price_max: null,
  project: null,
  location: null,
  sort: null,
  explanation: "",
};

function completed(answer: object) {
  const text = JSON.stringify(answer);
  return {
    status: "completed",
    incomplete_details: null,
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
    output_text: text,
    usage: { input_tokens: 700, output_tokens: 60 },
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

function deps(client: AiClient | null, knownNames: () => Promise<KnownNames> = async () => NAMES) {
  return { client, config: readAiConfig({ OPENAI_API_KEY: "sk-test" }), usage: createUsageTracker(() => {}), knownNames };
}

describe("smartSearch input", () => {
  it("refuses an empty, blank or missing question without calling openai", async () => {
    const { client, calls } = fakeClient(completed(EMPTY));
    for (const query of ["", "   ", undefined, 42]) {
      expect(await smartSearch(deps(client), { query })).toEqual({
        status: 400,
        body: { error: "INVALID_INPUT", reason: "EMPTY_QUERY" },
      });
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses a question longer than 200 characters", async () => {
    const { client } = fakeClient(completed(EMPTY));
    expect(await smartSearch(deps(client), { query: "a".repeat(201) })).toEqual({
      status: 400,
      body: { error: "INVALID_INPUT", reason: "QUERY_TOO_LONG" },
    });
  });

  it("answers 503 without a client", async () => {
    expect(await smartSearch(deps(null), { query: "hout" })).toEqual({ status: 503, body: { error: "AI_NOT_CONFIGURED" } });
  });
});

describe("smartSearch request", () => {
  it("asks luna, with the known names in the instructions and in the schema", async () => {
    const { client, calls } = fakeClient(completed(EMPTY));
    await smartSearch(deps(client), { query: "  houten balken uit zwolle  ", lang: "nl" });

    const params = calls[0];
    expect(params.model).toBe("gpt-6-luna");
    expect(params.input).toBe("houten balken uit zwolle");
    expect(params.store).toBe(false);
    expect(params.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(params.text.format.schema.properties.project.enum).toEqual([...NAMES.projects, null]);
    expect(params.instructions).toContain("Sloop kantoorpand Zwolle-Zuid");
    expect(params.instructions).toContain("in Dutch");
    // as steady as possible: the same question should give the same filters
    expect(params.temperature).toBe(0);
  });

  it("answers the same question from the cache, without a second call", async () => {
    const { client, calls } = fakeClient(completed({ ...EMPTY, search: "staal" }));
    const cache = createSearchCache<CachedSearch>(60_000, 10);
    const d = { ...deps(client), cache };

    const first = await smartSearch(d, { query: "Kun je alle stalen materialen zoeken?" });
    const second = await smartSearch(d, { query: "kun je alle stalen materialen zoeken" });

    expect(calls).toHaveLength(1);
    expect((second.body as any).filters).toEqual((first.body as any).filters);
    expect((second.body as any).cached).toBe(true);
    expect((second.body as any).usage.costUsd).toBe(0);
  });

  it("does not keep a failed answer in the cache", async () => {
    const { client, calls } = fakeClient(completed({ ...EMPTY, type: "plastic" }));
    const cache = createSearchCache<CachedSearch>(60_000, 10);
    await smartSearch({ ...deps(client), cache }, { query: "plastic" });
    await smartSearch({ ...deps(client), cache }, { query: "plastic" });
    expect(calls).toHaveLength(2);
    expect(cache.size()).toBe(0);
  });

  it("still searches when the names can't be read, only without project and location", async () => {
    const { client, calls } = fakeClient(completed({ ...EMPTY, type: "wood" }));
    const result = await smartSearch(deps(client, async () => Promise.reject(new Error("db down"))), { query: "hout" });
    expect(result.status).toBe(200);
    expect(calls[0].text.format.schema.properties.project).toEqual({ type: ["string", "null"], enum: [null] });
  });

  it("sends at most 100 names per list", async () => {
    const many = Array.from({ length: 150 }, (_, i) => `Project ${i}`);
    const { client, calls } = fakeClient(completed(EMPTY));
    await smartSearch(deps(client, async () => ({ projects: many, locations: [] })), { query: "hout" });
    expect(calls[0].text.format.schema.properties.project.enum).toHaveLength(101); // 100 names + null
  });
});

describe("smartSearch answer", () => {
  it("turns the answer into the filters of the materials page", async () => {
    const answer = {
      ...EMPTY,
      search: "balk",
      type: "wood",
      condition: "good",
      price_max: 50,
      project: "Sloop kantoorpand Zwolle-Zuid",
      explanation: "Houten balken in goede staat van project Sloop kantoorpand Zwolle-Zuid, onder €50.",
    };
    const { client } = fakeClient(completed(answer));
    const d = deps(client);
    const result = await smartSearch(d, { query: "houten balken in goede staat van project zwolle onder 50 euro" });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      filters: {
        search: "balk",
        type: "wood",
        status: "all",
        condition: "good",
        sort: null,
        priceMin: null,
        priceMax: 50,
        project: "Sloop kantoorpand Zwolle-Zuid",
        location: null,
      },
      explanation: answer.explanation,
      usage: expect.objectContaining({ feature: "search", model: "gpt-6-luna", inputTokens: 700, outputTokens: 60 }),
    });
    expect(d.usage.getTotals().calls).toBe(1);
  });

  it("never passes on an answer with values that don't exist", async () => {
    const { client } = fakeClient(completed({ ...EMPTY, type: "plastic" }));
    expect((await smartSearch(deps(client), { query: "plastic" })).body).toEqual({
      error: "AI_FAILED",
      reason: "INVALID_ANSWER",
    });
  });

  it("turns a refusal into 422 AI_REFUSED", async () => {
    const refusal = {
      status: "completed",
      incomplete_details: null,
      output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }],
      output_text: "",
      usage: { input_tokens: 700, output_tokens: 5 },
    };
    const { client } = fakeClient(refusal);
    expect(await smartSearch(deps(client), { query: "hout" })).toEqual({ status: 422, body: { error: "AI_REFUSED" } });
  });
});

describe("toFilters", () => {
  it("makes every empty field 'all' or empty", () => {
    expect(toFilters(EMPTY, NAMES)).toEqual({
      search: "",
      type: "all",
      status: "all",
      condition: "all",
      sort: null,
      priceMin: null,
      priceMax: null,
      project: null,
      location: null,
    });
  });

  it("writes project and location exactly as they are in the list", () => {
    const filters = toFilters({ ...EMPTY, project: "sloop BOERDERIJ dalfsen", location: "loods a" }, NAMES);
    expect(filters.project).toBe("Sloop boerderij Dalfsen");
    expect(filters.location).toBe("Loods A");
  });

  it("turns a project or location that doesn't exist into a search word", () => {
    const filters = toFilters({ ...EMPTY, search: "balk", project: "Amsterdam", location: "Hal 9" }, NAMES);
    expect(filters).toMatchObject({ search: "balk Amsterdam Hal 9", project: null, location: null });
  });

  it("swaps a minimum price above the maximum and drops negative prices", () => {
    expect(toFilters({ ...EMPTY, price_min: 80, price_max: 20 }, NAMES)).toMatchObject({ priceMin: 20, priceMax: 80 });
    expect(toFilters({ ...EMPTY, price_min: -5, price_max: 30 }, NAMES)).toMatchObject({ priceMin: null, priceMax: 30 });
  });
});

describe("buildSearchSchema", () => {
  it("only allows null for project and location when there are no names", () => {
    const schema = buildSearchSchema({ projects: [], locations: [] });
    expect(schema.properties.project).toEqual({ type: ["string", "null"], enum: [null] });
    expect(schema.properties.location).toEqual({ type: ["string", "null"], enum: [null] });
    expect(schema.required.sort()).toEqual(Object.keys(schema.properties).sort());
  });
});
