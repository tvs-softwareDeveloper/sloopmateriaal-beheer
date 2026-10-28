// talks to the /ai routes of the backend: asks whether ai is switched on, turns uploaded photos into
// a suggestion for the material form and a question into filters for the materials list. also picks
// the message the user sees for every ai error.
import { useQuery } from "@tanstack/react-query";
import { API } from "../config";
import type { Material } from "../../types";

export type AiStatus = { enabled: boolean };

// what the backend suggests for the form (it never suggests price, status, project or location)
export type PhotoSuggestion = {
  is_material: boolean;
  name: string;
  material_type: Material["material_type"];
  unit: NonNullable<Material["unit"]>;
  condition: NonNullable<Material["condition"]> | null;
  notes: string;
  // old: quantity_hint: string | null;
  // how many pieces: per stack section rows x columns, the backend already worked out the total
  count: {
    method: "stack" | "loose" | "none";
    sections: { rows: number; columns: number }[];
    total: number | null;
    confidence: "low" | "medium" | "high";
    notes: string;
  };
  confidence: "low" | "medium" | "high";
};

// the error code from the backend, plus the reason when there is one (e.g. AI_FAILED / insufficient_quota)
export class AiError extends Error {
  code: string;
  reason?: string;

  constructor(code: string, reason?: string) {
    super(reason ? `${code} (${reason})` : code);
    this.code = code;
    this.reason = reason;
  }
}

// is ai on? asked once and kept for a minute. a backend that can't be reached counts as "off".
export function useAiStatus() {
  return useQuery<AiStatus>({
    queryKey: ["aiStatus"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API}/ai/status`);
        if (!res.ok) return { enabled: false };
        const body = await res.json();
        return { enabled: body.enabled === true };
      } catch {
        return { enabled: false };
      }
    },
    staleTime: 60_000,
  });
}

// images: the urls the upload route returned. lang: the app language, the ai writes name and notes in it
export async function analyzePhotos(images: string[], lang: string): Promise<PhotoSuggestion> {
  let res: Response;
  try {
    res = await fetch(`${API}/ai/analyze-photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images, lang: lang === "nl" ? "nl" : "en" }),
    });
  } catch {
    throw new AiError("NETWORK");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiError(body.error ?? "AI_FAILED", body.reason);
  return body.suggestion as PhotoSuggestion;
}

// the filters smart search found; "all" = no filter, sort null = keep the current sort
export type AiSearchFilters = {
  search: string;
  type: "all" | Material["material_type"];
  status: "all" | Material["status"];
  condition: "all" | NonNullable<Material["condition"]>;
  sort: string | null;
  priceMin: number | null;
  priceMax: number | null;
  project: string | null;
  location: string | null;
};

// query: the question as typed. lang: the app language, the explanation comes back in it
export async function searchWithAi(
  query: string,
  lang: string
): Promise<{ filters: AiSearchFilters; explanation: string }> {
  let res: Response;
  try {
    res = await fetch(`${API}/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, lang: lang === "nl" ? "nl" : "en" }),
    });
  } catch {
    throw new AiError("NETWORK");
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiError(body.error ?? "AI_FAILED", body.reason);
  return { filters: body.filters as AiSearchFilters, explanation: String(body.explanation ?? "") };
}

// translation key of the message for an ai error
export function aiErrorKey(err: unknown): string {
  if (!(err instanceof AiError)) return "aiErrorFailed";

  switch (err.code) {
    case "INVALID_INPUT":
      if (err.reason === "UNSUPPORTED_IMAGE") return "aiErrorUnsupported";
      if (err.reason === "IMAGE_TOO_LARGE") return "aiErrorTooLarge";
      if (err.reason === "QUERY_TOO_LONG") return "aiErrorQueryTooLong";
      return "aiErrorInput";
    case "AI_RATE_LIMITED":
      return "aiErrorRateLimited";
    case "AI_TIMEOUT":
      return "aiErrorTimeout";
    case "AI_REFUSED":
      return "aiErrorRefused";
    case "AI_NOT_CONFIGURED":
      return "aiErrorOff";
    case "AI_FAILED":
      return err.reason === "insufficient_quota" ? "aiErrorQuota" : "aiErrorFailed";
    case "NETWORK":
      return "aiErrorNetwork";
    default:
      return "aiErrorFailed";
  }
}
