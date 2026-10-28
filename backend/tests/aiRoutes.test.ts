// tests for the /ai routes on a real express server (port 0 = any free port).
// none of these tests talks to openai: they only hit answers that come before any openai call,
// and the fake key never leaves this file.
import { afterEach, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "http";
import type { AddressInfo } from "net";
import fs from "fs";
import os from "os";
import path from "path";
import { readAiConfig } from "../src/ai/aiConfig";
import { createAiRouter } from "../src/ai/aiRoutes";
import type { AiClient } from "../src/ai/photoAnalysis";
import { createUsageTracker } from "../src/ai/usage";

const FAKE_KEY = "sk-test-never-show-this";
let server: Server | null = null;

async function start(
  env: NodeJS.ProcessEnv,
  rateLimitPerMinute?: number,
  client: AiClient | null = null,
  uploadsDir = os.tmpdir()
): Promise<string> {
  const config = readAiConfig(env);
  if (rateLimitPerMinute !== undefined) config.rateLimitPerMinute = rateLimitPerMinute;

  const app = express();
  app.use(express.json());
  const knownNames = async () => ({ projects: ["Sloop boerderij Dalfsen"], locations: ["Loods A"] });
  app.use("/ai", createAiRouter({ config, usage: createUsageTracker(() => {}), client, uploadsDir, knownNames }));

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server!.address() as AddressInfo;
  return `http://127.0.0.1:${port}/ai`;
}

afterEach(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  server = null;
});

describe("/ai without a key", () => {
  it("GET /status says ai is off", async () => {
    const base = await start({});
    const res = await fetch(`${base}/status`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(body.models).toEqual({ photo: "gpt-6.1-terra", search: "gpt-6-luna" });
    expect(body.usageSinceStart).toEqual({ calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 });
  });

  it("every other ai route answers 503, also routes that don't exist yet", async () => {
    const base = await start({});
    for (const path of ["/analyze-photo", "/search"]) {
      const res = await fetch(`${base}${path}`, { method: "POST" });
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "AI_NOT_CONFIGURED" });
    }
  });
});

describe("/ai with a key", () => {
  it("GET /status says ai is on and never contains the key", async () => {
    const base = await start({ OPENAI_API_KEY: FAKE_KEY, AI_MODEL_PHOTO: "gpt-6.1-terra" });
    const res = await fetch(`${base}/status`);
    const text = await res.text();
    expect(text).not.toContain(FAKE_KEY);
    const body = JSON.parse(text);
    expect(body.enabled).toBe(true);
    expect(body.models).toEqual({ photo: "gpt-6.1-terra", search: "gpt-6-luna" });
  });

  it("rate-limits the paid routes but never /status", async () => {
    const base = await start({ OPENAI_API_KEY: FAKE_KEY }, 2);

    // the route itself does not exist (404), but the limiter runs before it
    // old: these three calls used /search, which exists now
    expect((await fetch(`${base}/not-a-route`, { method: "POST" })).status).toBe(404);
    expect((await fetch(`${base}/not-a-route`, { method: "POST" })).status).toBe(404);
    expect((await fetch(`${base}/not-a-route`, { method: "POST" })).status).toBe(429);

    for (let i = 0; i < 5; i++) {
      expect((await fetch(`${base}/status`)).status).toBe(200);
    }
  });

  it("POST /analyze-photo answers with the suggestion from the (fake) client", async () => {
    const uploadsDir = fs.mkdtempSync(path.join(os.tmpdir(), "sloop-route-"));
    fs.writeFileSync(path.join(uploadsDir, "1730000000000-plank.jpg"), Buffer.from([0xff, 0xd8]));
    const answer = {
      is_material: true,
      name: "Eiken balken",
      material_type: "wood",
      unit: "pieces",
      condition: "good",
      notes: "",
      count: {
        count_notes: "3 lagen, 4 breed",
        method: "stack",
        sections: [{ rows: 3, columns: 4 }],
        loose_items: null,
        count_confidence: "medium",
      },
      confidence: "high",
    };
    const text = JSON.stringify(answer);
    const client = {
      responses: {
        create: async () => ({
          status: "completed",
          incomplete_details: null,
          output: [{ type: "message", content: [{ type: "output_text", text }] }],
          output_text: text,
          usage: { input_tokens: 3000, output_tokens: 100 },
        }),
      },
    } as unknown as AiClient;

    try {
      const base = await start({ OPENAI_API_KEY: FAKE_KEY }, undefined, client, uploadsDir);
      const res = await fetch(`${base}/analyze-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: ["http://localhost:3000/uploads/1730000000000-plank.jpg"], lang: "nl" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.suggestion.name).toBe("Eiken balken");
      // the backend did the sum: 3 layers x 4 across
      expect(body.suggestion.count).toEqual({
        method: "stack",
        sections: [{ rows: 3, columns: 4 }],
        total: 12,
        confidence: "medium",
        notes: "3 lagen, 4 breed",
      });
      expect(body.usage.inputTokens).toBe(3000);

      // the cost shows up in the status right away
      const status = await (await fetch(`${base}/status`)).json();
      expect(status.usageSinceStart.calls).toBe(1);
    } finally {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  });

  it("POST /search answers with filters, using the known project names", async () => {
    const answer = {
      search: null,
      type: "brick",
      status: "for_sale",
      condition: null,
      price_min: null,
      price_max: null,
      project: "sloop boerderij dalfsen",
      location: null,
      sort: "price",
      explanation: "Bakstenen te koop van project Sloop boerderij Dalfsen, goedkoopste eerst.",
    };
    const text = JSON.stringify(answer);
    const client = {
      responses: {
        create: async () => ({
          status: "completed",
          incomplete_details: null,
          output: [{ type: "message", content: [{ type: "output_text", text }] }],
          output_text: text,
          usage: { input_tokens: 700, output_tokens: 60 },
        }),
      },
    } as unknown as AiClient;

    const base = await start({ OPENAI_API_KEY: FAKE_KEY }, undefined, client);
    const res = await fetch(`${base}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "goedkoopste stenen te koop uit dalfsen", lang: "nl" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.filters).toMatchObject({ type: "brick", status: "for_sale", sort: "price", project: "Sloop boerderij Dalfsen" });
    expect(body.explanation).toBe(answer.explanation);
  });
});
