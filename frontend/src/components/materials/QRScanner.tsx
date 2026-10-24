import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Dialog, DialogTitle, DialogHeader, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Camera, X, Search, ScanLine } from 'lucide-react';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (material: any) => void;
  materials: any[];
  t: (key: string) => string;
}

export default function QRScanner({ open, onClose, onScan, materials, t }: QRScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) stopCamera();
  }, [open]);

const startCamera = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error(t('cameraNotSupported'));
      return;
    }

    console.info('QRScanner.startCamera: requesting camera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    streamRef.current = stream;

    // show the video container first so the <video> element gets mounted and ref is populated
    setIsScanning(true);

    // wait until videoRef.current exists and then attach stream and play
    await new Promise<void>((resolve) => {
      const startTimeout = window.setTimeout(() => {
        // timeout attaching video
        console.warn('QRScanner.startCamera: video element did not mount in time');
        resolve();
      }, 2000);

      const attach = () => {
        const video = videoRef.current;
        if (!video) return false;
        video.srcObject = streamRef.current as MediaStream;
        video.muted = true;
        video.playsInline = true;

        const onCanPlay = () => {
          video.removeEventListener('canplay', onCanPlay);
          clearTimeout(startTimeout);
          resolve();
        };
        video.addEventListener('canplay', onCanPlay);
        video.play().catch(err => {
          console.warn('QRScanner.startCamera: video.play() failed', err);
          // still resolve so scanning loop can try
          clearTimeout(startTimeout);
          resolve();
        });
        return true;
      };

      // try immediately, otherwise poll briefly until mounted
      if (!attach()) {
        const interval = window.setInterval(() => {
          if (attach()) {
            clearInterval(interval);
          }
        }, 100);
      }
    });

    // start scanning loop now that video should be playing
    startScanLoop();
    toast.info(t('cameraStarted'));
  } catch (err) {
    console.error('Camera start failed', err);
    toast.error(t('couldNotAccessCamera'));
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }
};


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    scanLoopRef.current = null;
    setIsScanning(false);
  };

  const startScanLoop = () => {
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      if (video.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        const codeText = code.data;
        const found = materials.find(m => m.qr_code?.toLowerCase() === codeText.toLowerCase());
        if (found) {
          onScan(found);
          stopCamera();
          onClose();
          toast.success(`${t('scanned')}: ${found.name}`);
          return;
        }
      }

      scanLoopRef.current = requestAnimationFrame(tick);
    };

    if (!scanLoopRef.current) scanLoopRef.current = requestAnimationFrame(tick);
  };

  const handleManualSearch = () => {
    if (!manualCode.trim()) return toast.error(t('pleaseEnterCode'));
    const found = materials.find(m =>
      m.qr_code?.toLowerCase() === manualCode.toLowerCase() ||
      m.qr_code?.toLowerCase().includes(manualCode.toLowerCase())
    );
    if (found) {
      onScan(found);
      onClose();
      toast.success(`${t('found')}: ${found.name}`);
    } else {
      toast.error(t('materialNotFound'));
    }
  };

  const simulateScan = () => {
    if (materials.length > 0) {
      const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
      onScan(randomMaterial);
      onClose();
      toast.success(`${t('scanned')}: ${randomMaterial.name}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            {t('scanQRCode')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden">
            {isScanning ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" />
                <Button variant="secondary" size="sm" className="absolute top-3 right-3" onClick={stopCamera}>
                  <X className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" className="absolute bottom-3 left-1/2 -translate-x-1/2" onClick={simulateScan}>
                  {t('simulateScan')}
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/70">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">{t('cameraPreview')}</p>
                <Button variant="secondary" className="mt-4" onClick={startCamera}>
                  <Camera className="w-4 h-4 mr-2" />
                  {t('startCamera')}
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-slate-500">{t('orEnterManually')}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder={t('enterMaterialCode')}
              onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
              className="h-11"
            />
            <Button onClick={handleManualSearch} className="bg-slate-900 hover:bg-slate-800">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
