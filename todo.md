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

## اضافه کردن Actor Run قبل از Scheduled Send
- [x] بررسی executeScheduledPost برای actor trigger
- [x] اضافه کردن actor run قبل از ارسال توییت‌ها
- [x] صبر تا actor تمام شود و توییت‌های جدید fetch شوند
- [x] تست و تایید اجرای actor در لاگ Apify
- [ ] تست ارسال توییت‌های جدید به تلگرام

## رفع مشکلات Scheduler
- [x] تغییر منطق: فقط از توییت‌های جدید actor استفاده کند (نه از دیتابیس)
- [x] رفع مشکل تعداد ارسال (باید دقیقاً postsPerRun باشد)
- [x] فیلدهای engagement (minLikes, minRetweets, minViews) قبلاً در scheduledPosts schema وجود دارد
- [x] فیلدهای content type (hasImages, hasVideos) قبلاً در scheduledPosts schema وجود دارد
- [x] UI فیلترهای پیشرفته جستجو قبلاً در ScheduledPostDialog وجود دارد
- [ ] تست و تایید: فقط توییت‌های جدید ارسال شوند
- [ ] تست و تایید: تعداد دقیق postsPerRun ارسال شود

## اضافه کردن پارامترهای پیشرفته جستجو به Schedule
- [x] پیدا کردن کامپوننت Advanced Search Parameters از Dashboard (AdvancedFetchDialog)
- [x] اضافه کردن به ScheduledPostDialog (جایگزین تب فیلترهای ساده)
- [x] اضافه کردن تمام فیلدهای پیشرفته به scheduledPosts schema
- [x] اجرای db:push برای اعمال تغییرات schema
- [x] به‌روزرسانی FetchFilters interface برای فیلدهای جدید
- [x] به‌روزرسانی fetchTweetsFromApify برای استفاده از فیلترهای جدید
- [x] به‌روزرسانی scheduler.ts برای ارسال تمام فیلترها به actor
- [ ] تست و تایید: فیلترهای پیشرفته در schedule کار کنند

## رفع مشکلات Scheduler - مرحله 2
- [x] رفع مشکل تعداد ارسال: slice(0, postsPerRun) بعد از contentMix
- [x] رعایت contentMix: جداسازی text/image/video و انتخاب بر اساس درصد
- [x] رفع نوع ارسال تلگرام: عکس با sendPhoto+caption، ویدیو با sendVideo، گروه با sendMediaGroup
- [x] تغییر ساعت پیشفرض scheduleTimes به getCurrentTime() (زمان فعلی)
- [ ] تست و تایید: تعداد دقیق + contentMix + نوع ارسال صحیح

## رفع مشکل Scheduler Execution
- [x] بررسی لاگ‌ها: خطا "No keywords configured in fetch settings"
- [x] مشکل: scheduler از fetchSettings می‌خواند به جای schedule.keywords
- [x] رفع: تغییر به schedule.keywords
- [ ] تست manual execution
- [ ] تست automatic execution در زمان مشخص

## گروه‌بندی تاریخچه ارسال و جلوگیری از تکرار
- [x] بررسی منطق preventDuplicates: getRecentSentTweetIds درست کار می‌کند
- [x] duplicateTimeWindow پیشفرض 24 ساعت است
- [x] preventDuplicates پیشفرض true است
- [x] اضافه کردن executionId به sent_posts schema
- [x] اضافه کردن executionId به recordSentPost interface
- [x] Generate executionId در scheduler
- [x] تغییر UI تاریخچه به گروه‌بندی براساس executionId (collapsible)
- [ ] تست: محتوای تکراری در 24 ساعت ارسال نشود
- [ ] تست: گروه‌بندی تاریخچه به درستی کار کند
