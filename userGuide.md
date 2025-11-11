# AI Twitter Monitor - User Guide

## Purpose

AI Twitter Monitor helps you track trending AI-related posts from Twitter/X. The app fetches tweets using the Apify actor, ranks them by engagement and relevance, and delivers daily reports via Telegram bot.

## Access

Login required. Single-user application with secure email authentication.

## Powered by Manus

This application leverages cutting-edge technologies for maximum performance and scalability. The frontend is built with **React 19**, **TypeScript**, and **Tailwind CSS 4** for a modern, responsive interface. The backend uses **Express 4** with **tRPC 11** for type-safe API communication, ensuring end-to-end type safety. Data is stored in **TiDB** (MySQL-compatible) via **Drizzle ORM**, providing robust relational database capabilities. Authentication is handled through **Manus OAuth** for secure, seamless login. The entire stack is deployed on **auto-scaling infrastructure with global CDN**, ensuring fast load times and high availability worldwide.

## Using Your Website

After signing in, you'll see the main dashboard with three stat cards showing **Top Viral**, **Media-rich**, and **Total Fetched** counts. To start monitoring tweets, click "Settings" in the top-right corner and enter your Apify token (get it from the Apify Console). Add comma-separated keywords like "AI,machine learning,GPT" and optionally configure Telegram bot credentials. Click "Save Settings" to store your configuration.

Return to the dashboard and click "Fetch Now" to trigger the Apify actor. The system fetches tweets matching your keywords from the last 24 hours, calculates trend scores, and categorizes them as Viral, High Engagement, Rising, or Media-rich. Results appear in the tweet feed below the stats cards, showing author handles, tweet text, engagement metrics (likes, retweets, views), and category badges.

Each tweet card has three action buttons. Click "View on X" to open the original tweet in a new tab. If the tweet has media, click "Download Media" to access images or videos. Click "Ignore" to add the tweet to your ignore list so it won't appear in future fetches. To send a formatted report to Telegram, click "Send Telegram Report" in the header (requires bot token and chat ID in settings).

## Managing Your Website

Use the **Settings** panel to update your Apify token, Telegram credentials, keywords, schedule time, timezone, and maximum items per run. The **Dashboard** shows real-time stats and the latest fetched tweets. All configuration changes are saved immediately when you click "Save Settings".

## Next Steps

Talk to Manus AI anytime to request changes or add features. Start by configuring your Apify token in Settings, then click "Fetch Now" to see trending AI posts. Set up Telegram integration to receive automated daily reports directly in your messaging app.

### Production Readiness

Before going live, update these test credentials in Settings → Secrets:

- **Apify**: Update `APIFY_TOKEN` with your production API key
- **Telegram**: Update `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` with your production bot credentials

Get production keys from the Apify Console and Telegram BotFather before deploying to production.
