import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface MediaModalProps {
  mediaUrls: Array<{type: 'photo'|'video', url: string, thumbnail?: string}>;
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  onDownload: (url: string) => void;
}

export default function MediaModal({ mediaUrls, initialIndex, open, onClose, onDownload }: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Convert new media structure to MediaItem format
  const mediaItems: MediaItem[] = mediaUrls.map(media => ({
    url: media.url,
    type: media.type === 'video' ? 'video' : 'image',
    thumbnail: media.thumbnail,
  }));

  const currentMedia = mediaItems[currentIndex];
  const hasMultiple = mediaItems.length > 1;

  // Reset index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < mediaItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, currentIndex, mediaItems.length, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Download button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-16 z-10 text-white hover:bg-white/10"
        onClick={() => onDownload(currentMedia.url)}
      >
        <Download className="w-6 h-6" />
      </Button>

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-4 z-10 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {mediaItems.length}
        </div>
      )}

      {/* Previous button */}
      {hasMultiple && currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 w-12 h-12"
          onClick={() => setCurrentIndex(prev => prev - 1)}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* Next button */}
      {hasMultiple && currentIndex < mediaItems.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10 w-12 h-12"
          onClick={() => setCurrentIndex(prev => prev + 1)}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* Media content */}
      <div className="w-full h-full flex items-center justify-center p-4">
        {currentMedia.type === 'video' ? (
          <video
            key={currentMedia.url}
            src={currentMedia.url}
            controls
            autoPlay
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <img
            key={currentMedia.url}
            src={currentMedia.url}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => {
              // Click on image background closes modal
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          />
        )}
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
      />
    </div>
  );
}
