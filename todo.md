# AI Twitter Monitor TODO

## 🚀 Migration to Vercel + Supabase + Cloudflare R2

- [ ] تبدیل MySQL به PostgreSQL (Drizzle schema)
- [ ] تبدیل Manus S3 به Cloudflare R2
- [ ] ساخت GitHub repository
- [ ] Push کد به GitHub
- [ ] Deploy در Vercel
- [ ] تنظیم Environment Variables در Vercel
- [ ] Migration دیتابیس از MySQL به PostgreSQL
- [ ] تست production deployment
- [ ] ساخت documentation برای کار با چند اکانت Manus

## ✅ Completed Features

### Core Features
- [x] Fetch tweets from Twitter/X API
- [x] Display tweets in dashboard
- [x] Bookmark tweets
- [x] Send tweets to Telegram
- [x] AI rewriting with OpenRouter
- [x] Settings page with configuration

### Scheduled Posts
- [x] Create scheduled posts
- [x] Edit scheduled posts
- [x] Delete scheduled posts
- [x] Toggle scheduled posts on/off
- [x] View scheduled posts list
- [x] View sent tweets history
- [x] Execute scheduled post manually (Execute Now button)
- [x] Automatic scheduler (runs every minute at :00)
- [x] Timezone support (Asia/Tehran)
- [x] Background job for automatic execution
- [x] Toast notifications for execution progress
- [x] Real-time countdown timer تا اجرای بعدی
- [x] نمایش "در حال اجرا..." هنگام execution
- [x] رفع خطای moment(...).tz is not a function
- [x] تست countdown timer در UI

### Scheduler Fixes
- [x] حذف منطق missed schedules (فقط در زمان دقیق اجرا می‌شود)
- [x] رفع مشکل تکرار ارسال پست‌ها در تلگرام
- [x] رفع getRecentSentTweetIds برای برگرداندن آرایه strings
- [x] scheduler فقط در زمان دقیق اجرا می‌شود
- [x] تست و تایید عدم اسپم

### Template & Placeholder
- [x] بررسی template در دیتابیس
- [x] بررسی کد buildTelegramMessage
- [x] رفع مشکل NULL values برای include options
- [x] اضافه کردن دکمه‌های placeholder به Settings

### Responsive & UI
- [x] رفع مشکل double padding در Settings
- [x] ریسپانسیو کردن Dashboard header
- [x] کوچک کردن دکمه‌ها (size="sm")
- [x] مخفی کردن text دکمه‌ها در موبایل
