// tests that the value lists in materialOptions.ts are exactly the ENUMs in database.sql,
// so the code and the database can't drift apart again
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { CONDITIONS, MATERIAL_TYPES, STATUSES, UNITS } from "../src/types/materialOptions";

// reads "column ENUM('a','b')" from database.sql, skipping commented-out lines
function enumsFromSql(): Record<string, string[]> {
  const sql = fs.readFileSync(path.resolve(process.cwd(), "database.sql"), "utf8");
  const enums: Record<string, string[]> = {};
  for (const line of sql.split(/\r?\n/)) {
    if (line.trim().startsWith("--")) continue;
    const match = line.match(/^\s*`?(\w+)`?\s+ENUM\(([^)]*)\)/i);
    if (match) enums[match[1]] = match[2].split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
  }
  return enums;
}

describe("materialOptions", () => {
  const enums = enumsFromSql();

  it("finds the four ENUM columns in database.sql", () => {
    expect(Object.keys(enums).sort()).toEqual(["condition", "material_type", "status", "unit"]);
  });

  it("matches the database exactly, in the same order", () => {
    expect([...MATERIAL_TYPES]).toEqual(enums.material_type);
    expect([...UNITS]).toEqual(enums.unit);
    expect([...STATUSES]).toEqual(enums.status);
    expect([...CONDITIONS]).toEqual(enums.condition);
  });
});
