import { drizzle } from 'drizzle-orm/mysql2';
import fs from 'fs';
import * as schema from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);

async function extractSettings() {
  const settings = await db.select().from(schema.settings).limit(1);
  
  if (settings.length === 0) {
    console.error('No settings found');
    process.exit(1);
  }
  
  const s = settings[0];
  
  // Remove sensitive fields that should not be shared
  const exportSettings = {
    // API Tokens (user should fill these manually for security)
    apifyToken: "REPLACE_WITH_YOUR_APIFY_TOKEN",
    telegramBotToken: "REPLACE_WITH_YOUR_TELEGRAM_BOT_TOKEN",
    telegramChatId: s.telegramChatId || "REPLACE_WITH_YOUR_TELEGRAM_CHAT_ID",
    telegramOwnerId: s.telegramOwnerId || "REPLACE_WITH_YOUR_TELEGRAM_OWNER_ID",
    openRouterApiKey: "REPLACE_WITH_YOUR_OPENROUTER_API_KEY",
    
    // AI Settings (safe to share)
    aiModel: s.aiModel || "openai/gpt-4o",
    aiRewritePrompt: s.aiRewritePrompt || "",
    temperature: s.temperature || "0.7",
    maxTokens: s.maxTokens || 500,
    topP: s.topP || "0.9",
    
    // Telegram Template (safe to share)
    telegramTemplate: s.telegramTemplate || "",
    
    // Display Settings (safe to share)
    includeStats: s.includeStats !== undefined ? Boolean(s.includeStats) : true,
    includeLink: s.includeLink !== undefined ? Boolean(s.includeLink) : true,
    includeAuthor: s.includeAuthor !== undefined ? Boolean(s.includeAuthor) : true,
    includeMedia: s.includeMedia !== undefined ? Boolean(s.includeMedia) : true,
    includeDate: s.includeDate !== undefined ? Boolean(s.includeDate) : false,
    
    // Fetch Settings
    keywords: s.keywords || "AI,artificial intelligence,machine learning,deep learning,LLM,GPT",
    scheduleTime: s.scheduleTime || "08:00",
    timezone: s.timezone || "UTC",
    maxItemsPerRun: s.maxItemsPerRun || 200,
    
    // Owner Emails (safe to share)
    ownerEmails: s.ownerEmails || "",
  };
  
  fs.writeFileSync('settings-template.json', JSON.stringify(exportSettings, null, 2));
  console.log('✅ Settings template created: settings-template.json');
  console.log('\n⚠️  Remember to replace all API tokens with your actual values!');
}

extractSettings().catch(console.error);
