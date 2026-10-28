import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// old: import React, { useState, useEffect } from "react";
import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { API } from '../config';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { Material } from "../../types";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Sparkles } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { aiErrorKey, analyzePhotos, useAiStatus, type PhotoSuggestion } from "../ai/aiApi";
type TranslationFunction = (key: string) => string;

interface MaterialFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Material) => void;
  material: Material | null;
  isLoading: boolean;
  t: TranslationFunction;
  // photos picked with "new from photo": uploaded and analysed by the ai as soon as the form opens
  initialFiles?: File[];
}

// small label next to a field the ai filled in, until the user changes that field
const AiBadge = () => (
  <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
    AI
  </span>
);

const getMaterialTypes = (t: TranslationFunction) => [
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

const getUnits = (t: TranslationFunction) => [
  { value: "pieces", label: t("pieces") },
  { value: "kg", label: t("kilograms") },
  { value: "lbs", label: t("pounds") },
  { value: "sqft", label: t("squareFeet") },
  { value: "sqm", label: t("squareMeters") },
  { value: "linear_ft", label: t("linearFeet") },
  { value: "linear_m", label: t("linearMeters") },
  { value: "pallets", label: t("pallets") },
  { value: "boxes", label: t("boxes") },
];

const getConditions = (t: TranslationFunction) => [
  { value: "excellent", label: t("excellent") },
  { value: "good", label: t("good") },
  { value: "fair", label: t("fair") },
  { value: "poor", label: t("poor") },
];

export default function MaterialForm({
  open,
  onClose,
  onSubmit,
  material,
  isLoading,
  t,
  initialFiles,
}: MaterialFormProps) {
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  type FormData = Omit<Material, "id" | "qr_code" | "created_date"> & { images: string[] };

  const [formData, setFormData] = useState<FormData>({
    name: "",
    material_type: "other",
    quantity: 1,
    unit: "pieces",
    status: "available",
    location: "",
    condition: "good",
    notes: "",
    price: 0,
    project_name: "",
    images: [],
  });

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || "",
        material_type: material.material_type || "other",
        quantity: material.quantity || 1,
        unit: material.unit || "pieces",
        status: material.status || "available",
        location: material.location || "",
        condition: material.condition || "good",
        notes: material.notes || "",
        price: material.price || 0,
        project_name: material.project_name || "",
        images: material.images || [],
      });
    } else {
      setFormData({
        name: "",
        material_type: "other",
        quantity: 1,
        unit: "pieces",
        status: "available",
        location: "",
        condition: "good",
        notes: "",
        price: 0,
        project_name: "",
        images: [],
      });
    }
  }, [material, open]);

  // ai suggestion: which fields the ai filled in (they get an "AI" label), which fields the user
  // changed (the ai never overwrites those) and the ai's rough count, shown as a hint
  const { language } = useLanguage();
  const { data: aiStatus } = useAiStatus();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiFields, setAiFields] = useState<Set<keyof FormData>>(new Set());
  const [quantityHint, setQuantityHint] = useState<string | null>(null);
  const touchedRef = useRef<Set<keyof FormData>>(new Set());

  // a fresh form starts without ai labels and without touched fields
  useEffect(() => {
    touchedRef.current = new Set();
    setAiFields(new Set());
    setQuantityHint(null);
  }, [material, open]);

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // the user changed this field: the ai leaves it alone and the "AI" label goes away
    touchedRef.current.add(field);
    setAiFields((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  // how the ai counted, shown under the quantity so it can be checked against the photo,
  // e.g. "AI counted: 15 × 6 + 16 × 6 = 186 (check this number)"
  const countText = (count: PhotoSuggestion["count"]): string | null => {
    if (count.total === null) return null;
    const sum =
      count.method === "stack"
        ? `${count.sections.map((s) => `${s.rows} × ${s.columns}`).join(" + ")} = ${count.total}`
        : String(count.total);
    const unsure = count.confidence === "low" ? ` (${t("aiCountUncertain")})` : "";
    return `${t("aiCounted")}: ${sum}${unsure}`;
  };

  // asks the ai for a suggestion and fills in the fields the user has not touched yet.
  // price, status, project and location are never part of a suggestion.
  const runAi = async (images: string[]) => {
    if (images.length === 0) return;
    setAnalyzing(true);
    try {
      const suggestion = await analyzePhotos(images, language);
      if (!suggestion.is_material) {
        toast.error(t("aiNoMaterial"));
        return;
      }

      const proposal: Partial<FormData> = {
        name: suggestion.name,
        material_type: suggestion.material_type,
        unit: suggestion.unit,
        notes: suggestion.notes,
        // null = the ai could not judge the condition, then the field keeps its value
        ...(suggestion.condition ? { condition: suggestion.condition } : {}),
        // the count is in pieces, so it only goes into the field when the unit is pieces too
        ...(suggestion.count.total !== null && suggestion.unit === "pieces"
          ? { quantity: suggestion.count.total }
          : {}),
      };
      const filled = (Object.keys(proposal) as (keyof FormData)[]).filter(
        (field) => !touchedRef.current.has(field)
      );
      const updates = Object.fromEntries(filled.map((field) => [field, proposal[field]])) as Partial<FormData>;

      setFormData((prev) => ({ ...prev, ...updates }));
      setAiFields(new Set(filled));
      // old: setQuantityHint(suggestion.quantity_hint);
      setQuantityHint(countText(suggestion.count));

      if (filled.length === 0) toast.info(t("aiNothingToFill"));
      else if (suggestion.confidence === "low") toast.warning(t("aiLowConfidence"));
      else toast.success(t("aiFilled"));
    } catch (err) {
      toast.error(t(aiErrorKey(err)));
    } finally {
      setAnalyzing(false);
    }
  };

  // the upload itself, shared by the photo button and by "new from photo". returns the new urls.
  // (this code used to be the body of handleImageUpload, see below)
  const uploadFiles = async (files: File[], alreadyThere: number): Promise<string[]> => {
    if (files.length === 0) return [];

    // old: const remainingSlots = 5 - formData.images.length;
    const remainingSlots = 5 - alreadyThere;
    if (remainingSlots === 0) {
      toast.error("Maximaal 5 foto's toegestaan");
      return [];
    }

    const filesToUpload = files.slice(0, remainingSlots);
    setUploadingImage(true);

    try {
      const form = new FormData();
      filesToUpload.forEach((f) => form.append('files', f));

      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const imageUrls: string[] = data.urls ?? [];

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...imageUrls],
      }));
      toast.success(`${imageUrls.length} foto('s) geüpload`);
      return imageUrls;
    } catch (err) {
      console.error('Upload error', err);
      toast.error('Upload mislukt');
      return [];
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFiles(Array.from(e.target.files || []), formData.images.length);
  };

  // "new from photo": upload the photos picked on the materials page and ask the ai right away.
  // the ref makes sure that happens once per pick (react strict mode runs effects twice in dev).
  const handledFilesRef = useRef<File[] | null>(null);
  useEffect(() => {
    if (!open || material || !initialFiles?.length) return;
    if (handledFilesRef.current === initialFiles) return;
    handledFilesRef.current = initialFiles;

    uploadFiles(initialFiles, 0).then((urls) => {
      if (urls.length > 0 && aiStatus?.enabled) runAi(urls);
    });
    // only reacts to a new pick; uploadFiles and runAi are recreated on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, material, initialFiles]);

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // genereer qr_code als die er nog niet is
    const qr_code =
      material?.qr_code ||
      `MAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // gebruik bestaande id als het materiaal bestaat, anders genereer een nieuwe
    const id = material?.id || uuidv4();

    // combineer alles tot een volledig Material object
    const completeMaterial: Material = {
      id,
      qr_code,
      ...formData,
    };

    onSubmit(completeMaterial);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {material ? t("editMaterial") : t("addNewMaterial")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* at the top, so it is also visible on a phone while the photos are further down */}
          {analyzing && (
            <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("aiAnalyzing")}
            </div>
          )}

          <div className="space-y-2">
            {/* old: <Label htmlFor="name">{t("materialName")} *</Label> */}
            <Label htmlFor="name">
              {t("materialName")} *{aiFields.has("name") && <AiBadge />}
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("materialNamePlaceholder")}
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {/* old: <Label>{t("materialType")} *</Label> */}
              <Label>
                {t("materialType")} *{aiFields.has("material_type") && <AiBadge />}
              </Label>
              <Select
                value={formData.material_type}
                onValueChange={(v) =>
                  handleChange("material_type", v as Material["material_type"])
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMaterialTypes(t).map((mt) => (
                    <SelectItem key={mt.value} value={mt.value}>
                      {mt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {/* old: <Label>{t("condition")}</Label> */}
              <Label>
                {t("condition")}
                {aiFields.has("condition") && <AiBadge />}
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(v) =>
                  handleChange(
                    "condition",
                    v as "excellent" | "good" | "fair" | "poor"
                  )
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getConditions(t).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {/* old: <Label htmlFor="quantity">{t("quantity")} *</Label> */}
              <Label htmlFor="quantity">
                {t("quantity")} *{aiFields.has("quantity") && <AiBadge />}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  handleChange("quantity", parseFloat(e.target.value) || 0)
                }
                required
                className="h-11"
              />
              {/* how the ai counted (rows × columns per bundle), so the number can be checked on the photo */}
              {quantityHint && (
                // old: {t("aiQuantityHint")}: {quantityHint}
                <p className="text-xs text-violet-700">{quantityHint}</p>
              )}
            </div>

            <div className="space-y-2">
              {/* old: <Label>{t("unit")}</Label> */}
              <Label>
                {t("unit")}
                {aiFields.has("unit") && <AiBadge />}
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(v) =>
                  handleChange("unit", v as Material["unit"])
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getUnits(t).map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("status")} *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  handleChange("status", v as Material["status"])
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatuses(t).map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                {t("price")} ({t("currencySymbol")})
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  handleChange("price", parseFloat(e.target.value) || 0)
                }
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder={t("locationPlaceholder")}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_name">{t("projectName")}</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => handleChange("project_name", e.target.value)}
              placeholder={t("projectNamePlaceholder")}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            {/* old: <Label htmlFor="notes">{t("notes")}</Label> */}
            <Label htmlFor="notes">
              {t("notes")}
              {aiFields.has("notes") && <AiBadge />}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Foto's ({formData.images.length}/5)</Label>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {formData.images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200"
                  >
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      title="removeimage"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.images.length < 5 && (
              <div>
                <input
                  title="fileinput"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full h-20 border-dashed"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Uploaden...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Foto's Toevoegen
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* only for a new material: a saved material is never overwritten by a suggestion */}
            {aiStatus?.enabled && !material && formData.images.length > 0 && (
              <Button
                type="button"
                onClick={() => runAi(formData.images)}
                disabled={analyzing || uploadingImage}
                className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("aiAnalyzing")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("aiFillIn")}
                  </>
                )}
              </Button>
            )}
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {material ? t("updateMaterial") : t("addMaterial")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
