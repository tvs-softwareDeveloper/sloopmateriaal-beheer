// ai settings: reads the openai key, the model per feature and the limits from .env,
// plus the price list that is used to calculate what a call costs.

export type AiFeature = "photo" | "search";

export type AiConfig = {
  // false = no key in .env: the ai routes answer 503 and the app works as before
  enabled: boolean;
  apiKey: string | null;
  models: Record<AiFeature, string>;
  // one call may take this long before we give up (the openai package counts retries separately)
  timeoutMs: number;
  maxRetries: number;
  // max paid ai calls per ip per minute. the backend has no login, so this protects the credit
  rateLimitPerMinute: number;
  photo: {
    // 'high' fits the photo in 2048x2048 (about 3000 tokens), enough to see cracks and rust.
    // never 'auto': for these models that means the original size, about 14000 tokens per phone photo
    detail: "low" | "high";
    maxImages: number;
    maxImageBytes: number;
    reasoningEffort: "none" | "low" | "medium" | "high";
    maxOutputTokens: number;
  };
  search: {
    maxQueryLength: number;
    // at most this many project and location names go along in the prompt
    maxNames: number;
    reasoningEffort: "none" | "low" | "medium" | "high";
    maxOutputTokens: number;
    temperature: number;
    // the same question within this time gets the same answer from memory, without a new call
    cacheMs: number;
    cacheMaxEntries: number;
    // second step: the ai crosses off the found materials that don't fit the question. above this many
    // candidates that step is skipped and everything that was found stays visible
    maxCandidates: number;
    narrowMaxOutputTokens: number;
  };
};

// GPT-6 Luna: the cheapest model that is not deprecated
export const DEFAULT_MODEL = "gpt-6-luna";

// the default per feature. photos use GPT-6.1 Terra, made for visual reasoning: on a stack of planks only terra
// counted the two bundles separately, like a person would. about 10x the price of luna, still half a cent per photo.
export const DEFAULT_MODELS: Record<AiFeature, string> = {
  photo: "gpt-6.1-terra",
  search: DEFAULT_MODEL,
};

// usd per 1 million tokens, from developers.openai.com/api/docs/pricing (checked 28-10-2026).
// a model that is not in this list still works, its cost just shows up as unknown.
export const MODEL_PRICES: Record<string, { input: number; cachedInput: number; output: number }> = {
  "gpt-6-luna": { input: 0.1, cachedInput: 0.01, output: 0.5 },
  "gpt-6.1-terra": { input: 1, cachedInput: 0.05, output: 5 },
};

// takes the env as a parameter so tests can pass their own
export function readAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  const apiKey = env.OPENAI_API_KEY?.trim() || null;

  return {
    enabled: apiKey !== null,
    apiKey,
    models: {
      // old: photo: env.AI_MODEL_PHOTO?.trim() || DEFAULT_MODEL,
      photo: env.AI_MODEL_PHOTO?.trim() || DEFAULT_MODELS.photo,
      search: env.AI_MODEL_SEARCH?.trim() || DEFAULT_MODELS.search,
    },
    timeoutMs: 20_000,
    maxRetries: 1,
    rateLimitPerMinute: 20,
    photo: {
      detail: "high",
      maxImages: 5, // same as the form
      maxImageBytes: 20 * 1024 * 1024,
      // fastest answer. measured on the plank stack: terra without thinking counted as well as with it, and steadier
      reasoningEffort: "none",
      maxOutputTokens: 800,
    },
    search: {
      maxQueryLength: 200,
      maxNames: 100,
      reasoningEffort: "none", // a search box has to answer fast
      maxOutputTokens: 400,
      // measured: without it "alle stalen materialen" gave other filters 2 out of 8 times
      temperature: 0,
      cacheMs: 10 * 60 * 1000,
      cacheMaxEntries: 200,
      // 50 names and types are about 1000 tokens, a tenth of a cent with luna
      maxCandidates: 50,
      narrowMaxOutputTokens: 300,
    },
  };
}
