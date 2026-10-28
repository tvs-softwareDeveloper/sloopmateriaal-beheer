import { Button } from "@/components/ui/button";
// old: import { useState, useMemo } from "react";
import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  X,
  Package,
  Plus,
  ScanLine,
  Trash2,
  Edit3,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

import QRScanner from "@/components/materials/QRScanner";
import { useLanguage } from "@/components/LanguageContext";
import ExportButton from "@/components/export/ExportButton";
import QRCodeModal from "@/components/materials/QRCodeModal";
import FilterPanel from "@/components/materials/FilterPanel";
import MaterialCard from "@/components/materials/MaterialCard";
import MaterialForm from "@/components/materials/MaterialForm";
import BulkUpdateModal from "@/components/materials/BulkUpdateModal";
import type { Material } from "../types";
import type { Filters } from "@/components/materials/FilterPanel";
import { EMPTY_FILTERS } from "@/components/materials/emptyFilters";
import { filterMaterials } from "@/components/materials/filterMaterials";
import ImportModal from '@/components/materials/ImportModal';
import { API } from '../components/config';
import { Camera } from "lucide-react";
import { useAiStatus } from "@/components/ai/aiApi";

export default function Materials() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // State
  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [qrMaterial, setQrMaterial] = useState<Material | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

    const [importOpen, setImportOpen] = useState(false);


  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  // "new from photo": the camera (or file picker) opens straight from the button, the picked photos
  // go to the form, which uploads them and lets the ai fill it in
  const { data: aiStatus } = useAiStatus();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[] | null>(null);

  const handlePhotoPicked = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // so the same photo can be picked again
    if (files.length === 0) return;
    setEditingMaterial(null);
    setPhotoFiles(files);
    setFormOpen(true);
  };
  // const [selectedIds, setSelectedIds] = useState([]);
// old: useState<Filters>({ search: "", type: "all", status: "all", condition: "all", sort: "-created_date" })
// the same start values, plus the four filters smart search can set
const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  // Query
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => {
       const res = await fetch(`${API}/materials`);
      if (!res.ok) throw new Error("Failed to fetch materials");
      return res.json(); // verwacht array van Material
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: Material) => {
      const res = await fetch(`${API}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create material");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(t("materialAdded"));
      setFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Material>;
    }) => {
      const res = await fetch(`${API}/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update material");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(t("materialUpdated"));
      setEditingMaterial(null);
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API}/materials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete material");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(t("materialDeleted"));
      setDeleteConfirm(null);
    },
  });

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    // old: let result = [...materials]; followed by one block per filter (search, price, project, location,
    // type, status, condition). that filter code moved unchanged to filterMaterials.ts, so smart search can
    // check its filters with exactly the same rules. before that the search was one piece of text in one
    // field; then every word with exact text; now every word, also in another form ("staal" finds "Stalen").
    const result = filterMaterials(materials, filters);

    // Sort
    // const [sortField, sortDir] = filters.sort.startsWith('-')
    //   ? [filters.sort.slice(1), -1]
    //   : [filters.sort, 1];
    const [sortField, sortDir] = filters.sort.startsWith("-")
      ? [filters.sort.slice(1) as keyof Material, -1]
      : [filters.sort as keyof Material, 1];

    // result.sort((a, b) => {
    //   let aVal = a[sortField];
    //   let bVal = b[sortField];

    //   if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    //   if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    //   if (aVal < bVal) return -1 * sortDir;
    //   if (aVal > bVal) return 1 * sortDir;
    //   return 0;
    // });
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // fallback voor undefined of null
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      // strings lowercase maken
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return -1 * sortDir;
      if (aVal > bVal) return 1 * sortDir;
      return 0;
    });

    return result;
  }, [materials, filters]);

  // Handlers
  // const handleSubmit = (data) => {
  //   if (editingMaterial) {
  //     updateMutation.mutate({ id: editingMaterial.id, data });
  //   } else {
  //     createMutation.mutate(data);
  //   }
  // };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormOpen(true);
  };

  //! als het volledige Material object wordt meegegeven
  // const handleSubmit = (data: Material) => {
  //   if (editingMaterial) {
  //     updateMutation.mutate({ id: editingMaterial.id, data });
  //   } else {
  //     createMutation.mutate(data);
  //   }
  // };

  // of als het formulier maar een subset van velden gebruikt
  const handleSubmit = (data: Partial<Material>) => {
    if (editingMaterial?.id) {
      updateMutation.mutate({ id: editingMaterial.id, data });
    } else {
      // Geen id, dus dit is een nieuw materiaal
      createMutation.mutate(data as Material);
    }
  };

  const handleDelete = (material: Material) => {
    setDeleteConfirm(material);
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        filteredMaterials.map((m) => m.id).filter((id): id is string => !!id)
      );
    }
  };

  const handleBulkUpdate = async (updates: Partial<Material>) => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API}/materials/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(`${selectedIds.length} ${t("materialsUpdated")}`);
      setBulkUpdateOpen(false);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      toast.error(t("failedToUpdate"));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`${API}/materials/${id}`, { method: "DELETE" })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(`${selectedIds.length} ${t("materialsDeleted")}`);
      setSelectedIds([]);
      setSelectionMode(false);
    } catch (error) {
      toast.error(t("failedToDelete"));
    }
  };

  const handleScan = (material: Material) => {
    handleEdit(material);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t("materialsTitle")}
            </h1>
            <p className="text-slate-500 mt-1">
              {filteredMaterials.length} {t("ofItems")} {materials.length} items
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
              <ScanLine className="w-4 h-4 mr-2" />
              {t("scanQR")}
            </Button>

            <ExportButton
              materials={materials}
              selectedIds={selectedIds}
              t={t}
            />

            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              {t('import')}
            </Button>

            <Button
              variant={selectionMode ? "secondary" : "outline"}
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedIds([]);
              }}
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              {selectionMode ? t("cancelSelection") : t("select")}
            </Button>

            {/* no capture attribute: a phone then lets you choose between the camera and the gallery,
                a laptop shows the normal file picker */}
            {aiStatus?.enabled && (
              <>
                <input
                  title="photoinput"
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  // old: capture="environment" (opened the camera straight away, without a gallery option)
                  multiple
                  onChange={handlePhotoPicked}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => photoInputRef.current?.click()}
                  className="border-violet-300 text-violet-700 hover:bg-violet-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t("aiNewFromPhoto")}
                </Button>
              </>
            )}

            <Button
              onClick={() => {
                setEditingMaterial(null);
                setPhotoFiles(null);
                setFormOpen(true);
              }}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("addMaterial")}
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectionMode && selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-xl animate-in slide-in-from-top">
            <span className="font-medium">
              {selectedIds.length} {t("selected")}
            </span>
            <div className="h-4 w-px bg-slate-600" />
            <Button variant="secondary" size="sm" onClick={handleSelectAll}>
              {selectedIds.length === filteredMaterials.length
                ? t("deselectAll")
                : t("selectAll")}
            </Button>
            <div className="flex-1" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setBulkUpdateOpen(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {t("bulkUpdate")}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t("deleteSelected")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds([]);
              }}
              className="text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Filters */}
        {/* old: <FilterPanel filters={filters} setFilters={setFilters} t={t} /> */}
        <FilterPanel filters={filters} setFilters={setFilters} t={t} materials={materials} />

        {/* Materials List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {t("noMaterialsFound")}
            </h3>
            <p className="text-slate-500 mb-6">
              {materials.length === 0
                ? t("getStarted")
                : t("tryAdjustingFilters")}
            </p>
            {materials.length === 0 && (
              <Button
                onClick={() => setFormOpen(true)}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("addMaterial")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewQR={setQrMaterial}
                selected={
                  material.id ? selectedIds.includes(material.id) : false
                } //materialen zonder id negeren
                onSelect={handleSelect}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <MaterialForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingMaterial(null);
            setPhotoFiles(null);
          }}
          onSubmit={handleSubmit}
          material={editingMaterial}
          isLoading={createMutation.isPending || updateMutation.isPending}
          t={t}
          initialFiles={photoFiles ?? undefined}
        />

        <QRCodeModal
          open={!!qrMaterial}
          onClose={() => setQrMaterial(null)}
          material={qrMaterial}
          t={t}
        />

        <QRScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleScan}
          materials={materials}
          t={t}
        />

        <BulkUpdateModal
          open={bulkUpdateOpen}
          onClose={() => setBulkUpdateOpen(false)}
          onSubmit={handleBulkUpdate}
          selectedCount={selectedIds.length}
          isLoading={false}
          t={t}
        />

        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['materials'] })}
          t={t}
        />

        <AlertDialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteMaterial")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirmation")} "{deleteConfirm?.name}"?{" "}
                {t("cannotBeUndone")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteConfirm) return;
                  deleteMutation.mutate(deleteConfirm.id);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
