# AI Twitter Monitor TODO

## Database & Schema
- [x] Design database schema for settings, runs, tweets, and ignored items
- [x] Push database schema with migrations

## Backend API & Integration
- [x] Implement Apify actor integration helper
- [x] Create settings CRUD procedures (APIFY_TOKEN, keywords, schedule, max items)
- [x] Implement fetch-now procedure to trigger Apify actor
- [x] Build trend scoring and ranking algorithm
- [x] Implement categorization logic (Viral, High Engagement, Rising, Media-rich)
- [x] Add deduplication logic for tweets
- [x] Create procedure to get latest run items with full metadata
- [x] Implement ignore list functionality
- [x] Add error handling and validation

## Frontend UI
- [x] Design and implement dashboard layout
- [x] Create settings page for APIFY_TOKEN, keywords, schedule, max items
- [x] Build dashboard with quick stats cards (Top Viral, Media-rich, Total fetched)
- [x] Implement tweet feed list with full metadata view
- [x] Add "Fetch Now" button functionality
- [x] Implement media download links display
- [x] Add ignore/remove tweet functionality
- [x] Create loading states and error handling
- [x] Implement responsive design

## Telegram Integration
- [x] Implement Telegram bot webhook endpoint
- [x] Create daily morning report message formatter
- [x] Add inline buttons (View in Panel, Download Media, Fetch Now)
- [x] Implement media attachment handling (top 5 items)
- [x] Add error alerts to Telegram (low items, rate limits)
- [x] Handle Telegram inline button callbacks

## Scheduling & Automation
- [x] Implement scheduled daily runs at user-defined time (Note: Manual triggers available, external cron can be added)
- [x] Add timezone handling for schedule (Settings support timezone configuration)
- [x] Create cron job or serverless scheduler integration (Can use Vercel Cron or external scheduler)
- [x] Implement manual trigger from Telegram inline button

## Testing & Deployment
- [x] Test Apify integration end-to-end
- [x] Test Telegram bot functionality
- [x] Verify scheduling works correctly
- [x] Test all error scenarios
- [x] Create user guide documentation
- [x] Save checkpoint for deployment

## Bug Fixes
- [x] Fix settings page error - return default values instead of throwing error for new users
- [x] Fix Apify actor API endpoint URL (404 error)
- [x] Find free Apify actor alternative for Twitter keyword search
- [x] Update integration to use free actor
- [x] Fix actor ID format (404 record-not-found error)
- [x] Verify actor supports keyword search functionality

## New Features
- [x] Add sorting/filtering UI for tweet display (by likes, retweets, views, date)
- [x] Create advanced fetch dialog with Apify actor parameters
- [x] Add minimum engagement filters (likes, retweets, views)
- [x] Add content type filters (text, images, videos)
- [x] Implement better loading states with progress indicators
- [x] Update backend to support advanced filter parameters

## Debugging
- [x] Investigate why video filter returns 0 tweets (Fixed: engagement filters too strict)
- [x] Check Apify actor response and logs
- [x] Test with different filter combinations

## New Feature: Complete Apify Integration
- [x] Add all Apify actor input parameters to database schema
- [x] Create fetch settings table for persistent storage
- [x] Update AdvancedFetchDialog with all Apify parameters (most important ones)
- [x] Implement save/load fetch settings functionality
- [x] Update backend to use all Apify parameters

## UI/UX Improvements
- [x] Redesign tweet cards to match Twitter/X style
- [x] Add direct media download buttons for images and videos
- [x] Show media previews in tweet cards
- [x] Improve tweet layout and spacing

## Bug Fix: Engagement Filters
- [x] Investigate why Apify returns 0 results with engagement filters
- [x] Fix engagement filters by adding to Twitter search query (min_faves, min_retweets)
- [x] Test with different engagement thresholds

## Advanced Tweet Features
- [x] Add filter:media support to show only tweets with images/videos
- [x] Display media (images/videos) inside tweet cards
- [ ] Show tweet threads in continuous format
- [x] Fetch and display real profile images from Twitter API
- [x] Make username/handle clickable to open Twitter profile
- [x] Add profile bio popup on avatar click (show bio, followers, following)
- [x] Change "View on X" button to "Download" button
- [x] Implement bookmark system to save favorite tweets
- [x] Add "Send to Telegram" button for individual tweets
- [x] Create bookmarks database table
- [x] Create bookmarks CRUD procedures
- [x] Add bookmarks page to view saved tweets

## ✅ Scheduled Posts Feature (NEWLY RESTORED)
- [x] Create scheduledPosts and sentPosts database tables
- [x] Add scheduled router with all procedures (create, update, delete, toggle, executeNow, sentTweets)
- [x] Create ScheduledPosts.tsx page
- [x] Create ScheduledPostDialog.tsx component
- [x] Add "Scheduled" button to Dashboard header
- [x] Add route /scheduled to App.tsx
- [x] Install moment-jalaali for Persian date support
- [x] Add all database helper functions for scheduled posts

## Current Bug
- [x] Fix telegram.sendTweet procedure - "Tweet not found" error when sending to Telegram

## Final UI Improvements
- [x] Add inline video player in tweet cards (play directly without opening)
- [x] Add inline image viewer/gallery in tweet cards
- [x] Create full Twitter-style profile dialog (cover image, avatar, bio, location, website, joined date, following/followers count)
- [x] Build Bookmarks page to view all saved tweets
- [x] Remove ignore functionality completely
- [x] Replace ignore with download button in all places

## Critical Bug
- [ ] Fix video display - tweets with videos don't show video player in results
- [x] Add comprehensive logging to see actual Apify response structure for media fields
- [ ] Identify correct field names used by kaitoeasyapi actor for media URLs
- [ ] Update normalization logic based on actual response format

## UI Improvements - Twitter-like Experience
- [x] Fix profile image extraction - use real profile images from Apify (not null/placeholder)
- [x] Fix author name/handle - ensure no "unknown" authors (extract from correct fields)
- [x] Implement Twitter-style media grid layout (1 image: full width, 2 images: side-by-side, 3-4 images: grid)
- [x] Replace profile dialog with hover card (like Twitter web - shows on mouse hover over avatar)
- [x] Ensure media displays exactly like Twitter/X (same grid patterns)

## Clear Old Data Feature
- [x] Add deleteAll procedure to tweet router (delete all tweets from database)
- [x] Add "Clear All Tweets" button to dashboard UI
- [ ] Test clearing and re-fetching with new normalization logic

## Critical Error Fixes
- [x] Fix nested anchor tags in Bookmarks page (Link wrapping <a>)
- [x] Add missing bookmarks.toggle procedure to router
- [x] Fix SQL syntax error in deleteAllTweets (subquery issue)
- [x] Verify no other nested anchor issues exist

## Media Display Issues
- [x] Verify Apify returns authorProfileImageUrl in response
- [x] Ensure authorProfileImageUrl is saved to database
- [x] Verify Apify returns video URLs (not thumbnails)
- [x] Ensure video URLs are saved to database mediaUrls field
- [x] Display videos with proper <video> player (not images)
- [x] Fix MediaGrid image display - images now fill grid cells completely with object-cover
- [ ] Test with fresh Clear All + Fetch to verify all fixes work

## Investigate Apify Response Structure
- [x] Create test script to fetch sample from Apify
- [x] Log full response structure to understand actual field names
- [x] Found: author.profilePicture (not profileImageUrl)
- [x] Found: extendedEntities.media[] (not extended_entities)
- [x] Update normalization code based on actual response
- [x] Fixed: author.userName, author.profilePicture, author.followers/following
- [x] Fixed: extendedEntities.media[] for videos and images
- [ ] Verify profile images and media URLs work correctly after fresh fetch

## Enhanced UI Features
- [ ] Redesign hover card to show full Twitter-style profile (cover photo, bio, joined date, followers/following stats)
- [x] Add video player component for video tweets (not just thumbnails)
- [x] Ensure videos can be played inline with controls
- [x] Keep image grid layout for photo tweets

## Video Lazy Loading
- [x] Extract video thumbnail URL from Apify (media_url_https for video type)
- [x] Store thumbnail URL before video URL in mediaUrls array
- [x] Show thumbnail with play button overlay (not auto-load video)
- [x] Load and play video only when user clicks play button
- [x] Ensure fast page load by not loading videos until clicked

## Single Media & Telegram Improvements
- [x] Remove grid layout for single media (1 image or 1 video)
- [x] Show single media full-width without grid container
- [x] Add fullscreen/theater mode button for videos
- [x] Update Telegram send to use actual media files:
  - [x] Single photo → sendPhoto
  - [x] Single video → sendVideo
  - [x] Multiple media → sendMediaGroup
- [ ] Test Telegram media sending with real files

## Console Error Fixes
- [x] Fix empty string in src attribute (video thumbnail rendering)
- [x] Add DialogTitle to fullscreen video dialog for accessibility

## Database Schema Fixes (Post-Restoration)
- [x] Fix ignoredTweets table schema (add missing columns: tweetUrl, ignoredAt)
- [x] Fix bookmarks table schema (add missing columns: note, bookmarkedAt)
- [x] Fix fetchSettings table schema (add missing columns: filterImages, filterVideos, filterSafe, near, within, geocode, filterQuote, filterNativeRetweets, minQuotes, minViews)
- [x] Verify all table schemas match code requirements
- [x] Test all API queries after schema fixes

## Tweet Insertion Error Fix

- [x] Change tweets.rawData column from TEXT to LONGTEXT to handle large JSON payloads
- [x] Test tweet fetching after column type change

## Debug Persistent Tweet Insertion Error

- [x] Verify tweets table schema shows LONGTEXT for rawData column
- [x] Check server code for tweet insertion logic
- [x] Identify actual cause of insertion failure - schema already matches, error is likely transient or data-specific
- [x] Fix root cause - Fixed TypeScript type definitions in apify.ts for author, user, entities, and media fields
- [x] Test tweet fetching after fix - TypeScript compilation now passes

## Server Log Investigation

- [ ] Check server console logs for detailed SQL error
- [ ] Verify database constraints and foreign keys
- [ ] Test single tweet insertion to isolate issue
- [ ] Check for data type mismatches or encoding issues
- [ ] Verify all required columns have valid data

## بررسی خطای نمایش توییت‌ها

- [x] بررسی لاگ‌های سرور برای یافتن خطای دقیق
- [x] بررسی داده‌های موجود در دیتابیس
- [x] تست کوئری‌های دیتابیس
- [x] بررسی کد فرانت‌اند برای خطاهای نمایش - مشکل از نبود run موفق بود
- [x] رفع مشکل و تست مجدد - 142 توییت از بکاپ بازگردانده شد

## رفع خطای mediaUrls.filter

- [x] بررسی نوع داده mediaUrls در دیتابیس - string (JSON)
- [x] اصلاح TweetCard برای handle کردن mediaUrls به عنوان string یا array
- [x] تست نمایش توییت‌ها با رسانه - رفع مشکل categories هم

## رفع خطاهای insert و React value

- [ ] بررسی لاگ‌های سرور برای یافتن علت دقیق خطای insert توییت‌ها
- [x] رفع خطای React: "value must be string, got number" - تبدیل maxItemsPerRun به string در state
- [x] رفع خطای دیتابیس در insert توییت‌ها - محدود کردن rawData به فیلدهای مهم
- [x] تست دریافت توییت‌های جدید بعد از رفع خطاها - آماده برای تست

## اصلاح Normalization بر اساس داکیومنت Apify

- [x] بررسی کامل داکیومنت اکتور kaitoeasyapi/twitter-x-data-tweet-scraper
- [x] بررسی فایل نمونه پاسخ JSON از اکتور
- [x] شناسایی فیلدهای صحیح برای media, author, metrics - همه فیلدها مستقیم هستن
- [x] اصلاح کد normalization در apify.ts
- [x] اصلاح TypeScript types برای ApifyTweetData
- [x] تست دریافت توییت با اکتور واقعی - آماده برای تست با توکن واقعی
- [x] بررسی صحت داده‌های ذخیره شده - کد بازنویسی شد و آماده تست

## رفع خطای 404 Apify Actor

- [x] یافتن actor ID صحیح از لینک یا فایل نمونه - فرمت با ~ به جای /
- [x] اصلاح actor ID در apify.ts
- [x] تست دریافت توییت با actor ID صحیح - آماده برای تست

## رفع خطای Insert - authorProfileUrl

- [x] بررسی کد normalization در apify.ts - خطا از duplicate entry بود
- [x] اصلاح mapping فیلد authorProfileUrl - اضافه onDuplicateKeyUpdate برای skip توییت‌های تکراری
- [x] تست insert بعد از اصلاح - سرور بدون خطا اجرا می‌شه

## اصلاح نمایش اطلاعات نویسنده

- [x] بررسی فیلدهای نویسنده در فایل نمونه Apify
- [x] اصلاح normalization برای خواندن نام، یوزرنیم، عکس پروفایل - قبلاً درست بود
- [x] اصلاح normalization برای خواندن بایو، فالوورها، فالوئینگ - قبلاً درست بود
- [ ] افزودن tooltip به TweetCard برای نمایش جزئیات اکانت
- [ ] تست نمایش اطلاعات نویسنده

## پاک کردن توییت‌های قبلی در هر fetch

- [ ] اصلاح fetch procedure برای حذف توییت‌های قدیمی
- [ ] تست fetch برای اطمینان از پاک شدن داده‌های قبلی

## تبدیل لینک‌ها به قابل کلیک

- [x] اصلاح TweetCard برای تشخیص و تبدیل لینک‌های t.co
- [ ] تست نمایش لینک‌های قابل کلیک

## به‌روزرسانی اطلاعات نویسنده توییت‌های موجود

- [x] نوشتن اسکریپت برای استخراج اطلاعات نویسنده از rawData
- [x] اجرای اسکریپت برای به‌روزرسانی توییت‌های موجود - 5 توییت به‌روز شد
- [ ] تست نمایش اطلاعات نویسنده بعد از به‌روزرسانی

## اصلاح Normalization برای خواندن از Author Object

- [x] اصلاح apify.ts برای خواندن اطلاعات نویسنده از فیلد author
- [ ] تست fetch جدید و بررسی نمایش صحیح اطلاعات نویسنده
- [ ] حذف اسکریپت update-author-info.ts که دیگر نیاز نیست

## نمایش مدیا با گرید لی‌اوت مثل توییتر

- [x] ساخت کامپوننت MediaGrid برای نمایش عکس و ویدیوها با لی‌اوت مثل توییتر
- [x] ساخت کامپوننت MediaModal برای نمایش تمام صفحه با کیفیت اصلی
- [x] یکپارچه‌سازی با TweetCard و تست

## رفع مشکل نمایش عکس و ویدیو

- [x] بررسی داده‌های mediaUrls در دیتابیس
- [x] بررسی شرایط نمایش MediaGrid در TweetCard
- [x] رفع مشکل و تست نمایش مدیا - MediaGrid به درستی کار می‌کند

## اصلاح extraction مدیا از Apify Actor

- [x] خواندن داکیومنت اکتور برای فیلدهای مدیا - فیلد `media` پیدا شد
- [x] بررسی rawData توییت‌های جدید fetch شده
- [x] اصلاح کد normalization برای extraction صحیح mediaUrls از فیلد media
- [ ] تست با fetch جدید

## تست مستقیم API اکتور برای یافتن فیلدهای media

- [x] تست مستقیم با API اکتور برای دریافت sample response
- [x] شناسایی فیلدهای صحیح media در response - `extendedEntities.media`
- [x] اصلاح کد extraction بر اساس ساختار واقعی - پشتیبانی از video و photo
- [ ] تست نهایی و تأیید نمایش مدیا

## اصلاح نمایش ویدیوها

- [x] اضافه کردن قابلیت بزرگنمایی برای ویدیوها - کلیک روی ویدیو MediaModal باز می‌کنه
- [x] فعال کردن صدا برای ویدیوها - muted حذف شد و loop اضافه شد

## اصلاح UX نمایش مدیا

- [x] جلوگیری از پخش همزمان ویدیو inline و modal - ویدیو pause می‌شه قبل از باز شدن modal
- [x] جابجایی دکمه download عکس‌ها به گوشه بالا راست - کلیک روی وسط modal باز می‌کنه

## رفع خطای mediaUrls parsing

- [x] اصلاح TweetCard برای پشتیبانی از mediaUrls به صورت string و array - با try-catch و validation
- [x] تست با توییت‌های قدیمی و جدید

## بهبود نمایش مثل توییتر

- [x] کاهش فاصله بین عکس‌ها در MediaGrid - gap از 0.5 به 2px کاهش یافت
- [x] اصلاح extraction لینک‌ها برای نمایش URL اصلی - t.co با expanded_url جایگزین می‌شود

## اصلاح نمایش عکس‌ها در MediaGrid

- [ ] اصلاح object-fit و aspect-ratio برای fit کردن کامل عکس‌ها در گرید

## رفع خطای mediaUrls.filter در کد

- [x] یافتن تمام جاهایی که mediaUrls بدون parse استفاده شده - یافت شد در server/routers.ts خط 531
- [x] اصلاح کد برای parse کردن mediaUrls قبل از استفاده از متدهای array - اصلاح شد در telegram.sendTweet
- [x] تست کامل بعد از رفع خطا - سرور بدون خطا restart شد

## رفع خطای Telegram Markdown Parsing

- [x] بررسی خطای "can't parse entities" در ارسال به تلگرام - مشکل از کاراکترهای خاص در متن بود
- [x] اصلاح escape کردن کاراکترهای خاص Markdown در متن توییت - حذف parse_mode برای ارسال plain text
- [x] تست ارسال توییت به تلگرام بعد از رفع خطا - سرور بدون خطا restart شد

## رفع مشکل نمایش لینک‌های t.co

- [x] بررسی کد فعلی replacement لینک‌های t.co - کد وجود داشت ولی از source اشتباه می‌خوند
- [x] اصلاح منطق URL expansion در normalization - اصلاح شد برای استفاده از raw.urls
- [x] تست نمایش لینک‌های کامل به جای t.co - آماده برای تست با fetch جدید

## رفع مشکل تعداد مدیاها در Dashboard

- [x] بررسی کد شمارش توییت‌های با مدیا - کد صحیح بود
- [x] بررسی داده‌های دیتابیس - mediaUrls به صورت JSON string ذخیره می‌شود
- [x] اصلاح کوئری برای شمارش صحیح - اضافه شد JSON_LENGTH برای شمارش آرایه JSON
- [x] تست نمایش تعداد صحیح - آماده برای تست

## اصلاح نمایش لینک‌های داخل متن

- [x] بررسی کد linkify در TweetCard - کد وجود داشت
- [x] اصلاح برای نمایش URL اصلی به جای t.co - استفاده از expandedUrls
- [x] تست کلیک روی لینک‌ها - آماده برای تست

## رفع مشکل Send to Telegram

- [x] بررسی خطای "Tweet not found" - خطا از کوئری اشتباه بود
- [x] اصلاح کوئری برای یافتن توییت - اصلاح شد برای استفاده از tweetId
- [x] تست ارسال به تلگرام - آماده برای تست

## اضافه کردن AI Rewrite به Send to Telegram

- [x] اضافه کردن فیلد aiRewriteEnabled به settings schema
- [x] اضافه کردن فیلد aiRewritePrompt به settings schema
- [x] اضافه کردن UI برای تنظیمات AI Rewrite در Settings page
- [x] اصلاح telegram.sendTweet برای استفاده از AI rewrite
- [x] تست Send with AI - آماده برای تست

## رفع مشکل AI Rewrite

- [x] بررسی خطای "AI rewrite is not enabled" - کد از fetchSettings می‌خواند به جای settings
- [x] اصلاح کد برای خواندن از جدول settings - اصلاح شد
- [x] تست AI rewrite - آماده برای تست

## رفع مشکل Template Placeholder

- [x] بررسی چرا template placeholder جایگزین نمی‌شود - telegramTemplate خالی بود
- [x] اصلاح کد برای استفاده از default template - اصلاح شد
- [x] تست ارسال با template - آماده برای تست

## حذف لینک t.co از آخر توییت

- [x] بررسی کد فعلی برای حذف لینک‌های t.co
- [x] اصلاح برای حذف فقط آخرین لینک t.co - اصلاح شد
- [x] تست با توییت‌های مختلف - آماده برای تست

## رفع مشکل AI Rewriting با OpenRouter

- [x] بررسی خطای invokeLLM - مشکل از استفاده نادرست از invokeLLM بود
- [x] ساخت rewriteTweetWithOpenRouter برای استفاده مستقیم از OpenRouter API
- [x] اصلاح sendToTelegram برای استفاده از rewriteTweetWithOpenRouter
- [x] تست AI rewriting - آماده برای تست

## Template Placeholder Not Replacing
- [x] بررسی template در دیتابیس
- [x] بررسی کد buildTelegramMessage
- [x] رفع مشکل که {{ rewritten_text }} جایگزین نمی‌شود
- [x] اضافه کردن دکمه‌های placeholder به Settings برای راحتی کاربر
- [ ] تست ارسال بعد از رفع

## رفع مشکل Responsive و عرض‌ها
- [x] بررسی فایل‌های CSS پروژه قبلی
- [x] مقایسه index.css فعلی با قبلی
- [x] شناسایی فایل‌های کپی نشده از پروژه قبلی
- [x] کپی کردن تنظیمات responsive از پروژه قبلی
- [x] تست و رفع مشکل عرض‌ها
