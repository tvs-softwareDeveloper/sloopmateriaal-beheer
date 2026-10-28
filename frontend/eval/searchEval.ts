// measures smart search on the demo data: for a fixed set of questions with synonyms, how many of the expected
// materials are found and how many wrong ones come along, after step 1 (word groups) and after step 2 (the ai
// crosses off what doesn't fit). talks to the running backend, so it costs a little: about $0.003 per run.
// usage: start the backend (npm run dev in backend/), then npm run eval:search in frontend/
import { filterMaterials, dropTypeIfEmpty } from "../src/components/materials/filterMaterials";
import { EMPTY_FILTERS } from "../src/components/materials/emptyFilters";

const API = process.env.EVAL_API ?? "http://localhost:3000";

// expected: what a person would expect for the question. alsoFine: defensible, not counted as wrong.
// the codes are the qr codes of the demo data (seed.sql). control: questions that were never used to tune the
// instructions, to see whether a change also helps on questions it was not made for
const QUESTIONS: { query: string; expected: string[]; alsoFine?: string[]; control?: boolean }[] = [
  { query: "verlichting", expected: ["023"] },
  { query: "verwarming", expected: ["026", "032"], alsoFine: ["027"] },
  { query: "ramen", expected: ["010", "020", "022"], alsoFine: ["021", "040"] },
  { query: "wc's", expected: ["033"] },
  { query: "buizen", expected: ["008", "035"] },
  { query: "planken", expected: ["002", "003"], alsoFine: ["006"] },
  { query: "stalen pijpen", expected: [] },
  { query: "stenen", expected: ["016", "017", "018", "039", "040"], alsoFine: ["019"] },
  { query: "sanitair", expected: ["033", "034"], alsoFine: ["024", "032"] },
  { query: "dakmateriaal", expected: ["009", "029", "030", "031"] },
  { query: "witgoed", expected: ["028"], alsoFine: ["026", "027"] },
  { query: "elektra", expected: ["036", "037", "038"], alsoFine: ["023"] },
  { query: "keukens", expected: ["024"], control: true },
  { query: "kabels", expected: ["038"], alsoFine: ["037"], control: true },
  { query: "vloeren", expected: ["002", "005"], alsoFine: ["014"], control: true },
  { query: "tegels", expected: ["014"], alsoFine: ["019"], control: true },
];

// the backend allows 20 paid calls a minute; one question is up to two calls
const PAUSE_MS = 3200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Material = { id: string; name: string; qr_code?: string; [key: string]: unknown };

async function post(path: string, body: object) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any };
}

const code = (m: Material) => (m.qr_code ?? "").replace("MAT-SEED-", "");

function score(found: Material[], expected: string[], alsoFine: string[]) {
  const codes = found.map(code);
  const hits = expected.filter((c) => codes.includes(c));
  const wrong = found.filter((m) => !expected.includes(code(m)) && !alsoFine.includes(code(m)));
  return { hits: hits.length, wrong };
}

async function main() {
  const materials = (await (await fetch(`${API}/materials`)).json()) as Material[];
  console.log(`${materials.length} materials, ${QUESTIONS.length} questions\n`);

  const empty = () => ({ expected: 0, hitsA: 0, wrongA: 0, hitsAB: 0, wrongAB: 0 });
  const sums = { tuned: empty(), control: empty() };
  const total = { cost: 0, ms: 0 };
  const lines: string[] = [];

  for (const q of QUESTIONS) {
    const search = await post("/ai/search", { query: q.query, lang: "nl" });
    if (search.status !== 200) {
      console.log(`${q.query}: search failed ${search.status} ${JSON.stringify(search.body)}`);
      continue;
    }
    total.cost += search.body.usage?.costUsd ?? 0;
    let ms = search.body.usage?.ms ?? 0;

    // the same steps as the filter panel
    const proposed = { ...EMPTY_FILTERS, ...search.body.filters, sort: EMPTY_FILTERS.sort };
    const { filters } = dropTypeIfEmpty(materials as any, proposed);
    const stepA = filterMaterials(materials as any, filters) as unknown as Material[];

    let hidden: string[] = [];
    if (filters.searchGroups.length > 0 && stepA.length > 0 && stepA.length <= 50) {
      await sleep(PAUSE_MS);
      const narrow = await post("/ai/narrow", { query: q.query, ids: stepA.map((m) => m.id) });
      if (narrow.status === 200) {
        hidden = narrow.body.hide;
        total.cost += narrow.body.usage?.costUsd ?? 0;
        ms += narrow.body.usage?.ms ?? 0;
      } else {
        console.log(`${q.query}: narrow failed ${narrow.status} ${JSON.stringify(narrow.body)}`);
      }
    }
    const stepAB = stepA.filter((m) => !hidden.includes(m.id));
    total.ms += ms;

    const a = score(stepA, q.expected, q.alsoFine ?? []);
    const ab = score(stepAB, q.expected, q.alsoFine ?? []);
    const sum = q.control ? sums.control : sums.tuned;
    sum.expected += q.expected.length;
    sum.hitsA += a.hits;
    sum.wrongA += a.wrong.length;
    sum.hitsAB += ab.hits;
    sum.wrongAB += ab.wrong.length;

    const groups = filters.searchGroups.map((g: string[]) => g.join("/")).join(" + ") || "-";
    const type = filters.type === "all" ? "" : ` type=${filters.type}`;
    lines.push(
      `| ${q.query}${q.control ? " (controle)" : ""} | ${groups}${type} | ${a.hits}/${q.expected.length} | ${a.wrong.map((m) => m.name).join(", ") || "-"} | ` +
        `${ab.hits}/${q.expected.length} | ${ab.wrong.map((m) => m.name).join(", ") || "-"} |`
    );
    await sleep(PAUSE_MS);
  }

  console.log("| Vraag | Woordgroepen | A gevonden | A onterecht | A+B gevonden | A+B onterecht |");
  console.log("|---|---|---|---|---|---|");
  for (const line of lines) console.log(line);
  for (const [label, sum] of [["Testvragen", sums.tuned], ["Controlevragen", sums.control]] as const) {
    console.log(
      `\n${label}: A ${sum.hitsA}/${sum.expected} gevonden, ${sum.wrongA} onterecht. ` +
        `A+B ${sum.hitsAB}/${sum.expected} gevonden, ${sum.wrongAB} onterecht.`
    );
  }
  console.log(`Kosten $${total.cost.toFixed(5)}, gemiddeld ${Math.round(total.ms / QUESTIONS.length)} ms ai-tijd per vraag.`);
}

main().catch((err) => {
  console.log(`FAIL: ${err.message}`);
  process.exit(1);
});
