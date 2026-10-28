// tests for the search cache: the same question gets the same answer for a while, then it expires
import { describe, expect, it } from "vitest";
import { cacheKey, createSearchCache } from "../src/ai/searchCache";

const NAMES = { projects: ["Sloop boerderij Dalfsen"], locations: ["Loods A"] };

describe("cacheKey", () => {
  it("treats capitals, extra spaces and a question mark at the end as the same question", () => {
    const a = cacheKey({ query: "Kun je alle  stalen materialen zoeken?", lang: "nl", names: NAMES });
    const b = cacheKey({ query: "kun je alle stalen materialen zoeken", lang: "nl", names: NAMES });
    expect(a).toBe(b);
  });

  it("is a different question in another language or with other names", () => {
    const base = cacheKey({ query: "staal", lang: "nl", names: NAMES });
    expect(cacheKey({ query: "staal", lang: "en", names: NAMES })).not.toBe(base);
    expect(cacheKey({ query: "staal", lang: "nl", names: { ...NAMES, projects: ["Nieuw project"] } })).not.toBe(base);
  });
});

describe("createSearchCache", () => {
  it("gives back what was stored until the time is up", () => {
    let now = 0;
    const cache = createSearchCache<string>(1000, 10, () => now);
    cache.set("q", "answer");
    now = 999;
    expect(cache.get("q")).toBe("answer");
    now = 1000;
    expect(cache.get("q")).toBeUndefined();
  });

  it("drops the oldest question when it is full", () => {
    const cache = createSearchCache<string>(60_000, 2, () => 0);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
    expect(cache.size()).toBe(2);
  });
});
