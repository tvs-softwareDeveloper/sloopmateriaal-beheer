// tests for the per-ip limit on paid ai calls
import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { createRateLimiter } from "../src/ai/rateLimit";

// a tiny stand-in for express: enough for the middleware, no server needed
function call(limiter: ReturnType<typeof createRateLimiter>, ip: string) {
  const result = { passed: false, status: 200, body: undefined as unknown, headers: {} as Record<string, string> };
  const res = {
    setHeader(name: string, value: string) {
      result.headers[name] = value;
    },
    status(code: number) {
      result.status = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };
  limiter({ ip } as Request, res as unknown as Response, () => {
    result.passed = true;
  });
  return result;
}

describe("createRateLimiter", () => {
  it("lets 20 calls through and blocks the 21st within a minute", () => {
    let now = 0;
    const limiter = createRateLimiter(20, 60_000, () => now);

    for (let i = 0; i < 20; i++) expect(call(limiter, "1.1.1.1").passed).toBe(true);

    now = 30_000;
    const blocked = call(limiter, "1.1.1.1");
    expect(blocked.passed).toBe(false);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: "AI_RATE_LIMITED", retryAfterSec: 30 });
    expect(blocked.headers["Retry-After"]).toBe("30");
  });

  it("allows calls again once the minute is over", () => {
    let now = 0;
    const limiter = createRateLimiter(2, 60_000, () => now);
    call(limiter, "1.1.1.1");
    call(limiter, "1.1.1.1");
    expect(call(limiter, "1.1.1.1").passed).toBe(false);

    now = 60_000;
    expect(call(limiter, "1.1.1.1").passed).toBe(true);
  });

  it("counts every ip on its own", () => {
    const limiter = createRateLimiter(1, 60_000, () => 0);
    expect(call(limiter, "1.1.1.1").passed).toBe(true);
    expect(call(limiter, "2.2.2.2").passed).toBe(true);
    expect(call(limiter, "1.1.1.1").passed).toBe(false);
  });
});
