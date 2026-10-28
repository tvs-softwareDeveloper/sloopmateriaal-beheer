// creates the openai client from the ai settings. the only place where the key is used:
// it stays in the backend, never goes to the frontend and is never logged.
import OpenAI from "openai";
import type { AiConfig } from "./aiConfig";

// null when there is no key; callers check config.enabled first
export function createOpenAiClient(config: AiConfig): OpenAI | null {
  if (!config.apiKey) return null;

  return new OpenAI({
    apiKey: config.apiKey,
    timeout: config.timeoutMs,
    maxRetries: config.maxRetries,
  });
}
