import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import type { Material } from "../../types";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../LanguageContext";
// old: import { aiErrorKey, searchWithAi, useAiStatus } from "../ai/aiApi";
import { aiErrorKey, MAX_NARROW_CANDIDATES, narrowWithAi, searchWithAi, useAiStatus } from "../ai/aiApi";
import { EMPTY_FILTERS } from "./emptyFilters";
// old: import { dropTypeIfEmpty } from "./filterMaterials";
import { dropTypeIfEmpty, filterMaterials } from "./filterMaterials";

type TranslationFunction = (key: string) => string;

export type Filters = {
  search: string;
  type: "all" | Material["material_type"];
  status: "all" | Material["status"];
  condition: "all" | NonNullable<Material["condition"]>;
  sort: string;
  // set by smart search, shown as chips. null = no filter on that field
  priceMin: number | null;
  priceMax: number | null;
  project: string | null;
  location: string | null;
  // smart search: one word from every group has to match ([] = none), and the ids the ai crossed off
  // as not fitting the question ([] = none)
  searchGroups: string[][];
  hiddenIds: string[];
};

type FilterPanelProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  t: (key: string) => string;
  // all materials, so smart search can check its filters before showing them (see dropTypeIfEmpty)
  materials?: Material[];
};

const getMaterialTypes = (t: TranslationFunction) => [
  { value: "all", label: t("allTypes") },
  { value: "wood", label: t("wood") },
  { value: "metal", label: t("metal") },
  { value: "concrete", label: t("concrete") },
  { value: "brick", label: t("brick") },
  { value: "glass", label: t("glass") },
  { value: "fixtures", label: t("fixtures") },
  { value: "appliances", label: t("appliances") },
  { value: "roofing", label: t("roofing") },
  { value: "plumbing", label: t("plumbing") },
  { value: "electrical", label: t("electrical") },
  { value: "other", label: t("other") },
];

const getStatuses = (t: TranslationFunction) => [
  { value: "all", label: t("allStatuses") },
  { value: "available", label: t("available") },
  { value: "reserved", label: t("reserved") },
  { value: "for_sale", label: t("forSale") },
  { value: "for_reuse", label: t("forReuse") },
  { value: "for_disposal", label: t("forDisposal") },
  { value: "sold", label: t("sold") },
  // recycled was missing here, the database knows it too
  { value: "recycled", label: t("recycled") },
  { value: "disposed", label: t("disposed") },
];

const getConditions = (t: TranslationFunction) => [
  { value: "all", label: t("allConditions") },
  { value: "excellent", label: t("excellent") },
  { value: "good", label: t("good") },
  { value: "fair", label: t("fair") },
  { value: "poor", label: t("poor") },
];

const getSortOptions = (t: TranslationFunction) => [
  { value: "-created_date", label: t("newestFirst") },
  { value: "created_date", label: t("oldestFirst") },
  { value: "name", label: t("nameAZ") },
  { value: "-name", label: t("nameZA") },
  { value: "-quantity", label: t("quantityHighLow") },
  { value: "quantity", label: t("quantityLowHigh") },
  { value: "-price", label: t("priceHighLow") },
  { value: "price", label: t("priceLowHigh") },
];

// the x on a filter chip, as a real button. the badge turns clicks off for an svg placed directly in it,
// so the old <X onClick> on the chips never received a click and no chip could be removed.
// padding 0 inline: index.css gives every button padding outside the tailwind layers.
const ChipRemove = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    style={{ padding: 0 }}
    className="ml-1 rounded-full bg-transparent hover:bg-transparent text-slate-500 hover:text-slate-900"
  >
    <X className="w-3 h-3" />
  </button>
);

export default function FilterPanel({
  filters,
  setFilters,
  t,
  materials,
}: FilterPanelProps) {
  const materialTypes = getMaterialTypes(t);
  const statuses = getStatuses(t);
  const conditions = getConditions(t);
  const sortOptions = getSortOptions(t);

  const activeFilterCount = [
    filters.type !== "all",
    filters.status !== "all",
    filters.condition !== "all",
    filters.search,
    // the four filters smart search can set
    filters.priceMin !== null,
    filters.priceMax !== null,
    filters.project !== null,
    filters.location !== null,
    filters.searchGroups.length > 0,
    filters.hiddenIds.length > 0,
  ].filter(Boolean).length;

  // smart search: with the button on, the search box takes a question and Enter asks the ai for filters.
  // the explanation says in one sentence what the ai searched for.
  const { language } = useLanguage();
  const { data: aiStatus } = useAiStatus();
  const [smartMode, setSmartMode] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [explanation, setExplanation] = React.useState<string | null>(null);

  const runSmartSearch = async () => {
    const q = question.trim();
    if (!q || searching) return;
    setSearching(true);
    try {
      const { filters: found, explanation } = await searchWithAi(q, language);
      // a new question is a new search: every filter comes from the answer, only the sort stays when the ai gave none
      // old: setFilters((prev) => ({ ...EMPTY_FILTERS, ...found, sort: found.sort ?? prev.sort }));
      const proposed: Filters = { ...EMPTY_FILTERS, ...found, sort: found.sort ?? filters.sort };
      // the type is dropped when it is the only reason nothing was found, and the explanation says so
      const checked = materials ? dropTypeIfEmpty(materials, proposed) : { filters: proposed, droppedType: null };

      // second step: the ai crosses off what the word groups found but doesn't fit the question ("licht" in
      // "licht roestig"). only after a word search, pure filters like type or price are exact. when it fails
      // or there are too many, everything that was found simply stays visible
      let hiddenIds: string[] = [];
      if (materials && checked.filters.searchGroups.length > 0) {
        const ids = filterMaterials(materials, checked.filters)
          .map((m) => m.id)
          .filter((id): id is string => !!id);
        if (ids.length > 0 && ids.length <= MAX_NARROW_CANDIDATES) {
          hiddenIds = await narrowWithAi(q, ids).catch(() => []);
        }
      }

      // old: setFilters(checked.filters);
      setFilters({ ...checked.filters, hiddenIds });
      // old: setExplanation(checked.droppedType ? `${explanation} ${...aiSearchTypeDropped...}` : explanation);
      setExplanation(
        [
          explanation,
          checked.droppedType ? t("aiSearchTypeDropped").replace("{type}", t(checked.droppedType)) : null,
          hiddenIds.length > 0 ? t("aiSearchNarrowed").replace("{n}", String(hiddenIds.length)) : null,
        ]
          .filter(Boolean)
          .join(" ")
      );
    } catch (err) {
      // the ai could not help: search for the typed text the normal way
      setFilters((prev) => ({ ...prev, search: q }));
      setExplanation(null);
      // the general ai messages talk about photos and the form, so search has its own
      const key = aiErrorKey(err);
      const message = key === "aiErrorFailed" || key === "aiErrorRefused" ? t("aiSearchFailed") : t(key);
      toast.error(`${message} ${t("aiSearchFallback")}`);
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    // old: setFilters({ search: "", type: "all", status: "all", condition: "all", sort: "-created_date" });
    setFilters(EMPTY_FILTERS);
    setExplanation(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* the search box, and next to it the smart search switch (only when ai is on) */}
        <div className="flex gap-2 w-full sm:w-auto">
        {smartMode ? (
          // smart search: a question, Enter or the button asks the ai
          <div className="relative w-full sm:w-[420px]">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSmartSearch();
              }}
              enterKeyHint="search"
              maxLength={200}
              disabled={searching}
              placeholder={t("aiSearchPlaceholder")}
              className="pl-10 pr-10 h-11 bg-white border-violet-300"
            />
            <button
              type="button"
              aria-label={t("aiSearchButton")}
              title={t("aiSearchButton")}
              onClick={runSmartSearch}
              disabled={searching || !question.trim()}
              // padding 0 inline: index.css gives every button padding outside the tailwind layers
              style={{ padding: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent text-violet-600 disabled:text-slate-300"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        ) : (
        <div className="relative w-full sm:w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder={t("searchMaterials")}
            className="pl-10 h-11 bg-white"
          />
          {filters.search && (
            <button
              type="button"
              aria-label={t("clearSearch")}
              title={t("clearSearch")}
              onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        )}

          {aiStatus?.enabled && (
            <Button
              type="button"
              variant="outline"
              aria-pressed={smartMode}
              aria-label={t("aiSearchToggle")}
              title={t("aiSearchToggle")}
              onClick={() => setSmartMode((on) => !on)}
              className={
                smartMode
                  ? "h-11 shrink-0 bg-violet-600 text-white border-violet-600 hover:bg-violet-700 hover:text-white"
                  : "h-11 shrink-0 border-violet-300 text-violet-700 hover:bg-violet-50"
              }
            >
              <Sparkles className="w-4 h-4" />
              {/* only the icon on narrower screens: with the text the filter row no longer fits next to the sidebar */}
              <span className="hidden min-[1360px]:inline">{t("aiSearchToggle")}</span>
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Select
            value={filters.status}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                status: v as Filters["status"],
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-36 h-11 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(v) => setFilters((prev) => ({ ...prev, sort: v }))}
          >
            <SelectTrigger className="w-full sm:w-40 h-11 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 w-full sm:w-auto relative">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {t("filters")}
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-slate-900">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{t("filterMaterials")}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>{t("materialType")}</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: v as Filters["type"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("status")}</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: v as Filters["status"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("condition")}</Label>
                  <Select
                    value={filters.condition}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        condition: v as Filters["condition"],
                      }))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t("clearAllFilters")}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("search")}: "{filters.search}"
              {/* old: <X className="w-3 h-3 ml-1 cursor-pointer" onClick={...} /> (never got the click, see ChipRemove) */}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              />
            </Badge>
          )}
          {/* one chip per word group of smart search, so you see which words the ai came up with */}
          {filters.searchGroups.map((group, i) => (
            <Badge key={`group-${i}`} variant="secondary" className="gap-1 px-3 py-1">
              {t("search")}: {group.join(" / ")}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, searchGroups: prev.searchGroups.filter((_, j) => j !== i) }))
                }
              />
            </Badge>
          ))}
          {/* what the ai crossed off; removing the chip shows those materials again */}
          {filters.hiddenIds.length > 0 && (
            <Badge variant="secondary" className="gap-1 px-3 py-1 bg-violet-50 text-violet-800">
              <Sparkles className="w-3 h-3" />
              {t("aiSearchHidden").replace("{n}", String(filters.hiddenIds.length))}
              <ChipRemove
                label={t("aiSearchShowHidden")}
                onClick={() => setFilters((prev) => ({ ...prev, hiddenIds: [] }))}
              />
            </Badge>
          )}
          {filters.type !== "all" && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("type")}: {t(filters.type)}
              {/* old: <X className="w-3 h-3 ml-1 cursor-pointer" onClick={...} /> */}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, type: "all" }))}
              />
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("status")}:{" "}
              {t(
                filters.status === "for_sale"
                  ? "forSale"
                  : filters.status === "for_reuse"
                  ? "forReuse"
                  : filters.status === "for_disposal"
                  ? "forDisposal"
                  : filters.status
              )}
              {/* old: <X className="w-3 h-3 ml-1 cursor-pointer" onClick={...} /> */}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
              />
            </Badge>
          )}
          {filters.condition !== "all" && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("condition")}: {t(filters.condition)}
              {/* old: <X className="w-3 h-3 ml-1 cursor-pointer" onClick={...} /> */}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, condition: "all" }))}
              />
            </Badge>
          )}
          {/* the four filters only smart search sets; each one can be removed like the others */}
          {filters.project !== null && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("projectName")}: {filters.project}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, project: null }))}
              />
            </Badge>
          )}
          {filters.location !== null && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("location")}: {filters.location}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, location: null }))}
              />
            </Badge>
          )}
          {filters.priceMin !== null && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("priceFrom")}: {t("currencySymbol")}
              {filters.priceMin}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, priceMin: null }))}
              />
            </Badge>
          )}
          {filters.priceMax !== null && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("priceUpTo")}: {t("currencySymbol")}
              {filters.priceMax}
              <ChipRemove
                label={t("removeFilter")}
                onClick={() => setFilters((prev) => ({ ...prev, priceMax: null }))}
              />
            </Badge>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            {t("clearAll")}
          </button>
        </div>
      )}

      {/* what the ai searched for, in one sentence, so you can see whether it understood the question */}
      {explanation && (
        <p className="flex items-center gap-2 text-sm text-violet-700">
          <Sparkles className="w-4 h-4 shrink-0" />
          {explanation}
        </p>
      )}
    </div>
  );
}
