import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Copy } from 'lucide-react';
import { toast } from "sonner";
import type { Material } from "../../types";
import { API } from '../config';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  material: Material | null;
  t: (key: string) => string;
}

export default function QRCodeModal({ open, onClose, material, t }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [current, setCurrent] = useState<Material | null>(material);

  useEffect(() => {
    setCurrent(material);
    console.info('QRCodeModal.useEffect', { open, material });

    const ensureAndGenerate = async () => {
      if (!open || !material || !canvasRef.current) return;

      if (!material.qr_code && material.id) {
        try {
          console.info(`QRCodeModal: fetching fresh material ${material.id}`);
          const url = `${API}/materials/${encodeURIComponent(material.id)}`;//! `${API}/materials/${material.id}`;
          console.info('QRCodeModal: fetch url', url);
          const res = await fetch(url);
          if (res.ok) {
            const fresh = await res.json();
            console.info('QRCodeModal: fetched fresh material', fresh);
            setCurrent(fresh);
            if (fresh.qr_code) {
              console.info('QRCodeModal: fresh material has qr_code — scheduling generation');
              generateQRWithMaterial(fresh);
            }
            return;
          }
        } catch (e) {
          console.warn('QRCodeModal: failed to fetch fresh material', e);
        }
      }

      if (material.qr_code) generateQR().catch(() => {});
    };

    ensureAndGenerate();
  }, [open, material]);

  // helper to generate QR using a provided material (freshly fetched)
  // Avoid mutating `current` state here to prevent races — pass the material directly to generator.
  const generateQRWithMaterial = (m: Material) => {
    // eslint-disable-next-line no-console
    console.info('QRCodeModal.generateQRWithMaterial - invoking generateQR with provided material', { id: m.id });
    void generateQR(m).catch(() => {});
  };

  const generateQR = async (mArg?: Material | null): Promise<void> => {
    const canvas = canvasRef.current;
    const m = mArg ?? current ?? material;
    // eslint-disable-next-line no-console
    console.info('QRCodeModal.generateQR start', { canvasExists: !!canvas, materialPresent: !!m });
    if (!canvas || !m) {
      // eslint-disable-next-line no-console
      console.warn('QRCodeModal.generateQR aborting: missing canvas or material', { canvas, m });
      return;
    }
    const size = 200; // draw at higher resolution for clearer PNG
    canvas.width = size;
    canvas.height = size;
    // display at 200 CSS pixels for consistent layout but keep high DPI rendering
    canvas.style.width = '200px';
    canvas.style.height = '200px';
    

    // debug info
    // eslint-disable-next-line no-console
    console.info('QRCodeModal.generateQR', { id: m.id, qr_code: m.qr_code, canvasSize: `${canvas.width}x${canvas.height}` });

    if (!m.qr_code) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Geen QR-code', size / 2, size / 2);
      // eslint-disable-next-line no-console
      console.warn('QRCodeModal: material has no qr_code', m);
      return;
    }

    try {
      // Use `qrcode` library to draw an actual scannable QR onto the canvas
      await QRCode.toCanvas(canvas, m.qr_code, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: size,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });
      // eslint-disable-next-line no-console
      console.info('QRCodeModal: QR drawn to canvas');
    } catch (err) {
      // fallback: clear and show error
      // eslint-disable-next-line no-console
      console.warn('QRCodeModal: failed to generate QR canvas', err);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ef4444';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QR genereren mislukt', size / 2, size / 2);
    }
  };

  // If the dialog opens before the canvas is mounted, try again shortly after open to catch the mount.
  useEffect(() => {
    if (!open) return;
    const tryDraw = () => {
      const has = (current ?? material)?.qr_code;
      if (has && canvasRef.current) {
        void generateQR().catch(() => {});
      }
    };
    // schedule a short retry after open to allow portal/canvas to mount
    const id = setTimeout(tryDraw, 120);
    return () => clearTimeout(id);
  }, [open, material, current]);

  const downloadQR = () => {
    const canvas = canvasRef.current;
    const m = current ?? material;
    if (!canvas || !m || !m.qr_code) return;

    const link = document.createElement('a');
    link.download = `qr-${m.qr_code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success(t('qrDownloaded'));
  };

  const printQR = () => {
    const canvas = canvasRef.current;
    const m = current ?? material;
    if (!canvas || !m || !m.qr_code) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${m.name}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;">
          <h2 style="margin-bottom:20px;color:#1e293b;">${m.name}</h2>
          <img src="${canvas.toDataURL('image/png')}" style="width:200px;height:200px;" />
          <p style="margin-top:16px;font-size:12px;color:#64748b;">${m.qr_code}</p>
          <p style="font-size:11px;color:#94a3b8;">${m.material_type} • ${m.quantity} ${m.unit || 'pcs'}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copyCode = () => {
    const m = current ?? material;
    if (!m || !m.qr_code) return;
    navigator.clipboard.writeText(m.qr_code);
    toast.success(t('codeCopied'));
  };

  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm">
  <DialogHeader>
    <DialogTitle className="text-center">{t('qrCode')}</DialogTitle>
  </DialogHeader>

  {/* the card hugs the 200px canvas, so the code sits in the middle */}
  <div className="flex flex-col items-center py-2">
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <canvas ref={canvasRef} className="block" />
    </div>

    <div className="mt-4 text-center">
      <h3 className="font-semibold text-slate-900">{material.name}</h3>
      <p className="text-sm text-slate-500 mt-1 font-mono break-all">{material.qr_code}</p>
    </div>

    <div className="flex gap-2 mt-5 flex-wrap justify-center">
      <Button variant="outline" size="sm" onClick={copyCode}>
        <Copy className="w-4 h-4 mr-2" />
        {t('copy')}
      </Button>
      <Button variant="outline" size="sm" onClick={downloadQR}>
        <Download className="w-4 h-4 mr-2" />
        {t('download')}
      </Button>
      <Button variant="outline" size="sm" onClick={printQR}>
        <Printer className="w-4 h-4 mr-2" />
        {t('print')}
      </Button>
    </div>
  </div>
</DialogContent>

    </Dialog>
  );
}