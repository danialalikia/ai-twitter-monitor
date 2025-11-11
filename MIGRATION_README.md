# بسته انتقال AI Twitter Monitor

این بسته شامل تمام فایل‌ها و اسکریپت‌های لازم برای انتقال کامل پروژه به اکانت Manus جدید است.

## محتویات بسته

### 📄 فایل‌های اصلی

1. **MIGRATION_GUIDE.md** - راهنمای کامل و جامع انتقال (فارسی)
2. **export-database.mjs** - اسکریپت export دیتابیس
3. **import-database.mjs** - اسکریپت import دیتابیس
4. **database-backup-*.json** - فایل backup دیتابیس فعلی

### 📊 خلاصه دیتابیس فعلی

```
Users: 3
Settings: 1
Fetch Settings: 1
Tweets: 149
Bookmarks: 0
Saved Tweets: 0
Scheduled Posts: 1
Runs: 1
Ignored Tweets: 0
Sent Posts: 10
```

**حجم فایل backup:** 309 KB

## روش‌های انتقال

### روش ۱: استفاده از Checkpoint (پیشنهادی ⭐)

**مزایا:** سریع، آسان، کم‌خطا

**مراحل:**
1. در اکانت قدیم، یک checkpoint نهایی بسازید
2. version ID را یادداشت کنید
3. در اکانت جدید، پروژه را از checkpoint import کنید
4. دیتابیس را با `import-database.mjs` import کنید
5. تنظیمات را بررسی کنید

### روش ۲: Export و Import دستی

**مزایا:** کنترل کامل، مستقل از پلتفرم

**مراحل:**
1. تمام کدها را از Management UI دانلود کنید
2. دیتابیس را با `export-database.mjs` export کنید
3. در اکانت جدید، پروژه خالی بسازید
4. کدها را آپلود کنید
5. دیتابیس را با `import-database.mjs` import کنید

## دستورات سریع

### Export دیتابیس

```bash
cd /path/to/project
npx tsx export-database.mjs
```

خروجی: `database-backup-YYYY-MM-DDTHH-MM-SS-MMMZ.json`

### Import دیتابیس

```bash
cd /path/to/new-project
npx tsx import-database.mjs database-backup-*.json
```

## تنظیمات مهم که باید بررسی شوند

بعد از انتقال، این تنظیمات را حتماً بررسی کنید:

### ✅ API Tokens & Keys

- [ ] Apify Token
- [ ] Telegram Bot Token
- [ ] Telegram Chat ID
- [ ] OpenRouter API Key

### ✅ AI Settings

- [ ] AI Model (`openai/gpt-4o`)
- [ ] AI Rewrite Prompt
- [ ] Temperature (0.7)
- [ ] Max Tokens (500)
- [ ] Top P (0.9)

### ✅ Telegram Settings

- [ ] Telegram Template
- [ ] Include Stats
- [ ] Include Link
- [ ] Include Author
- [ ] Include Media
- [ ] Include Date

### ✅ Fetch Settings

- [ ] Keywords
- [ ] Schedule Time
- [ ] Timezone
- [ ] Max Items Per Run

### ✅ Telegram Bot Setup

- [ ] Webhook تنظیم شده (کلیک روی "Setup Telegram Mini App")
- [ ] ربات پاسخ می‌دهد

## تست بعد از انتقال

### 1. تست دیتابیس

```sql
SELECT COUNT(*) FROM users;      -- باید 3 باشد
SELECT COUNT(*) FROM tweets;     -- باید 149 باشد
SELECT COUNT(*) FROM settings;   -- باید 1 باشد
```

### 2. تست Dashboard

- [ ] صفحه اصلی بدون خطا باز می‌شود
- [ ] توییت‌ها نمایش داده می‌شوند
- [ ] Settings قابل ویرایش است

### 3. تست Fetch

- [ ] "Fetch Now" کار می‌کند
- [ ] توییت‌های جدید fetch می‌شوند

### 4. تست Telegram Bot

- [ ] `/start` پاسخ می‌دهد
- [ ] لینک Twitter را پردازش می‌کند
- [ ] توییت را rewrite می‌کند
- [ ] Media را ارسال می‌کند

## مشکلات رایج

### مشکل: دیتابیس import نمی‌شود

**راه‌حل:**
```bash
# بررسی فرمت فایل
head -n 10 database-backup-*.json

# import به صورت دستی
npx tsx import-database.mjs database-backup-*.json
```

### مشکل: Telegram bot پاسخ نمی‌دهد

**راه‌حل:**
1. به Settings بروید
2. "Setup Telegram Mini App" را کلیک کنید
3. Bot Token را بررسی کنید

### مشکل: Settings خالی است

**راه‌حل:**
1. فایل backup را باز کنید
2. بخش `settings` را پیدا کنید
3. مقادیر را به صورت دستی وارد کنید

## پشتیبانی

اگر به مشکل برخوردید:

- **داکیومنت کامل:** `MIGRATION_GUIDE.md`
- **پشتیبانی Manus:** https://help.manus.im
- **Community:** https://community.manus.im

## نکات امنیتی ⚠️

- فایل backup حاوی اطلاعات حساس است
- بعد از import، فایل backup را حذف کنید
- API keys را در جای امن نگه دارید
- هرگز فایل backup را public نکنید

---

**آخرین بروزرسانی:** 11 نوامبر 2025  
**نسخه:** 1.0
