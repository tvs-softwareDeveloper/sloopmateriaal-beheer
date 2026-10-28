// the allowed values of the material fields as lists the code can use at runtime (the types in
// material.ts only exist at compile time). must match the ENUMs in database.sql, a test checks that.
import type { Material } from "./material";

export const MATERIAL_TYPES = [
  "wood",
  "metal",
  "concrete",
  "brick",
  "glass",
  "fixtures",
  "appliances",
  "roofing",
  "plumbing",
  "electrical",
  "other",
] as const satisfies readonly Material["material_type"][];

export const UNITS = [
  "pieces",
  "kg",
  "lbs",
  "sqft",
  "sqm",
  "linear_ft",
  "linear_m",
  "pallets",
  "boxes",
] as const satisfies readonly NonNullable<Material["unit"]>[];

export const STATUSES = [
  "available",
  "reserved",
  "for_sale",
  "for_reuse",
  "for_disposal",
  "sold",
  "recycled",
  "disposed",
] as const satisfies readonly Material["status"][];

export const CONDITIONS = ["excellent", "good", "fair", "poor"] as const satisfies readonly NonNullable<
  Material["condition"]
>[];
