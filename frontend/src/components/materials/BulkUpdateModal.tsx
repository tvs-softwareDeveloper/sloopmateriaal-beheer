import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Material } from "@/types"; // als je dit nodig hebt

interface BulkUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    updates: Partial<
      Pick<Material, "status" | "condition" | "location" | "project_name">
    >
  ) => void;
  selectedCount: number;
  isLoading: boolean;
  t: (key: string) => string;
}

const statuses = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "for_sale", label: "For Sale" },
  { value: "for_reuse", label: "For Reuse" },
  { value: "for_disposal", label: "For Disposal" },
  { value: "sold", label: "Sold" },
  { value: "disposed", label: "Disposed" },
];

const conditions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export default function BulkUpdateModal({
  open,
  onClose,
  onSubmit,
  selectedCount,
  isLoading,
  t,
}: BulkUpdateModalProps) {
  const [updateFields, setUpdateFields] = useState<{
    status: Material["status"] | "";
    condition: Material["condition"] | "";
    location?: string;
    project_name?: string;
  }>({
    status: "",
    condition: "",
    location: "",
    project_name: "",
  });

  const handleSubmit = () => {
    const updates: Partial<
      Pick<Material, "status" | "condition" | "location" | "project_name">
    > = {};

    if (updateFields.status) updates.status = updateFields.status;
    // if (updateFields.status) updates.status = updateFields.status as Material['status']; optioneel.. kan gebruikt wordnen als je error krijg

    if (updateFields.condition) updates.condition = updateFields.condition;
    if (updateFields.location) updates.location = updateFields.location;
    if (updateFields.project_name)
      updates.project_name = updateFields.project_name;

    if (Object.keys(updates).length === 0) return;

    onSubmit(updates);
  };

  const hasChanges = Object.values(updateFields).some((v) => v);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bulkUpdateMaterials")}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              {t("bulkUpdateWarning")} <strong>{selectedCount}</strong> material
              {selectedCount !== 1 ? "s" : ""}.{t("onlyFilledFields")}
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t("updateStatus")}</Label>
              <Select
                value={updateFields.status}
                onValueChange={(v: string) =>
                  setUpdateFields((prev) => ({
                    ...prev,
                    status: v as "" | Material["status"], // typecast naar string union
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("updateCondition")}</Label>
              <Select
                value={updateFields.condition}
                onValueChange={(v: string) =>
                  setUpdateFields((prev) => ({
                    ...prev,
                    condition: v as "" | Material["condition"],
                  }))
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No change</SelectItem>
                  {conditions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("updateLocation")}</Label>
              <Input
                value={updateFields.location}
                onChange={(e) =>
                  setUpdateFields((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder={t("leaveEmpty")}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("updateProjectName")}</Label>
              <Input
                value={updateFields.project_name}
                onChange={(e) =>
                  setUpdateFields((prev) => ({
                    ...prev,
                    project_name: e.target.value,
                  }))
                }
                placeholder={t("leaveEmpty")}
                className="h-11"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !hasChanges}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("updateItems")} {selectedCount} Item
            {selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
