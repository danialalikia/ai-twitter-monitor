import { Card } from "@/components/ui/card";
import { Check, MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface ProfileHoverCardProps {
  // Author information
  name: string;
  handle: string;
  bio?: string | null;
  profileImage?: string | null;
  coverPhoto?: string | null;
  verified: boolean;
  followers: number;
  following: number;
  profileUrl: string;
  
  // Position
  mouseX: number;
  mouseY: number;
}

export function ProfileHoverCard({
  name,
  handle,
  bio,
  profileImage,
  coverPhoto,
  verified,
  followers,
  following,
  profileUrl,
  mouseX,
  mouseY,
}: ProfileHoverCardProps) {
  const [position, setPosition] = useState({ x: mouseX, y: mouseY });

  useEffect(() => {
    // Position card near mouse but keep it on screen
    const cardWidth = 320;
    const cardHeight = 400;
    const padding = 16;

    let x = mouseX + 20; // Offset from mouse
    let y = mouseY - cardHeight / 2;

    // Keep card on screen horizontally
    if (x + cardWidth > window.innerWidth - padding) {
      x = mouseX - cardWidth - 20;
    }
    if (x < padding) {
      x = padding;
    }

    // Keep card on screen vertically
    if (y < padding) {
      y = padding;
    }
    if (y + cardHeight > window.innerHeight - padding) {
      y = window.innerHeight - cardHeight - padding;
    }

    setPosition({ x, y });
  }, [mouseX, mouseY]);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Card
      className="fixed z-50 w-80 overflow-hidden shadow-2xl border-border bg-card"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Cover Photo */}
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 relative">
        {coverPhoto && (
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Section */}
      <div className="px-4 pb-4">
        {/* Profile Picture */}
        <div className="relative -mt-12 mb-3">
          <div className="w-20 h-20 rounded-full border-4 border-card bg-muted overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 text-white text-2xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name and Handle */}
        <div className="mb-3">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-foreground text-base">{name}</h3>
            {verified && (
              <Check className="w-4 h-4 text-blue-500 fill-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{handle}</p>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-foreground mb-3 line-clamp-3">{bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-4 text-sm mb-3">
          <div>
            <span className="font-bold text-foreground">{formatCount(following)}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </div>
          <div>
            <span className="font-bold text-foreground">{formatCount(followers)}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </div>
        </div>

        {/* View Profile Button */}
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-full text-center font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          View on X
        </a>
      </div>
    </Card>
  );
}
