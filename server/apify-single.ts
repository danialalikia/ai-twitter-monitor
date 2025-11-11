/**
 * Fetch a single tweet by URL or ID from Apify
 */

import type { NormalizedTweet } from "./apify";

export async function fetchSingleTweet(
  tweetUrl: string,
  apifyToken: string
): Promise<NormalizedTweet | null> {
  const actorId = "kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest";

  // Extract tweet ID from URL
  const urlMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  if (!urlMatch) {
    console.error('[Apify] Invalid tweet URL format');
    return null;
  }
  
  const tweetId = urlMatch[1];
  
  // Use tweetIDs parameter to fetch specific tweet
  const input = {
    tweetIDs: [tweetId],
    maxItems: 1,
  };

  console.log('[Apify] Fetching single tweet:', tweetUrl);

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
    const maxAttempts = 30; // 2.5 minutes max wait time

    while (status === "RUNNING" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
      
      console.log(`[Apify] Run status: ${status} (attempt ${attempts}/${maxAttempts})`);
    }

    if (status !== "SUCCEEDED") {
      throw new Error(`Apify actor run failed with status: ${status}`);
    }

    // Get the results
    const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
    const results = await resultsResponse.json();

    if (!results || results.length === 0) {
      console.log('[Apify] No tweet found');
      return null;
    }

    // Import normalizeTweet function
    const { normalizeTweet } = await import("./apify");
    
    // Return the first (and only) result
    return normalizeTweet(results[0]);
  } catch (error) {
    console.error("[Apify] Error fetching single tweet:", error);
    return null;
  }
}
