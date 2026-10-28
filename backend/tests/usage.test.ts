// tests for the cost of an ai call and the running total
import { describe, expect, it } from "vitest";
import { costUsd, createUsageTracker } from "../src/ai/usage";

describe("costUsd", () => {
  it("uses the luna prices: $0.10 per 1M input and $0.50 per 1M output", () => {
    expect(costUsd("gpt-6-luna", { input_tokens: 1_000_000, output_tokens: 0 })).toBeCloseTo(0.1, 10);
    expect(costUsd("gpt-6-luna", { input_tokens: 0, output_tokens: 1_000_000 })).toBeCloseTo(0.5, 10);
  });

  it("matches the smoke test: a high-detail photo on terra", () => {
    // npm run ai:ping, 28-10-2026: in=2963 out=6 -> $0.002993
    expect(costUsd("gpt-6.1-terra", { input_tokens: 2963, output_tokens: 6 })).toBeCloseTo(0.002993, 9);
  });

  it("charges cached input tokens at the cached price", () => {
    // 1M input of which 400k cached: 600k * 0.10 + 400k * 0.01 = 0.064
    const cost = costUsd("gpt-6-luna", {
      input_tokens: 1_000_000,
      output_tokens: 0,
      input_tokens_details: { cached_tokens: 400_000 },
    });
    expect(cost).toBeCloseTo(0.064, 10);
  });

  it("returns null for a model without a known price", () => {
    expect(costUsd("some-new-model", { input_tokens: 100, output_tokens: 100 })).toBeNull();
  });
});

describe("createUsageTracker", () => {
  it("adds every call to the totals and logs one line per call", () => {
    const lines: string[] = [];
    const tracker = createUsageTracker((line) => lines.push(line));

    tracker.record("photo", "gpt-6-luna", 1200, { input_tokens: 3000, output_tokens: 200 });
    tracker.record("search", "some-new-model", 800, { input_tokens: 500, output_tokens: 50 });

    const totals = tracker.getTotals();
    expect(totals.calls).toBe(2);
    expect(totals.inputTokens).toBe(3500);
    expect(totals.outputTokens).toBe(250);
    // only the luna call has a price: 3000 * 0.10/1M + 200 * 0.50/1M
    expect(totals.costUsd).toBeCloseTo(0.0004, 10);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("photo gpt-6-luna 1200 ms in=3000 out=200");
    expect(lines[1]).toContain("unknown");
  });

  it("gives a copy of the totals, not the object itself", () => {
    const tracker = createUsageTracker(() => {});
    tracker.getTotals().calls = 99;
    expect(tracker.getTotals().calls).toBe(0);
  });
});
