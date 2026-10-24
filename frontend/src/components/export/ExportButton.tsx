import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  materials: any[];
  selectedIds?: string[];
  t: (key: string) => string;
}

export default function ExportButton({ materials, selectedIds, t } : ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const ids = selectedIds ?? [];
  const dataToExport = ids.length > 0
    ? materials.filter(m => ids.includes(m.id))
    : materials;

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'ID', 'Name', 'Type', 'Quantity', 'Unit', 'Status', 
        'Condition', 'Location', 'Price', 'Project', 'QR Code',
        'Notes', 'Created Date', 'Updated Date'
      ];

      const rows = dataToExport.map(m => [
        m.id,
        m.name,
        m.material_type,
        m.quantity,
        m.unit || 'pieces',
        m.status,
        m.condition,
        m.location || '',
        m.price || 0,
        m.project_name || '',
        m.qr_code || '',
        (m.notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
        m.created_date ? format(new Date(m.created_date), 'yyyy-MM-dd HH:mm') : '',
        m.updated_date ? format(new Date(m.updated_date), 'yyyy-MM-dd HH:mm') : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `materials_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast.success(`${t('exported')} ${dataToExport.length} ${t('materialsTo')} CSV`);
    } catch (error) {
      toast.error(t('failedToExport'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      // Create a more Excel-friendly format with tab separation
      const headers = [
        'ID', 'Name', 'Type', 'Quantity', 'Unit', 'Status', 
        'Condition', 'Location', 'Price', 'Project', 'QR Code',
        'Notes', 'Created Date', 'Updated Date'
      ];

      const rows = dataToExport.map(m => [
        m.id,
        m.name,
        m.material_type,
        m.quantity,
        m.unit || 'pieces',
        m.status,
        m.condition,
        m.location || '',
        m.price || 0,
        m.project_name || '',
        m.qr_code || '',
        (m.notes || '').replace(/\t/g, ' ').replace(/\n/g, ' '),
        m.created_date ? format(new Date(m.created_date), 'yyyy-MM-dd HH:mm') : '',
        m.updated_date ? format(new Date(m.updated_date), 'yyyy-MM-dd HH:mm') : ''
      ]);

      // Create HTML table for Excel
      let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">';
      html += '<head><meta charset="utf-8"></head>';
      html += '<body><table border="1">';
      html += '<tr>' + headers.map(h => `<th style="background:#1e293b;color:white;font-weight:bold;padding:8px;">${h}</th>`).join('') + '</tr>';
      rows.forEach(row => {
        html += '<tr>' + row.map(cell => `<td style="padding:6px;">${cell}</td>`).join('') + '</tr>';
      });
      html += '</table></body></html>';

      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `materials_export_${format(new Date(), 'yyyy-MM-dd')}.xls`;
      link.click();

      toast.success(`${t('exported')} ${dataToExport.length} ${t('materialsTo')} Excel`);
    } catch (error) {
      toast.error(t('failedToExport'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `materials_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();

      toast.success(`${t('exported')} ${dataToExport.length} ${t('materialsTo')} JSON`);
    } catch (error) {
      toast.error(t('failedToExport'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {t('export')} {ids.length > 0 ? `(${ids.length})` : ''}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="w-4 h-4 mr-2" />
          {t('exportAsCSV')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t('exportAsExcel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="w-4 h-4 mr-2" />
          {t('exportAsJSON')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}