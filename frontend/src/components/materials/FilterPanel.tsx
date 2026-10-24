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

type TranslationFunction = (key: string) => string;

export type Filters = {
  search: string;
  type: "all" | Material["material_type"];
  status: "all" | Material["status"];
  condition: "all" | NonNullable<Material["condition"]>;
  sort: string;
};

type FilterPanelProps = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  t: (key: string) => string;
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

export default function FilterPanel({
  filters,
  setFilters,
  t,
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
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      status: "all",
      condition: "all",
      sort: "-created_date",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
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
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() => setFilters((prev) => ({ ...prev, search: "" }))}
              />
            </Badge>
          )}
          {filters.type !== "all" && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("type")}: {t(filters.type)}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
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
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, status: "all" }))
                }
              />
            </Badge>
          )}
          {filters.condition !== "all" && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {t("condition")}: {t(filters.condition)}
              <X
                className="w-3 h-3 ml-1 cursor-pointer"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, condition: "all" }))
                }
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
    </div>
  );
}
