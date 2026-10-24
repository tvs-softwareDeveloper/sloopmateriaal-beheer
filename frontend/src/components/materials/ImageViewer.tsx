import React from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageViewerProps {
  images: string[] | null | undefined;
  selectedIndex?: number | null;
  onClose: () => void;
}

export default function ImageViewer({ images, selectedIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = React.useState<number>(selectedIndex ?? 0);

  React.useEffect(() => {
    setCurrentIndex(selectedIndex ?? 0);
  }, [selectedIndex]);

  const handlePrevious = () => {
    const len = images?.length ?? 0;
    if (len === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? len - 1 : prev - 1));
  };

  const handleNext = () => {
    const len = images?.length ?? 0;
    if (len === 0) return;
    setCurrentIndex((prev) => (prev === len - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={!!images && images.length > 0} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-black border-0 [&>button]:hidden">
        <div className="relative">
          <img 
            src={images[currentIndex]} 
            alt={`Foto ${currentIndex + 1}`}
            className="w-full h-auto max-h-[85vh] object-contain"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}