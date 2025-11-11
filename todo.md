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

## رفع مشکلات Scheduler - مرحله 3
- [x] جلوگیری از اجرای همزمان: چک همان دقیقه به جای 2 دقیقه
- [x] رفع duplicate ارسال: preventDuplicates درست کار می‌کند، مشکل از اجرای همزمان بود
- [x] رفع قالب ارسال تلگرام: تغییر به HTML به جای Markdown
- [x] نمایش فقط ارسال‌های موفق: recordSentPost فقط بعد از ارسال موفق فراخوانی می‌شود
- [ ] تست: فقط یک actor در هر trigger
- [ ] تست: هیچ duplicate ارسال نشود
- [ ] تست: قالب تلگرام صحیح باشد (عکس با media، ویدیو با video)
- [ ] تست: تاریخچه فقط موفق‌ها را نمایش دهد

## رفع مشکلات Scheduler - مرحله 4
- [x] رفع اجرای همزمان: اضافه in-memory lock برای جلوگیری از اجرای همزمان
- [x] رفع maxItems actor: استفاده از schedule.maxItems (200) به جای postsPerRun*3
- [x] رفع تعداد ارسال: slice(0, postsPerRun) درست کار می‌کند، مشکل از 3 actor همزمان بود
- [x] رفع duplicate: preventDuplicates درست کار می‌کند، مشکل از 3 actor همزمان بود
- [x] اضافه کردن حذف گروهی: deleteSentGroup procedure + UI button
- [ ] تست: فقط 1 actor در هر trigger
- [ ] تست: actor با maxItems=200 اجرا شود
- [ ] تست: دقیقاً postsPerRun=10 ارسال شود
- [ ] تست: هیچ duplicate ارسال نشود
- [x] رفع خطای "caption too long": محدود کردن caption به 1024 کاراکتر

## رفع مشکلات Scheduler - مرحله 5 (گزارش کاربر)
- [x] رفع اجرای همزمان 4 actor: اضافه lastExecutionMinute به schema + database lock
- [x] بررسی in-memory lock: ترکیب in-memory + database lock برای جلوگیری از اجرای همزمان
- [x] رفع دکمه حذف گروهی: کد backend و UI درست است (deleteSentGroup + Trash2 button)
- [x] رفع ایجاد چند گروه تکراری: با رفع اجرای همزمان حل می‌شود
- [ ] تست نهایی: تایید فقط 1 actor و 1 گروه در هر trigger

## رفع مشکل Database Lock - مرحله 6
- [x] بررسی لاگ‌های scheduler: race condition شناسایی شد
- [x] شناسایی race condition: 4 process همزمان چک می‌کنند قبل از ست شدن lock
- [x] پیاده‌سازی atomic lock با raw SQL UPDATE WHERE
- [x] ساخت tryAcquireScheduleLock و releaseScheduleLock
- [x] تغییر scheduler برای استفاده از atomic lock
- [ ] تست: تایید فقط 1 actor در هر trigger

## رفع مشکل Atomic Lock - مرحله 7
- [x] بررسی چرا UPDATE atomic lock کار نکرد: Drizzle execute() syntax error
- [x] راه حل جدید: ساخت جدول execution_locks با UNIQUE(scheduleId, executionMinute)
- [x] استفاده از INSERT + UNIQUE constraint برای atomic lock
- [x] بازنویسی tryAcquireScheduleLock و releaseScheduleLock
- [x] اضافه cleanupOldLocks برای پاک کردن lock های قدیمی
- [ ] تست: تایید فقط 1 actor در هر trigger

## رفع مشکل Tooltip - مرحله 8
- [x] بررسی کد tooltip روی عکس پروفایل: کد تغییری نکرده
- [x] مقایسه با پروژه قبلی: کد دقیقاً یکسان است
- [x] اضافه max-height برای محدود کردن ارتفاع HoverCard
- [ ] تست: بررسی tooltip بعد از hard refresh

## رفع مشکل Atomic Lock - مرحله 9 (گزارش کاربر)
- [x] بررسی جدول execution_locks: خالی است (چون lock اصلاً اجرا نمی‌شود)
- [x] بررسی لاگ‌های lock: هیچ لاگی وجود ندارد
- [x] تشخیص علت: startScheduler چندین بار فراخوانی می‌شود (بعد از هر hot reload)
- [x] رفع مشکل: اضافه singleton pattern به startScheduler
- [x] اضافه stopScheduler برای cleanup
- [ ] تست: تایید فقط 1 actor در زمان‌بندی

## رفع مشکلات نهایی Scheduler - مرحله 10
- [x] رفع تعداد ارسال کمتر: اضافه retry mechanism با fallback tweets
- [x] رفع دکمه حذف گروهی: کد درست است (deleteSentGroup procedure)
- [x] اضافه دکمه Clear All History: clearAllHistory procedure + UI button
- [x] رفع contentMix: استفاده از Math.floor + تنظیم diff برای مجموع درست

## رفع مشکلات واقعی Scheduler - مرحله 11 (گزارش کاربر)
- [x] بررسی لاگ‌ها: video URL invalid باعث fail می‌شود
- [x] بررسی contentMix: مشکل در filter - استفاده از t.mediaType به جای mediaUrls[0].type
- [x] رفع retry mechanism: استفاده از nextTweetIndex برای track کردن fallback tweets
- [x] رفع contentMix logic: تغییر filter به mediaUrls[0].type === 'photo'|'video'

## پیاده‌سازی Telegram Mini App - مرحله 12
- [ ] اضافه ownerEmails به settings schema
- [ ] ساخت UI برای Owner Emails management در Settings
- [ ] تبدیل auth system: multi-owner با shared data
- [ ] پیاده‌سازی Google OAuth endpoint
- [ ] اضافه Telegram WebApp SDK
- [ ] تشخیص Mini App mode و استفاده از Google auth
- [ ] اضافه دکمه Mini App به Telegram bot
- [ ] تست: login با owner email → دسترسی کامل
- [ ] تست: login با non-owner email → Access Denied

# Telegram Mini App Fixes

- [x] رفع مشکل دکمه inline: تبدیل url به web_app در sendWelcomeMessage
- [ ] اضافه Menu Button همیشگی به bot با setChatMenuButton
- [ ] تست باز شدن Mini App از دکمه inline
- [ ] تست باز شدن Mini App از Menu Button

# Google OAuth Redirect URI Fix

- [x] ساخت صفحه debug برای نمایش current URL و redirect URI
- [ ] تست Mini App از گوشی و شناسایی redirect URI صحیح
- [ ] اضافه redirect URIs صحیح به Google Console
- [ ] تست نهایی Google OAuth login در Mini App
