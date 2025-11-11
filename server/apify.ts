/**
 * Apify Twitter Scraper Integration
 * Actor: kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest
 * 
 * This actor returns already-normalized data in CSV/JSON format with direct fields.
 * No need to parse complex Twitter API structures.
 */

/**
 * Type definition based on actual actor output
 * All fields are at the top level (already normalized by the actor)
 */
export interface ApifyTweetData {
  id: string;
  url: string;
  text: string;
  createdAt: string; // ISO timestamp string
  language: string;
  // Author info can be either at top level (old format) or in author object (new format)
  author?: {
    userName: string;
    name: string;
    url: string;
    profilePicture: string;
    coverPicture?: string;
    description: string;
    location: string;
    followers: number;
    following: number;
    statusesCount: number;
    createdAt: string;
    isVerified: boolean;
    isBlueVerified: boolean;
    entities?: {
      url?: {
        urls?: Array<{
          url: string;
          expanded_url: string;
        }>;
      };
    };
    profile_bio?: {
      description?: string;
      entities?: {
        url?: {
          urls?: Array<{
            url: string;
            expanded_url: string;
          }>;
        };
      };
    };
  };
  authorHandle: string;
  authorName: string;
  authorProfileUrl: string;
  authorProfileImageUrl: string;
  authorFollowersCount: number;
  authorFollowingCount: number;
  authorVerified: boolean;
  authorDescription: string;
  replyCount: number;
  retweetCount: number;
  quoteCount: number;
  likeCount: number;
  viewCount: number;
  impressions: number;
  extendedEntities?: {
    media?: Array<{
      media_url_https?: string;
      type?: string;
      video_info?: {
        variants?: Array<{
          content_type?: string;
          url?: string;
          bitrate?: number;
        }>;
      };
    }>;
  };
  media?: any[]; // Fallback: Array of media objects from actor
  mediaUrls: string; // Fallback: JSON array as string, e.g., '["url1","url2"]'
  mediaType: string | null;
  quotedStatusId: string | null;
  inReplyToStatusId: string | null;
  hashtags: string; // JSON array as string
  mentions: string; // JSON array as string
  urls: string; // JSON array as string
  entities?: {
    urls?: Array<{
      url: string; // t.co short URL
      expanded_url: string; // Original URL
      display_url: string; // Display text
      indices: number[];
    }>;
  };
  trendScore: number;
  categories: string; // JSON array as string, e.g., '["High Engagement","Media-rich"]'
  rawData: string; // JSON object as string
  fetchedAt?: string;
  runId?: number;
}

export interface NormalizedTweet {
  tweetId: string;
  url: string;
  text: string;
  createdAt: Date;
  language: string | null;
  authorHandle: string;
  authorName: string;
  authorProfileUrl: string;
  authorProfileImageUrl: string | null;
  authorCoverPhoto: string | null;
  authorFollowersCount: number;
  authorFollowingCount: number;
  authorVerified: boolean;
  authorDescription: string | null;
  authorJobTitle: string | null;
  authorLocation: string | null;
  authorWebsite: string | null;
  authorJoinDate: string | null;
  authorTweetsCount: number;
  replyCount: number;
  retweetCount: number;
  quoteCount: number;
  likeCount: number;
  viewCount: number;
  impressions: number;
  mediaUrls: Array<{type: 'photo'|'video', url: string, thumbnail?: string}> | null;
  mediaType: string | null;
  quotedStatusId: string | null;
  inReplyToStatusId: string | null;
  hashtags: string[] | null;
  mentions: string[] | null;
  urls: string[] | null;
  trendScore?: number;
  categories?: string[] | null;
  rawData: any;
}

export interface FetchFilters {
  hasImages?: boolean;
  hasVideos?: boolean;
  hasLinks?: boolean;
  verifiedOnly?: boolean;
  minLikes?: number;
  minRetweets?: number;
  minViews?: number;
}

/**
 * Fetch tweets from Apify actor
 */
export async function fetchTweetsFromApify(
  keywords: string[],
  maxItems: number,
  apifyToken: string,
  filters?: FetchFilters
): Promise<NormalizedTweet[]> {
  const actorId = "kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest";

  const input: any = {
    twitterContent: keywords.join(" OR "), // Search query with OR operator
    maxItems,
    queryType: "Latest", // Latest tweets first
    lang: "en", // English tweets only
  };

  // Add advanced filters if provided
  if (filters) {
    // Content type filters
    if (filters.hasImages) input["filter:images"] = true;
    if (filters.hasVideos) input["filter:videos"] = true;
    if (filters.hasLinks) input["filter:links"] = true;
    if (filters.hasImages || filters.hasVideos) input["filter:media"] = true;
    if (filters.verifiedOnly) input["filter:blue_verified"] = true;
    
    // Engagement filters - add to search query
    const engagementFilters: string[] = [];
    if (filters.minLikes) engagementFilters.push(`min_faves:${filters.minLikes}`);
    if (filters.minRetweets) engagementFilters.push(`min_retweets:${filters.minRetweets}`);
    if (filters.minViews) engagementFilters.push(`min_replies:0`);
    
    if (engagementFilters.length > 0) {
      input.twitterContent = `(${keywords.join(" OR ")}) ${engagementFilters.join(" ")}`;
    }
  }

  console.log('[Apify] Starting actor with input:', JSON.stringify(input, null, 2));

  try {
    // Start the actor run
    const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(`Failed to start Apify actor: ${runResponse.status} ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for the run to complete
    let status = "RUNNING";
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time

    while (status === "RUNNING" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
    }

    if (status !== "SUCCEEDED") {
      throw new Error(`Apify actor run failed with status: ${status}`);
    }

    // Fetch the results
    const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
    
    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
    }

    const results: ApifyTweetData[] = await resultsResponse.json();

    console.log(`[Apify] Received ${results.length} tweets from actor`);
    if (results.length > 0) {
      console.log('[Apify] Sample tweet structure:', JSON.stringify(results[0], null, 2));
      console.log('[Apify] Media field check:', {
        hasMedia: !!results[0].media,
        mediaType: typeof results[0].media,
        mediaLength: Array.isArray(results[0].media) ? results[0].media.length : 'not array',
        mediaUrls: results[0].mediaUrls,
        mediaUrlsType: typeof results[0].mediaUrls
      });
    }

    // Normalize the data
    const normalized = results.map(normalizeTweet).filter((t): t is NormalizedTweet => t !== null);
    console.log(`[Apify] Normalized ${normalized.length} tweets successfully`);
    
    // Debug: Check media extraction
    const tweetsWithMedia = normalized.filter(t => t.mediaUrls && t.mediaUrls.length > 0);
    console.log(`[Apify] Tweets with media: ${tweetsWithMedia.length}/${normalized.length}`);
    if (tweetsWithMedia.length > 0) {
      console.log('[Apify] Sample media URLs:', tweetsWithMedia[0].mediaUrls);
    }
    
    return normalized;
  } catch (error) {
    console.error("[Apify] Error fetching tweets:", error);
    throw error;
  }
}

/**
 * Extract job title from bio
 * Job title is typically the first line before emoji or newline
 */
function extractJobTitle(bio: string | null | undefined): string | null {
  if (!bio) return null;
  
  // Remove URLs first
  let cleaned = bio.replace(/https?:\/\/\S+/g, '').trim();
  
  // Split by newline and take first line
  const firstLine = cleaned.split('\n')[0].trim();
  
  // If first line is too long (>100 chars), it's probably not a job title
  if (firstLine.length > 100) return null;
  
  // Remove emoji and special characters (using surrogate pairs for ES5 compatibility)
  const withoutEmoji = firstLine.replace(/[\uD800-\uDFFF]|[\u2600-\u27BF]/g, '').trim();
  
  // If empty after cleaning, return null
  if (!withoutEmoji || withoutEmoji.length < 3) return null;
  
  return withoutEmoji;
}

/**
 * Normalize Apify actor output to our schema
 * The actor already returns normalized data, so this is mostly type conversion
 */
function normalizeTweet(raw: ApifyTweetData): NormalizedTweet | null {
  try {
    // Skip if missing essential fields
    if (!raw.id || !raw.url || !raw.text) {
      console.warn('[Apify] Skipping tweet with missing essential fields:', raw.id);
      return null;
    }

    // Parse JSON string arrays safely
    const parseJsonArray = (jsonString: string | null | undefined): string[] | null => {
      if (!jsonString || jsonString === '' || jsonString === 'null') return null;
      try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        console.warn('[Apify] Failed to parse JSON array:', jsonString);
        return null;
      }
    };

    // Parse media URLs - support extendedEntities.media (Twitter API format)
    // Store as structured array: [{type: 'photo'|'video', url: string, thumbnail?: string}]
    let mediaUrls: Array<{type: 'photo'|'video', url: string, thumbnail?: string}> | null = null;
    
    // First try extendedEntities.media (Twitter API format from actor)
    if (raw.extendedEntities?.media && Array.isArray(raw.extendedEntities.media) && raw.extendedEntities.media.length > 0) {
      mediaUrls = raw.extendedEntities.media
        .map((m: any): {type: 'photo'|'video', url: string, thumbnail?: string} | null => {
          // For videos, get the highest quality variant + thumbnail
          if (m.type === 'video' && m.video_info?.variants) {
            const mp4Variants = m.video_info.variants.filter((v: any) => v.content_type === 'video/mp4');
            if (mp4Variants.length > 0) {
              // Sort by bitrate descending and get highest quality
              mp4Variants.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
              return {
                type: 'video',
                url: mp4Variants[0].url as string,
                thumbnail: m.media_url_https as string | undefined,
              };
            }
          }
          // For photos, just return URL
          if (m.media_url_https) {
            return {
              type: 'photo',
              url: m.media_url_https as string,
            };
          }
          return null;
        })
        .filter((item): item is {type: 'photo'|'video', url: string, thumbnail?: string} => item !== null);
      
      if (mediaUrls && mediaUrls.length === 0) mediaUrls = null;
    }
    
    // Fallback to 'media' array if extendedEntities didn't work
    if (!mediaUrls && raw.media && Array.isArray(raw.media) && raw.media.length > 0) {
      const fallbackMedia = raw.media
        .map((m: any) => {
          const url = m.url || m.media_url_https || m.preview_image_url || m.expanded_url;
          if (!url) return null;
          return {
            type: 'photo' as const,
            url: url as string,
          };
        })
        .filter((item): item is {type: 'photo', url: string} => item !== null);
      
      if (fallbackMedia.length > 0) {
        mediaUrls = fallbackMedia as Array<{type: 'photo'|'video', url: string, thumbnail?: string}>;
      }
    }
    
    // Final fallback to mediaUrls string - convert old format to new
    if (!mediaUrls) {
      const oldFormat = parseJsonArray(raw.mediaUrls);
      if (oldFormat) {
        mediaUrls = oldFormat.map(url => ({
          type: 'photo' as const,
          url,
        }));
      }
    }

    // Parse hashtags
    const hashtags = parseJsonArray(raw.hashtags);

    // Parse mentions
    const mentions = parseJsonArray(raw.mentions);

    // Parse URLs
    const urls = parseJsonArray(raw.urls);

    // Parse categories
    const categories = parseJsonArray(raw.categories);

    // Parse rawData (it's a JSON string containing simplified data)
    let rawDataObj: any = {};
    try {
      if (raw.rawData && typeof raw.rawData === 'string') {
        rawDataObj = JSON.parse(raw.rawData);
      }
    } catch (e) {
      console.warn('[Apify] Failed to parse rawData JSON');
    }

    // Replace t.co URLs with expanded URLs in text
    let processedText = raw.text;
    
    // Try multiple sources for URL entities
    let urlEntities: Array<{ url: string; expanded_url: string }> = [];
    
    // 1. Try entities.urls (Twitter API format)
    if (raw.entities?.urls && Array.isArray(raw.entities.urls)) {
      urlEntities = raw.entities.urls;
    }
    // 2. Try raw.urls field (Apify normalized format - may be JSON string)
    else if (raw.urls) {
      try {
        const urlsArray = typeof raw.urls === 'string' ? JSON.parse(raw.urls) : raw.urls;
        if (Array.isArray(urlsArray)) {
          urlEntities = urlsArray;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Replace all t.co URLs with expanded URLs
    for (const urlEntity of urlEntities) {
      if (urlEntity.url && urlEntity.expanded_url) {
        // Use global replace to handle multiple occurrences
        processedText = processedText.split(urlEntity.url).join(urlEntity.expanded_url);
      }
    }

    return {
      tweetId: raw.id,
      url: raw.url,
      text: processedText,
      createdAt: new Date(raw.createdAt),
      language: raw.language || null,
      // Extract author info from author object (Apify format)
      authorHandle: raw.author?.userName || raw.authorHandle || "unknown",
      authorName: raw.author?.name || raw.authorName || "Unknown User",
      authorProfileUrl: raw.author?.url || raw.authorProfileUrl || `https://x.com/${raw.author?.userName || 'unknown'}`,
      authorProfileImageUrl: raw.author?.profilePicture || raw.authorProfileImageUrl || null,
      authorCoverPhoto: raw.author?.coverPicture || null,
      authorFollowersCount: raw.author?.followers || raw.authorFollowersCount || 0,
      authorFollowingCount: raw.author?.following || raw.authorFollowingCount || 0,
      authorVerified: raw.author?.isBlueVerified || raw.author?.isVerified || raw.authorVerified || false,
      authorDescription: raw.author?.profile_bio?.description || raw.author?.description || raw.authorDescription || null,
      authorJobTitle: extractJobTitle(raw.author?.profile_bio?.description || raw.author?.description || raw.authorDescription),
      authorLocation: raw.author?.location || null,
      authorWebsite: raw.author?.profile_bio?.entities?.url?.urls?.[0]?.expanded_url || raw.author?.entities?.url?.urls?.[0]?.expanded_url || null,
      authorJoinDate: raw.author?.createdAt || null,
      authorTweetsCount: raw.author?.statusesCount || 0,
      replyCount: raw.replyCount || 0,
      retweetCount: raw.retweetCount || 0,
      quoteCount: raw.quoteCount || 0,
      likeCount: raw.likeCount || 0,
      viewCount: raw.viewCount || 0,
      impressions: raw.impressions || 0,
      mediaUrls,
      mediaType: raw.mediaType || null,
      quotedStatusId: raw.quotedStatusId || null,
      inReplyToStatusId: raw.inReplyToStatusId || null,
      hashtags,
      mentions,
      urls,
      trendScore: raw.trendScore,
      categories,
      rawData: rawDataObj, // Store the parsed simplified version
    };
  } catch (error) {
    console.error('[Apify] Error normalizing tweet:', error, raw);
    return null;
  }
}

/**
 * Test function to verify actor output structure
 */
export async function testApifyActor(apifyToken: string): Promise<void> {
  console.log('[Apify Test] Starting test run...');
  
  try {
    const results = await fetchTweetsFromApify(
      ["AI"],
      5,
      apifyToken
    );
    
    console.log(`[Apify Test] Successfully fetched ${results.length} tweets`);
    if (results.length > 0) {
      console.log('[Apify Test] First tweet:', JSON.stringify(results[0], null, 2));
    }
  } catch (error) {
    console.error('[Apify Test] Test failed:', error);
    throw error;
  }
}
