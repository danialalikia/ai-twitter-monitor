import { drizzle } from "drizzle-orm/mysql2";
import { readFileSync } from "fs";
import { settings, runs, tweets, bookmarks, users } from "./drizzle/schema.ts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function importBackup() {
  try {
    console.log("Reading backup file...");
    const backupData = JSON.parse(
      readFileSync("/home/ubuntu/backup_temp/database-backup.json", "utf-8")
    );

    console.log("Backup metadata:", backupData.metadata);
    console.log("\nImporting data...\n");

    // Import users
    if (backupData.tables.users && backupData.tables.users.length > 0) {
      console.log(`Importing ${backupData.tables.users.length} users...`);
      for (const user of backupData.tables.users) {
        await db.insert(users).values(user).onDuplicateKeyUpdate({ set: user });
      }
      console.log("✓ Users imported");
    }

    // Import settings
    if (backupData.tables.settings && backupData.tables.settings.length > 0) {
      console.log(`Importing ${backupData.tables.settings.length} settings...`);
      for (const setting of backupData.tables.settings) {
        await db.insert(settings).values(setting).onDuplicateKeyUpdate({ set: setting });
      }
      console.log("✓ Settings imported");
    }

    // Import runs
    if (backupData.tables.runs && backupData.tables.runs.length > 0) {
      console.log(`Importing ${backupData.tables.runs.length} runs...`);
      for (const run of backupData.tables.runs) {
        await db.insert(runs).values(run).onDuplicateKeyUpdate({ set: run });
      }
      console.log("✓ Runs imported");
    }

    // Import tweets in batches
    if (backupData.tables.tweets && backupData.tables.tweets.length > 0) {
      console.log(`Importing ${backupData.tables.tweets.length} tweets...`);
      const batchSize = 50;
      for (let i = 0; i < backupData.tables.tweets.length; i += batchSize) {
        const batch = backupData.tables.tweets.slice(i, i + batchSize);
        for (const tweet of batch) {
          await db.insert(tweets).values(tweet).onDuplicateKeyUpdate({ set: tweet });
        }
        console.log(`  Imported ${Math.min(i + batchSize, backupData.tables.tweets.length)}/${backupData.tables.tweets.length} tweets`);
      }
      console.log("✓ Tweets imported");
    }

    // Import bookmarks
    if (backupData.tables.bookmarks && backupData.tables.bookmarks.length > 0) {
      console.log(`Importing ${backupData.tables.bookmarks.length} bookmarks...`);
      for (const bookmark of backupData.tables.bookmarks) {
        await db.insert(bookmarks).values(bookmark).onDuplicateKeyUpdate({ set: bookmark });
      }
      console.log("✓ Bookmarks imported");
    }

    console.log("\n✅ Database import completed successfully!");
    console.log("\nSummary:");
    console.log(`  Users: ${backupData.tables.users?.length || 0}`);
    console.log(`  Settings: ${backupData.tables.settings?.length || 0}`);
    console.log(`  Runs: ${backupData.tables.runs?.length || 0}`);
    console.log(`  Tweets: ${backupData.tables.tweets?.length || 0}`);
    console.log(`  Bookmarks: ${backupData.tables.bookmarks?.length || 0}`);
  } catch (error) {
    console.error("Error importing backup:", error);
    process.exit(1);
  }
}

importBackup();
