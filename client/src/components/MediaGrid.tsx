import { useState, useRef } from "react";
import { Play, Download } from "lucide-react";

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}

interface MediaGridProps {
  mediaUrls: Array<{type: 'photo'|'video', url: string, thumbnail?: string}>;
  mediaType?: string | null;
  onMediaClick: (index: number) => void;
  onDownload: (url: string) => void;
}

export default function MediaGrid({ mediaUrls, mediaType, onMediaClick, onDownload }: MediaGridProps) {
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Convert new media structure to MediaItem format
  const mediaItems: MediaItem[] = mediaUrls.map(media => ({
    url: media.url,
    type: media.type === 'video' ? 'video' : 'image',
    thumbnail: media.thumbnail,
  }));

  const count = mediaItems.length;

  // Twitter-style grid layout classes
  const getGridClass = () => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-2 grid-rows-2';
  };

  const getItemClass = (index: number) => {
    const baseClass = 'relative group overflow-hidden bg-black rounded-lg';
    
    if (count === 1) {
      return `${baseClass} aspect-video w-full`;
    }
    
    if (count === 2) {
      return `${baseClass} aspect-square w-full h-[280px]`;
    }
    
    if (count === 3) {
      // First image spans 2 columns
      if (index === 0) {
        return `${baseClass} col-span-2 aspect-video w-full h-[280px]`;
      }
      return `${baseClass} aspect-square w-full h-[138px]`;
    }
    
    // 4 or more: 2x2 grid, show only first 4
    return `${baseClass} aspect-square w-full h-[200px]`;
  };

  const handleVideoClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadedVideos(prev => new Set(prev).add(index));
  };

  return (
    <div className={`grid gap-[2px] rounded-2xl overflow-hidden border border-border ${getGridClass()}`}>
      {mediaItems.slice(0, 4).map((item, index) => (
        <div
          key={index}
          className={getItemClass(index)}
        >
          {item.type === 'video' ? (
            loadedVideos.has(index) ? (
              // Loaded video player
              <div 
                className="relative w-full h-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  // Pause video before opening modal
                  const video = videoRefs.current.get(index);
                  if (video) {
                    video.pause();
                  }
                  onMediaClick(index);
                }}
              >
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el);
                  }}
                  src={item.url}
                  controls
                  loop
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Pause video before opening modal
                    const video = videoRefs.current.get(index);
                    if (video) {
                      video.pause();
                    }
                    onMediaClick(index);
                  }}
                />
              </div>
            ) : (
              // Video thumbnail with play button
              <div
                className="relative w-full h-full cursor-pointer flex items-center justify-center group/video"
                onClick={(e) => handleVideoClick(index, e)}
              >
                {/* Thumbnail */}
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt="Video thumbnail"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
                
                {/* Play button */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/90 group-hover/video:bg-white flex items-center justify-center transition-all group-hover/video:scale-110">
                  <Play className="w-8 h-8 text-black ml-1 fill-current" />
                </div>
                
                {/* Video label */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Video
                </div>
              </div>
            )
          ) : (
            // Image with download button in corner
            <>
              <img
                src={item.url}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onMediaClick(index)}
              />
              
              {/* Download button in top-right corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(item.url);
                }}
                className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70"
                aria-label="Download image"
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            </>
          )}
          
          {/* Show "+N" overlay for 4+ media */}
          {count > 4 && index === 3 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
              onClick={() => onMediaClick(index)}
            >
              +{count - 4}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
