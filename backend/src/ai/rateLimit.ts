// rate limiter middleware: allows a max number of ai calls per ip per minute, so nobody can use up
// the openai credit (the backend has no login). kept in memory: fine for one server.
import type { Request, Response, NextFunction } from "express";

type Window = { startMs: number; count: number };

export function createRateLimiter(
  limitPerWindow: number,
  windowMs = 60_000,
  now: () => number = Date.now
) {
  const windows = new Map<string, Window>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? "unknown";
    const t = now();

    // drop finished windows so the map does not keep growing
    for (const [k, w] of windows) {
      if (t - w.startMs >= windowMs) windows.delete(k);
    }

    const current = windows.get(key) ?? { startMs: t, count: 0 };
    if (current.count >= limitPerWindow) {
      const retryAfterSec = Math.ceil((current.startMs + windowMs - t) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: "AI_RATE_LIMITED", retryAfterSec });
    }

    current.count += 1;
    windows.set(key, current);
    next();
  };
}
