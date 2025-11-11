/**
 * Import Database Script
 * Imports all tables from JSON backup file
 */

import { drizzle } from 'drizzle-orm/mysql2';
import fs from 'fs';
import * as schema from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function importDatabase(filename) {
  if (!filename) {
    console.error('Usage: node import-database.mjs <backup-file.json>');
    process.exit(1);
  }
  
  if (!fs.existsSync(filename)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }
  
  console.log(`Importing database from ${filename}...`);
  
  const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
  
  // Import users
  if (data.users && data.users.length > 0) {
    console.log(`Importing ${data.users.length} users...`);
    await db.insert(schema.users).values(data.users).onDuplicateKeyUpdate({
      set: { name: schema.users.name }
    });
  }
  
  // Import settings
  if (data.settings && data.settings.length > 0) {
    console.log(`Importing ${data.settings.length} settings...`);
    for (const setting of data.settings) {
      await db.insert(schema.settings).values(setting).onDuplicateKeyUpdate({
        set: setting
      });
    }
  }
  
  // Import fetchSettings
  if (data.fetchSettings && data.fetchSettings.length > 0) {
    console.log(`Importing ${data.fetchSettings.length} fetchSettings...`);
    for (const fetchSetting of data.fetchSettings) {
      await db.insert(schema.fetchSettings).values(fetchSetting).onDuplicateKeyUpdate({
        set: fetchSetting
      });
    }
  }
  
  // Import tweets
  if (data.tweets && data.tweets.length > 0) {
    console.log(`Importing ${data.tweets.length} tweets...`);
    // Import in batches of 100
    for (let i = 0; i < data.tweets.length; i += 100) {
      const batch = data.tweets.slice(i, i + 100);
      await db.insert(schema.tweets).values(batch).onDuplicateKeyUpdate({
        set: { text: schema.tweets.text }
      });
      console.log(`  Imported ${Math.min(i + 100, data.tweets.length)}/${data.tweets.length} tweets`);
    }
  }
  
  // Import bookmarks
  if (data.bookmarks && data.bookmarks.length > 0) {
    console.log(`Importing ${data.bookmarks.length} bookmarks...`);
    await db.insert(schema.bookmarks).values(data.bookmarks).onDuplicateKeyUpdate({
      set: { tweetId: schema.bookmarks.tweetId }
    });
  }
  
  // Import savedTweets
  if (data.savedTweets && data.savedTweets.length > 0) {
    console.log(`Importing ${data.savedTweets.length} savedTweets...`);
    await db.insert(schema.savedTweets).values(data.savedTweets).onDuplicateKeyUpdate({
      set: { tweetId: schema.savedTweets.tweetId }
    });
  }
  
  // Import scheduledPosts
  if (data.scheduledPosts && data.scheduledPosts.length > 0) {
    console.log(`Importing ${data.scheduledPosts.length} scheduledPosts...`);
    await db.insert(schema.scheduledPosts).values(data.scheduledPosts).onDuplicateKeyUpdate({
      set: { tweetId: schema.scheduledPosts.tweetId }
    });
  }
  
  // Import runs
  if (data.runs && data.runs.length > 0) {
    console.log(`Importing ${data.runs.length} runs...`);
    await db.insert(schema.runs).values(data.runs).onDuplicateKeyUpdate({
      set: { status: schema.runs.status }
    });
  }
  
  // Import ignoredTweets
  if (data.ignoredTweets && data.ignoredTweets.length > 0) {
    console.log(`Importing ${data.ignoredTweets.length} ignoredTweets...`);
    await db.insert(schema.ignoredTweets).values(data.ignoredTweets).onDuplicateKeyUpdate({
      set: { tweetId: schema.ignoredTweets.tweetId }
    });
  }
  
  // Import sentPosts
  if (data.sentPosts && data.sentPosts.length > 0) {
    console.log(`Importing ${data.sentPosts.length} sentPosts...`);
    await db.insert(schema.sentPosts).values(data.sentPosts).onDuplicateKeyUpdate({
      set: { tweetId: schema.sentPosts.tweetId }
    });
  }
  
  console.log('\n✅ Database imported successfully!');
}

const filename = process.argv[2];
importDatabase(filename).catch(console.error);
