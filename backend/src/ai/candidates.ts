// reads name and type of the materials smart search found, for the step where the ai crosses off what
// doesn't fit. read from the database by id, so a browser can't slip its own text into the prompt.
import { db } from "../db";
import type { Candidate } from "./narrowResults";

export async function loadCandidates(ids: string[]): Promise<Candidate[]> {
  if (ids.length === 0) return [];
  const [rows] = await db.query("SELECT id, name, material_type FROM materials WHERE id IN (?) ORDER BY id", [ids]);
  return rows as Candidate[];
}
