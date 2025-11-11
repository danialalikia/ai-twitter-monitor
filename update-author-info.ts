import { drizzle } from "drizzle-orm/mysql2";
import { tweets } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function updateAuthorInfo() {
  console.log("Starting author info update...");
  
  // Get all tweets
  const allTweets = await db.select().from(tweets);
  console.log(`Found ${allTweets.length} tweets to process`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const tweet of allTweets) {
    try {
      // Skip if already has author info
      if (tweet.authorName && tweet.authorName !== "Unknown User") {
        skipped++;
        continue;
      }
      
      // Parse rawData
      if (!tweet.rawData) {
        console.log(`Tweet ${tweet.id} has no rawData, skipping`);
        skipped++;
        continue;
      }
      
      const rawData = typeof tweet.rawData === 'string' 
        ? JSON.parse(tweet.rawData) 
        : tweet.rawData;
      
      // Extract author info from rawData
      const authorName = rawData.authorName || rawData.author?.name || null;
      const authorHandle = rawData.authorHandle || rawData.author?.username || tweet.authorHandle;
      const authorProfileImageUrl = rawData.authorProfileImageUrl || rawData.author?.profile_image_url || null;
      const authorDescription = rawData.authorDescription || rawData.author?.description || null;
      const authorFollowersCount = rawData.authorFollowersCount || rawData.author?.followers_count || 0;
      const authorFollowingCount = rawData.authorFollowingCount || rawData.author?.following_count || 0;
      const authorVerified = rawData.authorVerified || rawData.author?.verified || false;
      
      // Update tweet
      await db.update(tweets)
        .set({
          authorName,
          authorHandle,
          authorProfileImageUrl,
          authorDescription,
          authorFollowersCount,
          authorFollowingCount,
          authorVerified,
        })
        .where(eq(tweets.id, tweet.id));
      
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`Updated ${updated} tweets so far...`);
      }
    } catch (error) {
      console.error(`Error processing tweet ${tweet.id}:`, error);
    }
  }
  
  console.log(`\nUpdate complete!`);
  console.log(`- Updated: ${updated} tweets`);
  console.log(`- Skipped: ${skipped} tweets`);
}

updateAuthorInfo()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
