import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Upload, FileSpreadsheet, Loader2, CheckCircle2, 
  AlertCircle, Download, X 
} from 'lucide-react';
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { API } from '../config';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  t: (key: string) => string;
}

export default function ImportModal({ open, onClose, onImportSuccess, t } : ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  void file;
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setIsUploading(false);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const isValidType = validTypes.includes(selectedFile.type) || 
      selectedFile.name.endsWith('.csv') || 
      selectedFile.name.endsWith('.xls') || 
      selectedFile.name.endsWith('.xlsx');

    if (!isValidType) {
      setError(t('invalidFileType'));
      return;
    }

    setFile(selectedFile);
    setError(null);
    
    // Parse file client-side (CSV / XLSX) using SheetJS
    setIsUploading(false);
    setIsProcessing(true);
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null } as any);

      // Normalize headers to lowercase keys for easier mapping
      const materials = rawJson.map((row) => {
        const normalized: any = {};
        Object.keys(row).forEach((k) => {
          const key = String(k).toLowerCase().trim();
          normalized[key] = row[k];
        });
        return normalized;
      });

      setPreviewData(materials.filter(m => m && (m.name || m.naam)));
      setError(null);
    } catch (err) {
      console.error('Failed to parse file', err);
      setError(t('uploadFailed'));
      setPreviewData(null);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) return;

    setIsProcessing(true);
    try {
      const materialsToCreate = previewData.map(item => ({
        name: item.name || 'Unnamed Material',
        material_type: normalizeType(item.material_type),
        quantity: item.quantity || 1,
        unit: normalizeUnit(item.unit),
        condition: normalizeCondition(item.condition),
        status: normalizeStatus(item.status),
        location: item.location || '',
        price: item.price || 0,
        project_name: item.project_name || '',
        notes: item.notes || '',
        qr_code: `MAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      // Send materials to backend API (POST /materials for each)
      await Promise.all(materialsToCreate.map(m =>
        fetch(`${API}/materials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m),
        })
      ));
      toast.success(`${materialsToCreate.length} ${t('materialsImported')}`);
      onImportSuccess();
      handleClose();
    } catch (err) {
      toast.error(t('importFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const normalizeType = (type: any): string => {
    const types = ['wood', 'metal', 'concrete', 'brick', 'glass', 'fixtures', 'appliances', 'roofing', 'plumbing', 'electrical', 'other'];
    const normalized = String(type ?? '').toLowerCase().trim();
    return types.includes(normalized) ? normalized : 'other';
  };

  const normalizeUnit = (unit: any): string => {
    const units = ['pieces', 'kg', 'lbs', 'sqft', 'sqm', 'linear_ft', 'linear_m', 'pallets', 'boxes'];
    const normalized = String(unit ?? '').toLowerCase().trim().replace(/\s+/g, '_');
    return units.includes(normalized) ? normalized : 'pieces';
  };

  const normalizeCondition = (condition: any): string => {
    const conditions = ['excellent', 'good', 'fair', 'poor'];
    const normalized = String(condition ?? '').toLowerCase().trim();
    return conditions.includes(normalized) ? normalized : 'good';
  };

  const normalizeStatus = (status: any): string => {
    const statuses = ['available', 'reserved', 'for_sale', 'for_reuse', 'for_disposal', 'sold', 'disposed'];
    const normalized = String(status ?? '').toLowerCase().trim().replace(/\s+/g, '_');
    return statuses.includes(normalized) ? normalized : 'available';
  };

  const downloadTemplate = () => {
    const headers = ['name', 'material_type', 'quantity', 'unit', 'condition', 'status', 'location', 'price', 'project_name', 'notes'];
    const exampleRow = ['Oak Beams', 'wood', '25', 'pieces', 'good', 'available', 'Warehouse A', '150', 'Building Demo', 'Reclaimed from old barn'];
    const csv = [headers.join(','), exampleRow.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'materials_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('importMaterials')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Upload Area */}
          {!previewData && (
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                title='file'
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isUploading || isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                  <p className="text-slate-600">
                    {isUploading ? t('uploadingFile') : t('processingFile')}
                  </p>
                </div>
              ) : (
                <>
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-700 font-medium mb-1">{t('dropFileHere')}</p>
                  <p className="text-sm text-slate-500 mb-4">{t('supportedFormats')}</p>
                  <Button variant="outline" size="sm">
                    {t('selectFile')}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Preview Table */}
          {previewData && previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    {previewData.length} {t('materialsFound')}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <X className="w-4 h-4 mr-1" />
                  {t('clearFile')}
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">{t('name')}</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">{t('type')}</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">{t('quantity')}</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">{t('condition')}</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-900">{item.name}</td>
                          <td className="px-3 py-2 text-slate-600">{item.material_type || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{item.quantity || 1} {item.unit || 'pcs'}</td>
                          <td className="px-3 py-2 text-slate-600">{item.condition || '-'}</td>
                          <td className="px-3 py-2 text-slate-600">{item.status || 'available'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 10 && (
                  <div className="px-3 py-2 bg-slate-50 text-sm text-slate-500 text-center">
                    +{previewData.length - 10} {t('moreItems')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-700">{t('needTemplate')}</p>
              <p className="text-sm text-slate-500">{t('downloadTemplateDesc')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              {t('downloadTemplate')}
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!previewData || previewData.length === 0 || isProcessing}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('importItems')} {previewData?.length || 0} {t('items')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}