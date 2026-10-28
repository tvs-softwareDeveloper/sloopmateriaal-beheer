// which materials pass the filters of the materials page (search words, type, status, condition, price,
// project, location). no sorting, the page does that. smart search also uses it to check its filters
// before they are shown.
import type { Material } from "../../types";
import type { Filters } from "./FilterPanel";
// old: import { matchesSearch } from "./searchMatch";
import { matchesGroups, matchesSearch } from "./searchMatch";

export function filterMaterials(materials: Material[], filters: Filters): Material[] {
  return materials.filter((m) => {
    // what smart search crossed off as not fitting the question (can be shown again with the chip)
    if (filters.hiddenIds.length > 0 && m.id && filters.hiddenIds.includes(m.id)) return false;
    // one word from every group of smart search, so "verwarming" also finds radiators
    if (
      filters.searchGroups.length > 0 &&
      !matchesGroups(filters.searchGroups, [m.name, m.location, m.project_name, m.notes].filter(Boolean).join(" "))
    ) {
      return false;
    }
    // every search word somewhere, also in another form of the word ("staal" finds "Stalen")
    if (
      filters.search.trim() &&
      !matchesSearch(filters.search, [m.name, m.location, m.project_name, m.qr_code, m.notes].filter(Boolean).join(" "))
    ) {
      return false;
    }
    if (filters.type !== "all" && m.material_type !== filters.type) return false;
    if (filters.status !== "all" && m.status !== filters.status) return false;
    if (filters.condition !== "all" && m.condition !== filters.condition) return false;
    // a material without a price drops out of a price filter
    if (filters.priceMin !== null && (m.price === undefined || m.price < filters.priceMin)) return false;
    if (filters.priceMax !== null && (m.price === undefined || m.price > filters.priceMax)) return false;
    if (filters.project !== null && m.project_name !== filters.project) return false;
    if (filters.location !== null && m.location !== filters.location) return false;
    return true;
  });
}

// safety net for smart search. the type is the shakiest filter: how a material is classified is a choice in
// the data that the ai can't know (copper pipes can be "metal" or "plumbing"). so when the ai's filters find
// nothing, but its search words would find something without the type, the type is dropped.
// only with search words: without them dropping the type would show things the question never asked for.
export function dropTypeIfEmpty(
  materials: Material[],
  filters: Filters
): { filters: Filters; droppedType: Exclude<Filters["type"], "all"> | null } {
  // old: if (filters.type === "all" || !filters.search.trim()) return { filters, droppedType: null };
  const hasWords = filters.search.trim() !== "" || filters.searchGroups.length > 0;
  if (filters.type === "all" || !hasWords) return { filters, droppedType: null };
  if (filterMaterials(materials, filters).length > 0) return { filters, droppedType: null };

  const withoutType: Filters = { ...filters, type: "all" };
  return filterMaterials(materials, withoutType).length > 0
    ? { filters: withoutType, droppedType: filters.type }
    : { filters, droppedType: null };
}
