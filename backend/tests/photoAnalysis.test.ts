// tests for the photo analysis: checking the uploaded files, the request that goes to openai and
// what every possible answer turns into. uses a fake client, so nothing is sent to openai.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { APIConnectionTimeoutError, APIError } from "openai";
import { readAiConfig } from "../src/ai/aiConfig";
import {
  analyzePhoto,
  countTotal,
  PHOTO_SCHEMA,
  PHOTO_UNITS,
  resolveImages,
  type AiClient,
  type RawPhotoAnswer,
} from "../src/ai/photoAnalysis";
import { createUsageTracker } from "../src/ai/usage";

// a temp folder with an uploads folder inside it, and a "secret" file next to that uploads folder
const root = fs.mkdtempSync(path.join(os.tmpdir(), "sloop-test-"));
const uploadsDir = path.join(root, "uploads");
fs.mkdirSync(uploadsDir);
fs.writeFileSync(path.join(uploadsDir, "1730000000000-plank.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]));
fs.writeFileSync(path.join(uploadsDir, "1730000000001-stenen.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
fs.writeFileSync(path.join(uploadsDir, "notes.txt"), "not a photo");
fs.writeFileSync(path.join(root, "secret.jpg"), "outside the uploads folder");

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

beforeEach(() => {
  // keep the "[ai] ..." log lines out of the test output
  vi.spyOn(console, "log").mockImplementation(() => {});
});

const PLANK = "http://localhost:3000/uploads/1730000000000-plank.jpg";

// a stack of two bundles, like the plank photo: 15 x 6 + 16 x 6
const GOOD_ANSWER: RawPhotoAnswer = {
  is_material: true,
  name: "Eiken balken",
  material_type: "wood",
  unit: "pieces",
  condition: "good",
  notes: "Ongeveer 20 x 20 cm, met spijkergaten.",
  count: {
    count_notes: "bovenste bundel: 15 lagen, 6 breed; onderste bundel: 16 lagen, 6 breed",
    method: "stack",
    sections: [
      { rows: 15, columns: 6 },
      { rows: 16, columns: 6 },
    ],
    loose_items: null,
    count_confidence: "low",
  },
  confidence: "high",
};

const rawCount = (count: Partial<RawPhotoAnswer["count"]>): RawPhotoAnswer["count"] => ({
  count_notes: "",
  method: "none",
  sections: [],
  loose_items: null,
  count_confidence: "medium",
  ...count,
});

// what the responses api sends back, in the shape the code reads
function completed(text: string) {
  return {
    status: "completed",
    incomplete_details: null,
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
    output_text: text,
    usage: { input_tokens: 3000, output_tokens: 120 },
  };
}

// a stand-in for the openai client that remembers what it was asked
function fakeClient(answer: object | Error) {
  const calls: any[] = [];
  const client = {
    responses: {
      create: async (params: unknown) => {
        calls.push(params);
        if (answer instanceof Error) throw answer;
        return answer;
      },
    },
  } as unknown as AiClient;
  return { client, calls };
}

function deps(client: AiClient | null) {
  return {
    client,
    config: readAiConfig({ OPENAI_API_KEY: "sk-test" }),
    usage: createUsageTracker(() => {}),
    uploadsDir,
  };
}

describe("resolveImages", () => {
  const resolve = (images: unknown, maxBytes = 1000) => resolveImages(images, uploadsDir, 5, maxBytes);

  it("accepts the full urls the form sends and bare file names", async () => {
    const result = await resolve([PLANK, "1730000000001-stenen.png"]);
    expect(result).toEqual({
      ok: true,
      images: [
        { file: path.join(uploadsDir, "1730000000000-plank.jpg"), mime: "image/jpeg" },
        { file: path.join(uploadsDir, "1730000000001-stenen.png"), mime: "image/png" },
      ],
    });
  });

  it("needs 1 to 5 photos", async () => {
    expect(await resolve([])).toEqual({ ok: false, reason: "NO_IMAGES" });
    expect(await resolve(undefined)).toEqual({ ok: false, reason: "NO_IMAGES" });
    expect(await resolve(Array(6).fill(PLANK))).toEqual({ ok: false, reason: "TOO_MANY_IMAGES" });
  });

  it("never reads a file outside the uploads folder", async () => {
    for (const trick of ["../secret.jpg", "..\\secret.jpg", "%2e%2e%2fsecret.jpg", "http://evil.example/../secret.jpg"]) {
      expect(await resolve([trick])).toEqual({ ok: false, reason: "IMAGE_NOT_FOUND" });
    }
  });

  it("refuses hidden files, unknown files and non-strings", async () => {
    expect(await resolve([".env"])).toEqual({ ok: false, reason: "IMAGE_NOT_FOUND" });
    expect(await resolve(["1999-missing.jpg"])).toEqual({ ok: false, reason: "IMAGE_NOT_FOUND" });
    expect(await resolve([42])).toEqual({ ok: false, reason: "IMAGE_NOT_FOUND" });
  });

  it("refuses files openai can't read as an image", async () => {
    expect(await resolve(["notes.txt"])).toEqual({ ok: false, reason: "UNSUPPORTED_IMAGE" });
  });

  it("refuses photos above the size limit", async () => {
    expect(await resolve([PLANK], 2)).toEqual({ ok: false, reason: "IMAGE_TOO_LARGE" });
  });
});

describe("PHOTO_SCHEMA", () => {
  it("has no field for price, status, project or location", () => {
    const fields = Object.keys(PHOTO_SCHEMA.properties);
    for (const field of ["price", "status", "project_name", "location", "quantity"]) {
      expect(fields).not.toContain(field);
    }
    expect(PHOTO_SCHEMA.required.sort()).toEqual(fields.sort());
  });

  it("only offers metric units", () => {
    expect(PHOTO_UNITS).toEqual(["pieces", "kg", "sqm", "linear_m", "pallets", "boxes"]);
  });

  it("lets the model write its counting notes before the numbers", () => {
    expect(Object.keys(PHOTO_SCHEMA.properties.count.properties)[0]).toBe("count_notes");
  });
});

describe("countTotal", () => {
  it("multiplies rows by columns per section and adds the sections up", () => {
    expect(countTotal(GOOD_ANSWER.count)).toEqual({
      method: "stack",
      sections: GOOD_ANSWER.count.sections,
      total: 15 * 6 + 16 * 6,
      confidence: "low",
      notes: GOOD_ANSWER.count.count_notes,
    });
  });

  it("uses the counted number for loose items, also a single one", () => {
    expect(countTotal(rawCount({ method: "loose", loose_items: 6 })).total).toBe(6);
    expect(countTotal(rawCount({ method: "loose", loose_items: 1 })).total).toBe(1);
  });

  it("gives no total for a surface or bulk material", () => {
    expect(countTotal(rawCount({ method: "none" }))).toMatchObject({ method: "none", total: null });
  });

  it("turns a count that makes no sense into 'none'", () => {
    const bad = [
      rawCount({ method: "stack", sections: [] }),
      rawCount({ method: "stack", sections: [{ rows: 0, columns: 6 }] }),
      rawCount({ method: "stack", sections: [{ rows: -3, columns: 6 }] }),
      rawCount({ method: "stack", sections: [{ rows: 1000, columns: 1000 }] }),
      rawCount({ method: "loose", loose_items: 0 }),
      rawCount({ method: "loose", loose_items: null }),
    ];
    for (const count of bad) expect(countTotal(count)).toMatchObject({ method: "none", total: null });
  });
});

describe("analyzePhoto", () => {
  it("answers 503 without a client", async () => {
    const result = await analyzePhoto(deps(null), { images: [PLANK] });
    expect(result).toEqual({ status: 503, body: { error: "AI_NOT_CONFIGURED" } });
  });

  it("answers 400 for bad input and never calls openai", async () => {
    const { client, calls } = fakeClient(completed(JSON.stringify(GOOD_ANSWER)));
    const result = await analyzePhoto(deps(client), { images: ["../secret.jpg"] });
    expect(result).toEqual({ status: 400, body: { error: "INVALID_INPUT", reason: "IMAGE_NOT_FOUND" } });
    expect(calls).toHaveLength(0);
  });

  it("returns the suggestion and what it cost", async () => {
    const { client } = fakeClient(completed(JSON.stringify(GOOD_ANSWER)));
    const d = deps(client);
    const result = await analyzePhoto(d, { images: [PLANK], lang: "nl" });

    expect(result.status).toBe(200);
    const { count: _raw, ...rest } = GOOD_ANSWER;
    expect(result.body).toEqual({
      suggestion: { ...rest, count: countTotal(GOOD_ANSWER.count) },
      usage: expect.objectContaining({ feature: "photo", model: "gpt-6.1-terra", inputTokens: 3000, outputTokens: 120 }),
    });
    expect((result.body as any).suggestion.count.total).toBe(186);
    // terra: 3000 * $1/1M + 120 * $5/1M
    expect((result.body as any).usage.costUsd).toBeCloseTo(0.0036, 10);
    expect(d.usage.getTotals().calls).toBe(1);
  });

  it("sends the photo as base64 with a strict schema and keeps nothing at openai", async () => {
    const { client, calls } = fakeClient(completed(JSON.stringify(GOOD_ANSWER)));
    await analyzePhoto(deps(client), { images: [PLANK, "1730000000001-stenen.png"], lang: "en" });

    const params = calls[0];
    expect(params.model).toBe("gpt-6.1-terra");
    expect(params.store).toBe(false);
    expect(params.text.format).toMatchObject({ type: "json_schema", strict: true, schema: PHOTO_SCHEMA });
    expect(params.instructions).toContain("in English");

    const images = params.input[0].content.filter((part: any) => part.type === "input_image");
    expect(images).toHaveLength(2);
    expect(images[0].image_url).toBe(`data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64")}`);
    expect(images[1].image_url.startsWith("data:image/png;base64,")).toBe(true);
    expect(images[0].detail).toBe("high");
  });

  it("writes in Dutch unless English is asked for", async () => {
    const { client, calls } = fakeClient(completed(JSON.stringify(GOOD_ANSWER)));
    await analyzePhoto(deps(client), { images: [PLANK] });
    expect(calls[0].instructions).toContain("in Dutch");
  });

  it("turns a refusal into 422 AI_REFUSED, but still counts the cost", async () => {
    const refusal = {
      status: "completed",
      incomplete_details: null,
      output: [{ type: "message", content: [{ type: "refusal", refusal: "I can't help with that." }] }],
      output_text: "",
      usage: { input_tokens: 3000, output_tokens: 10 },
    };
    const { client } = fakeClient(refusal);
    const d = deps(client);
    expect(await analyzePhoto(d, { images: [PLANK] })).toEqual({ status: 422, body: { error: "AI_REFUSED" } });
    expect(d.usage.getTotals().calls).toBe(1);
  });

  it("turns a cut-off answer into 502 AI_FAILED with the reason", async () => {
    const cutOff = {
      ...completed('{"is_material": tr'),
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
    };
    const { client } = fakeClient(cutOff);
    expect(await analyzePhoto(deps(client), { images: [PLANK] })).toEqual({
      status: 502,
      body: { error: "AI_FAILED", reason: "max_output_tokens" },
    });
  });

  it("never passes on an answer that is not valid json or not valid values", async () => {
    const notJson = fakeClient(completed("sorry, no json"));
    expect((await analyzePhoto(deps(notJson.client), { images: [PLANK] })).body).toEqual({
      error: "AI_FAILED",
      reason: "INVALID_JSON",
    });

    const wrongType = fakeClient(completed(JSON.stringify({ ...GOOD_ANSWER, material_type: "plastic" })));
    expect((await analyzePhoto(deps(wrongType.client), { images: [PLANK] })).body).toEqual({
      error: "AI_FAILED",
      reason: "INVALID_ANSWER",
    });
  });

  it("turns a timeout into 504 AI_TIMEOUT", async () => {
    const { client } = fakeClient(new APIConnectionTimeoutError());
    expect(await analyzePhoto(deps(client), { images: [PLANK] })).toEqual({
      status: 504,
      body: { error: "AI_TIMEOUT" },
    });
  });

  it("turns an openai error into 502 AI_FAILED with the openai code (e.g. credit used up)", async () => {
    const quota = new APIError(429, { code: "insufficient_quota" }, "You exceeded your current quota", undefined);
    const { client } = fakeClient(quota);
    expect(await analyzePhoto(deps(client), { images: [PLANK] })).toEqual({
      status: 502,
      body: { error: "AI_FAILED", reason: "insufficient_quota" },
    });
  });
});
