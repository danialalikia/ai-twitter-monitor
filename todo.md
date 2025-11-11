# AI Twitter Monitor TODO

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

## 📝 Notes

### Scheduler Details
- Runs every minute at :00 seconds (synced)
- **Only executes at exact scheduled time** - no missed schedule execution
- Supports multiple timezones
- Filters tweets by distribution (viral/likes/retweets)
- Records sent tweets to prevent duplicates
- Prevents spam: checks if executed in last 2 minutes
- Countdown timer real-time که هر ثانیه به‌روز می‌شود
- اگر زمان schedule گذشته باشد، منتظر فردا می‌ماند

### Known Issues
- None! همه چیز کار می‌کند ✅

## 🎯 Future Enhancements

1. **Auto-refresh بعد از اجرا:** وقتی scheduler اجرا می‌شود، لیست scheduled posts و history خودکار refresh شود
2. **Progress indicator:** نوار پیشرفت برای نمایش درصد توییت‌های ارسال شده در هر اجرا
3. **Pause/Resume Schedule:** دکمه موقت متوقف کردن schedule
