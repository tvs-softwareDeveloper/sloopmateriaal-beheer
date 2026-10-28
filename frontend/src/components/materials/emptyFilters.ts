// the filters of the materials page with nothing filtered: the start value and what "clear all" goes back to.
// in its own file because a component file may only export components (react fast refresh).
import type { Filters } from "./FilterPanel";

export const EMPTY_FILTERS: Filters = {
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
