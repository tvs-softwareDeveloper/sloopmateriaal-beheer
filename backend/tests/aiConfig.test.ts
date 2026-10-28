// tests for readAiConfig: ai on or off, a clean key and the model per feature
import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL, readAiConfig } from "../src/ai/aiConfig";

describe("readAiConfig", () => {
  it("is off without a key, and uses terra for photos and luna for search", () => {
    const config = readAiConfig({});
    expect(config.enabled).toBe(false);
    expect(config.apiKey).toBeNull();
    expect(config.models).toEqual({ photo: "gpt-6.1-terra", search: "gpt-6-luna" });
    expect(DEFAULT_MODEL).toBe("gpt-6-luna");
  });

  it("treats an empty or blank key as no key", () => {
    expect(readAiConfig({ OPENAI_API_KEY: "" }).enabled).toBe(false);
    expect(readAiConfig({ OPENAI_API_KEY: "   " }).enabled).toBe(false);
  });

  it("is on with a key and trims spaces around it", () => {
    const config = readAiConfig({ OPENAI_API_KEY: " sk-test " });
    expect(config.enabled).toBe(true);
    expect(config.apiKey).toBe("sk-test");
  });

  it("lets .env pick a model per feature", () => {
    const config = readAiConfig({
      OPENAI_API_KEY: "sk-test",
      AI_MODEL_PHOTO: "gpt-6-luna",
      AI_MODEL_SEARCH: "gpt-6.1-terra",
    });
    expect(config.models).toEqual({ photo: "gpt-6-luna", search: "gpt-6.1-terra" });
  });
});
