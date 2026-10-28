// reads the project and location names that exist in the database, for smart search. only the names go
// to openai, never prices, amounts or other stock data.
import { db } from "../db";
import type { KnownNames } from "./smartSearch";

async function distinct(column: "project_name" | "location", limit: number): Promise<string[]> {
  const [rows] = await db.query(
    `SELECT DISTINCT ${column} AS name FROM materials WHERE ${column} IS NOT NULL AND ${column} <> '' ORDER BY name LIMIT ?`,
    [limit]
  );
  return (rows as { name: string }[]).map((row) => row.name);
}

export function createKnownNames(limit: number) {
  return async (): Promise<KnownNames> => ({
    projects: await distinct("project_name", limit),
    locations: await distinct("location", limit),
  });
}
