import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import MediaGrid from "@/components/MediaGrid";
import MediaModal from "@/components/MediaModal";
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  Eye, 
  Bookmark, 
  BookmarkCheck,
  Send,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Tweet {
  id: number;
  tweetId: string;
  url: string;
  text: string | null;
  createdAt: Date | string;
  authorHandle: string;
  authorName: string | null;
  authorProfileUrl: string | null;
  authorProfileImageUrl?: string | null;
  authorCoverPhoto?: string | null;
  authorFollowersCount: number;
  authorFollowingCount?: number;
  authorVerified: boolean;
  authorDescription: string | null;
  authorJobTitle?: string | null;
  authorLocation?: string | null;
  authorWebsite?: string | null;
  authorJoinDate?: string | null;
  authorTweetsCount?: number;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount: number | null;
  mediaUrls: Array<{type: 'photo'|'video', url: string, thumbnail?: string}> | null;
  mediaType: string | null;
  trendScore: number;
  categories: string[] | null;
}

interface TweetCardProps {
  tweet: Tweet;
  onRemove?: () => void;
}

export default function TweetCard({ tweet, onRemove }: TweetCardProps) {
  // Early return if tweet or essential fields are null
  if (!tweet || !tweet.text) {
    console.warn('TweetCard: Invalid tweet data', tweet);
    return null;
  }
  
  const [showFullText, setShowFullText] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  
  const utils = trpc.useUtils();
  
  const bookmarkMutation = trpc.bookmarks.toggle.useMutation({
    onSuccess: () => {
      utils.bookmarks.list.invalidate();
      toast.success("Bookmark updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendToTelegramMutation = trpc.telegram.sendTweet.useMutation({
    onSuccess: () => {
      toast.success("Sent to Telegram!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const sendWithAIMutation = trpc.telegram.sendTweetWithAI.useMutation({
    onSuccess: () => {
      toast.success("Sent to Telegram with AI rewrite!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { data: bookmarks } = trpc.bookmarks.list.useQuery();
  const isBookmarked = bookmarks?.some(b => b && b?.tweetId === tweet?.id) ?? false;

  const handleBookmark = () => {
    bookmarkMutation.mutate({ tweetId: tweet.id });
  };

  const handleSendToTelegram = () => {
    sendToTelegramMutation.mutate({ tweetId: tweet.id });
  };

  const handleSendWithAI = () => {
    sendWithAIMutation.mutate({ tweetId: tweet.id });
  };

  const handleDownloadMedia = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = url.split('/').pop() || 'media';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download media");
    }
  };

  // Convert URLs in text to clickable links
  const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const textPreview = tweet.text.length > 280 ? tweet.text.slice(0, 280) + "..." : tweet.text;
  
  // mediaUrls can be string (old format) or structured array (new format)
  const mediaUrlsArray = (() => {
    if (!tweet.mediaUrls) return [];
    // If it's already an array, return it
    if (Array.isArray(tweet.mediaUrls)) return tweet.mediaUrls;
    // If it's a string, try to parse it
    if (typeof tweet.mediaUrls === 'string') {
      try {
        const parsed = JSON.parse(tweet.mediaUrls);
        // Old format: array of strings → convert to new format
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed.map(url => ({ type: 'photo' as const, url }));
        }
        // New format: array of objects
        return parsed;
      } catch {
        return [];
      }
    }
    return [];
  })();
  
  const categoriesArray = typeof tweet.categories === 'string'
    ? JSON.parse(tweet.categories)
    : (tweet.categories || []);
  
  const hasMedia = mediaUrlsArray && mediaUrlsArray.length > 0;
  const isVideo = mediaUrlsArray?.some((m: any) => m && m?.type === 'video') ?? false;
  
  // All media items are visible (thumbnails are stored separately)
  const visibleMediaCount = mediaUrlsArray.length;

  return (
    <>
      <Card className="hover:bg-accent/5 transition-colors">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex gap-3 mb-3">
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <button className="flex-shrink-0 hover:opacity-80 transition-opacity">
                  <img
                    src={tweet.authorProfileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.authorHandle)}&background=random`}
                    alt={tweet.authorName || tweet.authorHandle}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[380px] p-0 overflow-hidden max-h-[500px]" side="bottom" align="start">
                {/* Cover Photo */}
                <div className="h-[120px] bg-gradient-to-r from-blue-500 to-purple-500 relative">
                  {tweet.authorCoverPhoto && (
                    <img
                      src={tweet.authorCoverPhoto}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <div className="px-4 pb-4">
                  {/* Profile Picture - overlapping cover */}
                  <div className="-mt-[50px] mb-3 relative z-10">
                    <div className="w-[80px] h-[80px] rounded-full border-4 border-card bg-card overflow-hidden inline-block">
                      <img
                        src={tweet.authorProfileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.authorHandle)}&background=random`}
                        alt={tweet.authorName || tweet.authorHandle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Name and Handle */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-bold text-[17px] text-foreground">{tweet.authorName || tweet.authorHandle}</span>
                      {tweet.authorVerified && (
                        <svg className="w-[18px] h-[18px] text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                        </svg>
                      )}
                    </div>
                    <p className="text-[15px] text-muted-foreground">@{tweet.authorHandle}</p>
                  </div>

                  {/* Job Title */}
                  {tweet.authorJobTitle && (
                    <p className="text-[15px] text-muted-foreground mb-2">{tweet.authorJobTitle}</p>
                  )}

                  {/* Bio */}
                  {tweet.authorDescription && (
                    <p className="text-sm mb-3">{tweet.authorDescription}</p>
                  )}

                  {/* Location, Website, Join Date */}
                  <div className="flex flex-col gap-1 mb-3 text-sm text-muted-foreground">
                    {tweet.authorLocation && (
                      <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Location</p>
                          </TooltipContent>
                        </Tooltip>
                        <span>{tweet.authorLocation}</span>
                      </div>
                    )}
                    {tweet.authorWebsite && (
                      <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Website</p>
                          </TooltipContent>
                        </Tooltip>
                        <a href={tweet.authorWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                          {tweet.authorWebsite.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                    {tweet.authorJoinDate && (
                      <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Join Date</p>
                          </TooltipContent>
                        </Tooltip>
                        <span>Joined {new Date(tweet.authorJoinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm mb-3">
                    {tweet.authorTweetsCount !== undefined && (
                      <div>
                        <span className="font-bold">{tweet.authorTweetsCount.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">Posts</span>
                      </div>
                    )}
                    {tweet.authorFollowingCount !== undefined && (
                      <div>
                        <span className="font-bold">{tweet.authorFollowingCount.toLocaleString()}</span>
                        <span className="text-muted-foreground ml-1">Following</span>
                      </div>
                    )}
                    <div>
                      <span className="font-bold">{tweet.authorFollowersCount.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">Followers</span>
                    </div>
                  </div>

                  {/* View Profile Button */}
                  <Button asChild size="sm" className="w-full">
                    <a
                      href={tweet.authorProfileUrl || `https://twitter.com/${tweet.authorHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on X
                    </a>
                  </Button>
                </div>
              </HoverCardContent>
            </HoverCard>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <a
                  href={tweet.authorProfileUrl || `https://twitter.com/${tweet.authorHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold hover:underline truncate"
                >
                  {tweet.authorName || tweet.authorHandle}
                </a>
                {tweet.authorVerified && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                  </svg>
                )}
                <span className="text-muted-foreground">@{tweet.authorHandle}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground text-sm">
                  {new Date(tweet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tweet Text */}
          <div className="mb-3">
            <p className="whitespace-pre-wrap break-words">
              {showFullText ? linkify(tweet.text) : linkify(textPreview)}
            </p>
            {tweet.text.length > 280 && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-primary text-sm hover:underline mt-1"
              >
                {showFullText ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Media */}
          {hasMedia && (
            <div className="mb-3">
              <MediaGrid
                mediaUrls={mediaUrlsArray}
                mediaType={tweet.mediaType}
                onMediaClick={(index) => {
                  setSelectedMediaIndex(index);
                  setMediaModalOpen(true);
                }}
                onDownload={handleDownloadMedia}
              />
            </div>
          )}

          {/* Categories */}
          {categoriesArray && categoriesArray.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {categoriesArray.map((category: string) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 text-muted-foreground text-sm mb-3">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>{tweet.replyCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Repeat2 className="w-4 h-4" />
              <span>{tweet.retweetCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              <span>{tweet.likeCount.toLocaleString()}</span>
            </div>
            {tweet.viewCount && (
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{tweet.viewCount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkMutation.isPending}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 mr-1" />
              ) : (
                <Bookmark className="w-4 h-4 mr-1" />
              )}
              {isBookmarked ? "Saved" : "Save"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendToTelegram}
              disabled={sendToTelegramMutation.isPending}
            >
              <Send className="w-4 h-4 mr-1" />
              Send to Telegram
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSendWithAI}
              disabled={sendWithAIMutation.isPending}
            >
              {sendWithAIMutation.isPending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Send with AI
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={tweet.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                View on X
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Modal */}
      <MediaModal
        mediaUrls={mediaUrlsArray}
        initialIndex={selectedMediaIndex}
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onDownload={handleDownloadMedia}
      />
    </>
  );
}
