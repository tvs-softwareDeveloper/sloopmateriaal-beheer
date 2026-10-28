// tests for the filters of the materials page and the smart search safety net for the type
import { describe, expect, it } from "vitest";
import { dropTypeIfEmpty, filterMaterials } from "../src/components/materials/filterMaterials";
import type { Filters } from "../src/components/materials/FilterPanel";
import type { Material } from "../src/types";

const NO_FILTERS: Filters = {
  search: "",
  type: "all",
  status: "all",
  condition: "all",
  sort: "-created_date",
  priceMin: null,
  priceMax: null,
  project: null,
  location: null,
  searchGroups: [],
  hiddenIds: [],
};

const material = (m: Partial<Material> & Pick<Material, "name" | "material_type">): Material => ({
  id: m.name,
  quantity: 1,
  status: "available",
  ...m,
});

// like the demo data: the copper water pipe is filed under metal, not plumbing
const MATERIALS: Material[] = [
  material({ name: "Koperen waterleiding 15 mm", material_type: "metal", price: 7.2, status: "sold" }),
  material({ name: "Radiatoren paneel type 22", material_type: "plumbing", price: 40, location: "Loods B" }),
  material({ name: "Stalen trapleuning", material_type: "metal", price: 60, location: "Loods A" }),
  material({ name: "Spaanplaat restpartij", material_type: "wood" }), // no price
];

const names = (list: Material[]) => list.map((m) => m.name);

describe("filterMaterials", () => {
  it("combines search words (in any word form) with the other filters", () => {
    expect(names(filterMaterials(MATERIALS, { ...NO_FILTERS, search: "staal" }))).toEqual(["Stalen trapleuning"]);
    expect(names(filterMaterials(MATERIALS, { ...NO_FILTERS, type: "metal", status: "sold" }))).toEqual([
      "Koperen waterleiding 15 mm",
    ]);
    expect(names(filterMaterials(MATERIALS, { ...NO_FILTERS, location: "Loods B" }))).toEqual([
      "Radiatoren paneel type 22",
    ]);
  });

  it("drops materials without a price from a price filter", () => {
    expect(names(filterMaterials(MATERIALS, { ...NO_FILTERS, priceMax: 50 }))).toEqual([
      "Koperen waterleiding 15 mm",
      "Radiatoren paneel type 22",
    ]);
  });
});

describe("dropTypeIfEmpty", () => {
  it("drops a type that is the only reason nothing was found", () => {
    // "koperen leidingen": the ai guessed plumbing, the data says metal
    const asked: Filters = { ...NO_FILTERS, search: "koper leiding", type: "plumbing" };
    const result = dropTypeIfEmpty(MATERIALS, asked);
    expect(result.droppedType).toBe("plumbing");
    expect(names(filterMaterials(MATERIALS, result.filters))).toEqual(["Koperen waterleiding 15 mm"]);
  });

  it("keeps the type when it finds something", () => {
    const asked: Filters = { ...NO_FILTERS, search: "radiator", type: "plumbing" };
    expect(dropTypeIfEmpty(MATERIALS, asked)).toEqual({ filters: asked, droppedType: null });
  });

  it("keeps the type when there are no search words, and when dropping it would not help", () => {
    const onlyType: Filters = { ...NO_FILTERS, type: "glass" };
    expect(dropTypeIfEmpty(MATERIALS, onlyType).droppedType).toBeNull();

    const nothingAnyway: Filters = { ...NO_FILTERS, search: "dakpan", type: "roofing" };
    expect(dropTypeIfEmpty(MATERIALS, nothingAnyway).droppedType).toBeNull();
  });
});

describe("smart search word groups and hidden materials", () => {
  it("needs one word from every group", () => {
    const heating: Filters = { ...NO_FILTERS, searchGroups: [["verwarming", "radiator", "cv"]] };
    expect(names(filterMaterials(MATERIALS, heating))).toEqual(["Radiatoren paneel type 22"]);

    const copperPipes: Filters = { ...NO_FILTERS, searchGroups: [["koper"], ["leiding", "buis"]] };
    expect(names(filterMaterials(MATERIALS, copperPipes))).toEqual(["Koperen waterleiding 15 mm"]);

    const steelPipes: Filters = { ...NO_FILTERS, searchGroups: [["staal"], ["leiding", "buis"]] };
    expect(filterMaterials(MATERIALS, steelPipes)).toEqual([]);
  });

  it("leaves out what the ai crossed off", () => {
    const hidden: Filters = { ...NO_FILTERS, hiddenIds: ["Stalen trapleuning"] };
    expect(names(filterMaterials(MATERIALS, hidden))).not.toContain("Stalen trapleuning");
    expect(filterMaterials(MATERIALS, hidden)).toHaveLength(3);
  });

  it("also drops the type when only word groups were given", () => {
    const asked: Filters = { ...NO_FILTERS, searchGroups: [["koper"], ["leiding"]], type: "plumbing" };
    expect(dropTypeIfEmpty(MATERIALS, asked).droppedType).toBe("plumbing");
  });
});
