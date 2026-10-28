// tests for the tolerant search: dutch word forms match each other, plain text still works
import { describe, expect, it } from "vitest";
import { matchesGroups, matchesSearch, stem } from "../src/components/materials/searchMatch";

describe("stem", () => {
  it("brings different forms of the same word back to one stem", () => {
    const sameStem: [string, string][] = [
      ["staal", "stalen"],
      ["balk", "balken"],
      ["glas", "glazen"],
      ["dakpan", "dakpannen"],
      ["deur", "deuren"],
      ["kraan", "kranen"],
      ["steen", "stenen"],
      ["eik", "eiken"],
      ["radiator", "radiatoren"],
      ["armatuur", "armaturen"],
      ["wastafel", "wastafels"],
      ["geel", "gele"],
      ["hout", "houten"],
    ];
    for (const [a, b] of sameStem) expect(stem(a), `${a} / ${b}`).toBe(stem(b));
  });

  it("leaves short words that end in s alone", () => {
    expect(stem("glas")).toBe("glas");
  });
});

describe("matchesSearch", () => {
  const steelBeams = "Stalen HEA 200-balken Lengte 6 m, licht roestig aan de uiteinden.";

  it("finds 'Stalen' when searching for 'staal' (the bug from smart search)", () => {
    expect(matchesSearch("staal", steelBeams)).toBe(true);
    expect(matchesSearch("stalen balk", steelBeams)).toBe(true);
  });

  it("needs every word to match", () => {
    expect(matchesSearch("staal balk", steelBeams)).toBe(true);
    expect(matchesSearch("staal deur", steelBeams)).toBe(false);
  });

  it("still finds plain text such as a qr code or a piece of a word", () => {
    expect(matchesSearch("mat-seed-007", "Stalen HEA 200-balken MAT-SEED-007")).toBe(true);
    expect(matchesSearch("hea 200", steelBeams)).toBe(true);
    expect(matchesSearch("deur", "Binnendeuren opdek wit")).toBe(true);
  });

  it("does not match unrelated materials", () => {
    expect(matchesSearch("staal", "Koperen waterleiding 15 mm")).toBe(false);
    expect(matchesSearch("glas", "Gele klinkers")).toBe(false);
  });

  it("matches a stem at the start or the end of a word, never in the middle", () => {
    // the false hit found while measuring: "stal" sits in the middle of "installateur"
    expect(matchesSearch("staal", "Groepenkast 8 groepen Niet gekeurd, alleen voor een erkend installateur.")).toBe(false);
    expect(matchesSearch("stenen", "Rode baksteen Waalformaat")).toBe(true);
    expect(matchesSearch("deuren", "Binnendeur opdek wit")).toBe(true);
    expect(matchesSearch("staal", "Kapstokken en garderoberekken, stevig staal.")).toBe(true);
  });

  it("matches everything for an empty search", () => {
    expect(matchesSearch("  ", "anything")).toBe(true);
  });
});

describe("matchesGroups", () => {
  it("needs one word or phrase from every group", () => {
    const groups = [["staal"], ["pijp", "buis", "leiding"]];
    expect(matchesGroups(groups, "Stalen buizen 48 mm")).toBe(true);
    expect(matchesGroups(groups, "Stalen pijpen")).toBe(true);
    expect(matchesGroups(groups, "Koperen buis")).toBe(false);
    expect(matchesGroups([["cv ketel", "radiator"]], "Remeha cv ketel")).toBe(true);
  });

  it("matches everything without groups", () => {
    expect(matchesGroups([], "anything")).toBe(true);
  });
});
