/**
 * Export Database Script
 * Exports all tables to JSON format for easy migration
 */

import { drizzle } from 'drizzle-orm/mysql2';
import fs from 'fs';
import * as schema from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function exportDatabase() {
  const exports = {};
  
  console.log('Exporting database...');
  
  // Export users
  console.log('Exporting users...');
  const users = await db.select().from(schema.users);
  exports.users = users;
  console.log(`  ${users.length} users exported`);
  
  // Export settings
  console.log('Exporting settings...');
  const settings = await db.select().from(schema.settings);
  exports.settings = settings;
  console.log(`  ${settings.length} settings exported`);
  
  // Export fetchSettings
  console.log('Exporting fetchSettings...');
  const fetchSettings = await db.select().from(schema.fetchSettings);
  exports.fetchSettings = fetchSettings;
  console.log(`  ${fetchSettings.length} fetchSettings exported`);
  
  // Export tweets
  console.log('Exporting tweets...');
  const tweets = await db.select().from(schema.tweets);
  exports.tweets = tweets;
  console.log(`  ${tweets.length} tweets exported`);
  
  // Export bookmarks
  console.log('Exporting bookmarks...');
  const bookmarks = await db.select().from(schema.bookmarks);
  exports.bookmarks = bookmarks;
  console.log(`  ${bookmarks.length} bookmarks exported`);
  
  // Export savedTweets
  console.log('Exporting savedTweets...');
  const savedTweets = await db.select().from(schema.savedTweets);
  exports.savedTweets = savedTweets;
  console.log(`  ${savedTweets.length} savedTweets exported`);
  
  // Export scheduledPosts
  console.log('Exporting scheduledPosts...');
  const scheduledPosts = await db.select().from(schema.scheduledPosts);
  exports.scheduledPosts = scheduledPosts;
  console.log(`  ${scheduledPosts.length} scheduledPosts exported`);
  
  // Export runs
  console.log('Exporting runs...');
  const runs = await db.select().from(schema.runs);
  exports.runs = runs;
  console.log(`  ${runs.length} runs exported`);
  
  // Export ignoredTweets
  console.log('Exporting ignoredTweets...');
  const ignoredTweets = await db.select().from(schema.ignoredTweets);
  exports.ignoredTweets = ignoredTweets;
  console.log(`  ${ignoredTweets.length} ignoredTweets exported`);
  
  // Export sentPosts
  console.log('Exporting sentPosts...');
  const sentPosts = await db.select().from(schema.sentPosts);
  exports.sentPosts = sentPosts;
  console.log(`  ${sentPosts.length} sentPosts exported`);
  
  // Save to file
  const filename = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(filename, JSON.stringify(exports, null, 2));
  
  console.log(`\n✅ Database exported to ${filename}`);
  console.log(`\nSummary:`);
  console.log(`  Users: ${exports.users.length}`);
  console.log(`  Settings: ${exports.settings.length}`);
  console.log(`  Fetch Settings: ${exports.fetchSettings.length}`);
  console.log(`  Tweets: ${exports.tweets.length}`);
  console.log(`  Bookmarks: ${exports.bookmarks.length}`);
  console.log(`  Saved Tweets: ${exports.savedTweets.length}`);
  console.log(`  Scheduled Posts: ${exports.scheduledPosts.length}`);
  console.log(`  Runs: ${exports.runs.length}`);
  console.log(`  Ignored Tweets: ${exports.ignoredTweets.length}`);
  console.log(`  Sent Posts: ${exports.sentPosts.length}`);
}

exportDatabase().catch(console.error);
