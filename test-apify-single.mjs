const tweetId = "1987917691831857290";
const apifyToken = process.env.APIFY_TOKEN || "apify_api_YOUR_TOKEN";

const actorId = "kaitoeasyapi~twitter-x-data-tweet-scraper-pay-per-result-cheapest";

const input = {
  tweetIDs: [tweetId],
  maxItems: 1,
};

console.log("Starting Apify actor with input:", JSON.stringify(input, null, 2));

const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(input),
});

if (!runResponse.ok) {
  const errorText = await runResponse.text();
  console.error(`Failed to start actor: ${runResponse.status} ${errorText}`);
  process.exit(1);
}

const runData = await runResponse.json();
const runId = runData.data.id;

console.log(`Run started: ${runId}`);
console.log("Waiting for completion...");

// Wait for completion
let status = "RUNNING";
let attempts = 0;
const maxAttempts = 30;

while (status === "RUNNING" && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`);
  const statusData = await statusResponse.json();
  status = statusData.data.status;
  attempts++;
  
  console.log(`Status: ${status} (attempt ${attempts}/${maxAttempts})`);
}

if (status !== "SUCCEEDED") {
  console.error(`Actor run failed with status: ${status}`);
  process.exit(1);
}

// Get results
const resultsResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
const results = await resultsResponse.json();

console.log(`\nResults count: ${results.length}`);
if (results.length > 0) {
  console.log("First result:", JSON.stringify(results[0], null, 2));
} else {
  console.log("No results found!");
}
