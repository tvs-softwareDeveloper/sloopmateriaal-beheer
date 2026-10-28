// cost tracking for ai calls: calculates what a call costs, logs one line per call
// and keeps a running total since the server started (shown by GET /ai/status).
import { MODEL_PRICES } from "./aiConfig";

// the token counts as the openai responses api reports them (response.usage)
export type TokenUsage = {
  input_tokens: number;
  output_tokens: number; // includes reasoning tokens, those are billed as output
  input_tokens_details?: { cached_tokens?: number };
};

export type UsageEntry = {
  feature: string;
  model: string;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  // null = model not in MODEL_PRICES, so we can't say
  costUsd: number | null;
};

export type UsageTotals = {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

// cached input tokens are part of input_tokens but have their own (lower) price
export function costUsd(model: string, usage: TokenUsage): number | null {
  const price = MODEL_PRICES[model];
  if (!price) return null;

  const cached = usage.input_tokens_details?.cached_tokens ?? 0;
  const uncached = usage.input_tokens - cached;

  return (
    (uncached * price.input + cached * price.cachedInput + usage.output_tokens * price.output) /
    1_000_000
  );
}

export function createUsageTracker(log: (line: string) => void = console.log) {
  const totals: UsageTotals = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };

  function record(feature: string, model: string, ms: number, usage: TokenUsage): UsageEntry {
    const entry: UsageEntry = {
      feature,
      model,
      ms,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: costUsd(model, usage),
    };

    totals.calls += 1;
    totals.inputTokens += entry.inputTokens;
    totals.outputTokens += entry.outputTokens;
    totals.costUsd += entry.costUsd ?? 0;

    const cost = entry.costUsd === null ? "unknown" : `$${entry.costUsd.toFixed(6)}`;
    log(`[ai] ${feature} ${model} ${ms} ms in=${entry.inputTokens} out=${entry.outputTokens} ${cost}`);

    return entry;
  }

  // a copy, so nobody can change the totals from outside
  function getTotals(): UsageTotals {
    return { ...totals };
  }

  return { record, getTotals };
}

export type UsageTracker = ReturnType<typeof createUsageTracker>;
