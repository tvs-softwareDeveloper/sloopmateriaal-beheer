// the /ai routes: tells the frontend which ai features work and guards every paid ai route.
// the order of the middleware matters:
//   1. GET /status       free, the frontend asks it on every page load, so no rate limit
//   2. key check         no key in .env -> 503 for every other ai route (the app keeps working)
//   3. rate limit        every paid route added after this is limited automatically
import express from "express";
import type { AiConfig } from "./aiConfig";
import { analyzePhoto, type AiClient } from "./photoAnalysis";
import { createRateLimiter } from "./rateLimit";
import { smartSearch, type CachedSearch, type KnownNames } from "./smartSearch";
import { createSearchCache } from "./searchCache";
import type { UsageTracker } from "./usage";

export type AiDeps = {
  config: AiConfig;
  usage: UsageTracker;
  // null without a key
  client: AiClient | null;
  // where the upload route puts the photos
  uploadsDir: string;
  // the project and location names smart search may pick from
  knownNames: () => Promise<KnownNames>;
};

// old: export function createAiRouter({ config, usage, client, uploadsDir }: AiDeps) {
export function createAiRouter({ config, usage, client, uploadsDir, knownNames }: AiDeps) {
  const router = express.Router();

  // which ai features work and what they cost so far. never contains the key.
  router.get("/status", (_req, res) => {
    res.json({
      enabled: config.enabled,
      models: config.models,
      usageSinceStart: usage.getTotals(),
    });
  });

  router.use((_req, res, next) => {
    if (!config.enabled) {
      return res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    }
    next();
  });

  router.use(createRateLimiter(config.rateLimitPerMinute));

  // body: { images: string[] (urls or names of uploaded photos, max 5), lang: "nl" | "en" }
  // answer: { suggestion, usage } or { error, reason? }
  router.post("/analyze-photo", async (req, res) => {
    const result = await analyzePhoto({ client, config, usage, uploadsDir }, req.body);
    res.status(result.status).json(result.body);
  });

  // body: { query: string (max 200 characters), lang: "nl" | "en" }
  // answer: { filters, explanation, usage } or { error, reason? }
  // one cache for all search questions as long as the server runs
  const searchCache = createSearchCache<CachedSearch>(config.search.cacheMs, config.search.cacheMaxEntries);
  router.post("/search", async (req, res) => {
    // old: const result = await smartSearch({ client, config, usage, knownNames }, req.body);
    const result = await smartSearch({ client, config, usage, knownNames, cache: searchCache }, req.body);
    res.status(result.status).json(result.body);
  });

  return router;
}
