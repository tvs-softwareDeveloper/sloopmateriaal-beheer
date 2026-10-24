import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Package,
  Edit2,
  Trash2,
  QrCode,
  Banknote,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import type { Material } from "../../types";
import ImageViewer from "./ImageViewer";

const statusColors = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  for_sale: "bg-blue-50 text-blue-700 border-blue-200",
  for_reuse: "bg-violet-50 text-violet-700 border-violet-200",
  for_disposal: "bg-slate-50 text-slate-600 border-slate-200",
  sold: "bg-green-50 text-green-700 border-green-200",
  disposed: "bg-red-50 text-red-600 border-red-200",
  recycled: "bg-teal-50 text-teal-700 border-teal-200",
};

const typeIcons = {
  wood: "🪵",
  metal: "🔩",
  concrete: "🧱",
  brick: "🧱",
  glass: "🪟",
  fixtures: "🚿",
  appliances: "🔌",
  roofing: "🏠",
  plumbing: "🔧",
  electrical: "⚡",
  other: "📦",
};

const conditionColors = {
  excellent: "text-emerald-600",
  good: "text-blue-600",
  fair: "text-amber-600",
  poor: "text-red-600",
};
interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
  onViewQR: (material: Material) => void;
  selected: boolean;
  onSelect: (id: string) => void;
  selectionMode: boolean;
}


export default function MaterialCard({
  material,
  onEdit,
  onDelete,
  onViewQR,
  selected,
  onSelect,
  selectionMode,
}: MaterialCardProps) {
  const { t, language } = useLanguage();
  const [imageViewer, setImageViewer] = React.useState<{ images: string[]; index: number } | null>(null);
  const price = material.price ?? 0;
  return (
    <Card className="group bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {selectionMode && (
            <div className="flex items-center justify-center px-4 border-r border-slate-100 bg-slate-50/50">
              <Checkbox
                checked={selected}
                onCheckedChange={() => onSelect(material.id)}
                className="data-[state=checked]:bg-slate-800"
              />
            </div>
          )}

          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {typeIcons[material.material_type] || "📦"}
                  </span>
                  <h3 className="font-semibold text-slate-900 truncate text-lg">
                    {material.name}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className={statusColors[material.status]}
                  >
                    {t(material.status)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-slate-50 text-slate-600 border-slate-200"
                  >
                    {t(material.material_type)}
                  </Badge>
                  {material.condition && (
                    <span
                      className={`text-xs font-medium ${
                        conditionColors[material.condition]
                      }`}
                    >
                      {t(material.condition)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>
                      {material.quantity} {t(`unit_${material.unit || "pieces"}`)}
                    </span>
                  </div>

                  {material.location && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{material.location}</span>
                    </div>
                  )}

                  {price > 0 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Banknote className="w-4 h-4 text-slate-400" />
                      <span>
                        {t("currencySymbol")}
                        {price.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {material.created_date && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">
                        {language === "nl"
                          ? format(new Date(material.created_date), "d MMM yyyy", { locale: nl })
                          : format(new Date(material.created_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>

                {material.notes && (
                  <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                    {material.notes}
                  </p>
                )}
                {material.images && material.images.length > 0 && (
                  <>
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                      {material.images.slice(0, 3).map((url, idx) => (
                        console.log("UPLOADED URLS = ", url),

                        <img
                          key={idx}
                          src={url}
                          
                          alt={`${material.name} foto ${idx + 1}`}
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            setImageViewer({
                              images: material.images ?? [],
                              index: idx,
                            })
                          }
                        />
                      ))}
                      {material.images.length > 3 && (
                        <button
                          onClick={() =>
                            setImageViewer({
                              images: material.images ?? [],
                              index: 3,
                            })
                          }
                          className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-600 flex-shrink-0 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          +{material.images.length - 3}
                        </button>
                      )}
                    </div>
                    <ImageViewer
                      images={imageViewer?.images}
                      selectedIndex={imageViewer?.index}
                      onClose={() => setImageViewer(null)}
                    />
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  onClick={() => onViewQR(material)}
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => onEdit(material)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(material)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
