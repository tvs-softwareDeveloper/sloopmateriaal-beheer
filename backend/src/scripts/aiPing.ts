// smoke test for the openai connection (`npm run ai:ping`): checks that the key works, that the
// model names exist and what an image really costs. sends a few tiny calls to luna and terra
// (together well under 1 cent). never prints the key.
import zlib from "zlib";
import dotenv from "dotenv";
import type OpenAI from "openai";
import { MODEL_PRICES, readAiConfig } from "../ai/aiConfig";
import { createOpenAiClient } from "../ai/openaiClient";
import { createUsageTracker } from "../ai/usage";

dotenv.config({ quiet: true });

// a photo-sized test image (2048x1536, brown wood-like stripes), made here so we need no file.
// 'high' detail scales it into 2048x2048 and max 2500 patches: about what a real phone photo costs.
function makeTestPng(width: number, height: number): Buffer {
  const row = Buffer.alloc(1 + width * 3); // first byte of each row = png filter type 0
  for (let x = 0; x < width; x++) {
    const grain = Math.sin(x / 9) * 18 + Math.sin(x / 41) * 12;
    row[1 + x * 3] = 150 + grain; // r
    row[2 + x * 3] = 95 + grain * 0.7; // g
    row[3 + x * 3] = 50 + grain * 0.4; // b
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));

  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([Buffer.from(type), data])));
    return Buffer.concat([length, Buffer.from(type), data, crc]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits per channel
  header[9] = 2; // rgb

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main() {
  const config = readAiConfig();
  const client = createOpenAiClient(config);
  if (!client) {
    console.log("FAIL: no OPENAI_API_KEY in backend/.env");
    process.exit(1);
  }

  const usage = createUsageTracker();
  const imageUrl = `data:image/png;base64,${makeTestPng(2048, 1536).toString("base64")}`;
  const models = Object.keys(MODEL_PRICES); // luna and terra

  type Check = { name: string; model: string; input: OpenAI.Responses.ResponseCreateParams["input"] };
  const checks: Check[] = [];
  for (const model of models) {
    checks.push({ name: "text", model, input: "Antwoord met precies één woord: ok" });
    for (const detail of ["high", "low"] as const) {
      checks.push({
        name: `image-${detail}`,
        model,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Welke kleur overheerst in deze afbeelding? Antwoord met één Nederlands woord." },
              { type: "input_image", image_url: imageUrl, detail },
            ],
          },
        ],
      });
    }
  }

  let failed = 0;
  for (const check of checks) {
    const start = Date.now();
    try {
      const response = await client.responses.create({
        model: check.model,
        input: check.input,
        reasoning: { effort: "none" },
        max_output_tokens: 50,
      });
      const ms = Date.now() - start;
      if (response.usage) usage.record(`ping:${check.name}`, check.model, ms, response.usage);
      console.log(`  OK   ${check.model} ${check.name}: "${response.output_text.trim()}"`);
    } catch (err: any) {
      failed++;
      console.log(`  FAIL ${check.model} ${check.name}: ${err?.status ?? ""} ${err?.code ?? ""} ${err?.message ?? err}`);
    }
  }

  const totals = usage.getTotals();
  console.log(`\n${checks.length - failed}/${checks.length} ok, ${totals.calls} calls, total $${totals.costUsd.toFixed(6)}`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
