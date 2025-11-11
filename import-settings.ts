import { drizzle } from "drizzle-orm/mysql2";
import { settings, runs, users } from "./drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function importSettings() {
  try {
    console.log("Importing initial settings and user...\n");

    // Create default user (owner)
    const ownerOpenId = process.env.OWNER_OPEN_ID || "default-owner";
    console.log("Creating owner user with openId:", ownerOpenId);
    
    await db.insert(users).values({
      openId: ownerOpenId,
      name: process.env.OWNER_NAME || "Owner",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({ 
      set: { 
        updatedAt: new Date(),
        lastSignedIn: new Date() 
      } 
    });
    console.log("✓ Owner user created/updated");

    // Import settings from backup
    const settingsData = {
      userId: 1,
      apifyToken: "apify_api_UJJ0s7PebXWAC6yzVfqY5yvOz4Ccgw2BSSLq",
      telegramBotToken: "230900519:AAHPy4i4kiCZun3B8biFQXpQsCiNeep5pTI",
      telegramChatId: "258935385",
      keywords: "Ai",
      scheduleTime: "08:00",
      timezone: "UTC",
      maxItemsPerRun: 1000,
      aiRewriteEnabled: 0,
      includeStats: 1,
      includeLink: 1,
      includeAuthor: 1,
      includeMedia: 1,
      includeDate: 0,
      createdAt: new Date("2025-11-02 18:18:15"),
      updatedAt: new Date("2025-11-02 18:40:27"),
    };

    await db.insert(settings).values(settingsData).onDuplicateKeyUpdate({ 
      set: settingsData 
    });
    console.log("✓ Settings imported");

    console.log("\n✅ Import completed successfully!");
    console.log("\nYou can now:");
    console.log("  1. Go to Settings page to update your Apify token");
    console.log("  2. Click 'Fetch Now' to start fetching tweets");
    console.log("  3. Configure Telegram bot if needed");
    
  } catch (error) {
    console.error("Error importing settings:", error);
    process.exit(1);
  }
}

importSettings();
