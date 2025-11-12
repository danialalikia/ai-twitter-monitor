# 🚀 راهنمای Deploy به Railway با GitHub Actions

این راهنما مراحل کامل deploy پروژه AI Twitter Monitor به Railway را با استفاده از GitHub Actions توضیح می‌دهد.

---

## 📋 پیش‌نیازها

قبل از شروع، مطمئن شوید این موارد را دارید:

- ✅ اکانت Railway: https://railway.app
- ✅ اکانت GitHub: https://github.com
- ✅ Railway Token: `107a4168-fca3-47e3-a967-520955d64164`
- ✅ GitHub Repository: `danialalikia/ai-twitter-monitor`

---

## 🔧 مرحله ۱: ساخت پروژه در Railway

### 1.1. ورود به Railway
1. برو به https://railway.app
2. با اکانت خودت login کن

### 1.2. ساخت پروژه جدید
1. کلیک روی **"New Project"**
2. انتخاب **"Empty Project"**
3. نام پروژه: `ai-twitter-monitor`

### 1.3. اضافه کردن MySQL Database
1. در پروژه، کلیک روی **"+ New"**
2. انتخاب **"Database"**
3. انتخاب **"Add MySQL"**
4. صبر کن تا database ساخته بشه (1-2 دقیقه)

### 1.4. گرفتن Project ID
1. در صفحه پروژه، برو به **Settings**
2. در بخش **"Project ID"** کپی کن
3. مثال: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## 🔐 مرحله ۲: تنظیم GitHub Secrets

### 2.1. رفتن به GitHub Repository Settings
1. برو به: https://github.com/danialalikia/ai-twitter-monitor
2. کلیک روی **"Settings"** (تب بالا)
3. از منوی چپ، **"Secrets and variables"** → **"Actions"**

### 2.2. اضافه کردن Secrets

کلیک روی **"New repository secret"** و این secrets رو اضافه کن:

#### Secret 1: RAILWAY_TOKEN
```
Name: RAILWAY_TOKEN
Value: 107a4168-fca3-47e3-a967-520955d64164
```

#### Secret 2: RAILWAY_PROJECT_ID
```
Name: RAILWAY_PROJECT_ID
Value: [Project ID که از Railway گرفتی]
```

#### Secret 3: DATABASE_URL
```
Name: DATABASE_URL
Value: [از Railway MySQL service بگیر]
```

**نحوه گرفتن DATABASE_URL:**
1. در Railway، روی MySQL service کلیک کن
2. برو به تب **"Variables"**
3. `DATABASE_URL` رو کپی کن
4. فرمت: `mysql://user:pass@host:port/dbname`

#### Secret 4: APIFY_TOKEN
```
Name: APIFY_TOKEN
Value: [Apify API token تو]
```

#### Secret 5: TELEGRAM_BOT_TOKEN
```
Name: TELEGRAM_BOT_TOKEN
Value: [Telegram bot token تو]
```

#### Secret 6: TELEGRAM_CHAT_ID
```
Name: TELEGRAM_CHAT_ID
Value: [Telegram chat ID تو]
```

#### Secret 7: OPENROUTER_API_KEY
```
Name: OPENROUTER_API_KEY
Value: [OpenRouter API key تو]
```

#### Secret 8: JWT_SECRET
```
Name: JWT_SECRET
Value: [یک string رندوم 32+ کاراکتری]
```

**تولید JWT_SECRET:**
```bash
# در terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 مرحله ۳: Push کردن کد به GitHub

### 3.1. بررسی فایل workflow
فایل `.github/workflows/railway-deploy.yml` باید در repository باشه.

### 3.2. Push کردن تغییرات
```bash
cd /home/ubuntu/ai-twitter-monitor-new
git add .
git commit -m "Add Railway deployment workflow"
git push origin main
```

---

## 🚀 مرحله ۴: اجرای Deployment

### 4.1. روش خودکار (با Push)
- هر بار که به branch `main` push می‌کنی، خودکار deploy می‌شه

### 4.2. روش دستی (Manual Trigger)
1. برو به GitHub repository
2. کلیک روی تب **"Actions"**
3. از لیست workflows، **"Deploy to Railway"** رو انتخاب کن
4. کلیک روی **"Run workflow"**
5. انتخاب branch: `main`
6. کلیک روی **"Run workflow"** (دکمه سبز)

### 4.3. مشاهده Progress
1. در تب Actions، روی workflow run کلیک کن
2. مشاهده logs و progress
3. صبر کن تا تمام steps موفق بشن (✅)

---

## 🌐 مرحله ۵: تنظیم Domain

### 5.1. Generate کردن Domain
1. در Railway، روی service اصلی کلیک کن
2. برو به تب **"Settings"**
3. در بخش **"Networking"**، کلیک روی **"Generate Domain"**
4. یک domain مثل `ai-twitter-monitor-production.up.railway.app` می‌گیری

### 5.2. تست Domain
1. URL رو در browser باز کن
2. باید صفحه اصلی نمایش داده بشه

---

## 💾 مرحله ۶: Import کردن Database

### 6.1. آماده‌سازی فایل backup
فایل `database-backup-2025-11-11T16-47-47-877Z.json` رو دارید.

### 6.2. اجرای Import Script

**روش 1: از Railway CLI (Local)**
```bash
# نصب Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link به پروژه
railway link [PROJECT_ID]

# Connect به database
railway run node import-database.mjs database-backup-2025-11-11T16-47-47-877Z.json
```

**روش 2: از Railway Dashboard**
1. برو به MySQL service در Railway
2. کلیک روی **"Data"** tab
3. از **"Query"** استفاده کن برای اجرای SQL commands
4. یا از MySQL client خارجی connect کن

### 6.3. تست Database
```bash
# Check تعداد رکوردها
railway run node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [tweets] = await conn.query('SELECT COUNT(*) as count FROM tweets');
  console.log('Tweets:', tweets[0].count);
  await conn.end();
})();
"
```

---

## ⚙️ مرحله ۷: تنظیمات نهایی

### 7.1. Environment Variables
مطمئن شو همه environment variables در Railway set شده:

```bash
railway variables
```

باید این متغیرها رو ببینی:
- `NODE_ENV=production`
- `DATABASE_URL=mysql://...`
- `APIFY_TOKEN=...`
- `TELEGRAM_BOT_TOKEN=...`
- `TELEGRAM_CHAT_ID=...`
- `OPENROUTER_API_KEY=...`
- `JWT_SECRET=...`
- `VITE_APP_TITLE=AI Twitter Monitor`

### 7.2. تنظیم Telegram Webhook
1. برو به application URL تو
2. وارد Settings شو
3. کلیک روی **"🤖 Setup Telegram Mini App"**
4. Webhook تنظیم می‌شه

---

## ✅ مرحله ۸: تست نهایی

### 8.1. تست Dashboard
1. برو به URL پروژه
2. Login کن
3. Dashboard رو باز کن
4. مطمئن شو توییت‌ها نمایش داده می‌شن

### 8.2. تست Telegram Bot
1. یک لینک Twitter بفرست به ربات
2. باید محتوای rewrite شده + media دریافت کنی

### 8.3. تست Scheduled Posts
1. برو به Scheduled Posts
2. یک schedule جدید بساز
3. صبر کن تا زمان مشخص برسه
4. چک کن که توییت‌ها ارسال شدن

---

## 🐛 عیب‌یابی

### مشکل: Deployment failed
**راه حل:**
1. چک کن GitHub Actions logs
2. مطمئن شو همه secrets درست set شدن
3. چک کن Railway project ID درست است

### مشکل: Database connection error
**راه حل:**
1. چک کن `DATABASE_URL` در Railway variables
2. مطمئن شو MySQL service running است
3. تست connection با Railway CLI

### مشکل: Telegram bot پاسخ نمی‌ده
**راه حل:**
1. چک کن webhook URL درست set شده
2. برو به Settings و دوباره Setup Bot کن
3. چک کن `TELEGRAM_BOT_TOKEN` درست است

### مشکل: Build errors
**راه حل:**
1. چک کن `package.json` dependencies
2. مطمئن شو Node version 22 است
3. چک کن Railway logs برای error messages

---

## 📊 مانیتورینگ

### Railway Dashboard
1. برو به Railway project
2. مشاهده:
   - **Deployments**: تاریخچه deploys
   - **Metrics**: CPU, Memory, Network usage
   - **Logs**: Application logs
   - **Usage**: Railway credit usage

### GitHub Actions
1. برو به repository → Actions
2. مشاهده:
   - Workflow runs history
   - Success/failure rate
   - Deployment duration

---

## 🔄 بروزرسانی (Updates)

### برای deploy نسخه جدید:
```bash
# تغییرات رو commit کن
git add .
git commit -m "Your changes"
git push origin main

# خودکار deploy می‌شه!
```

### برای rollback:
1. برو به Railway Dashboard
2. کلیک روی service
3. برو به **Deployments** tab
4. روی deployment قبلی کلیک کن
5. **"Redeploy"** رو بزن

---

## 💰 هزینه‌ها (Free Tier)

Railway Free Tier شامل:
- ✅ $5 credit per month
- ✅ 500 ساعت execution
- ✅ 1GB RAM per service
- ✅ 1GB disk per service
- ✅ Shared CPU

**نکته:** برای پروژه AI Twitter Monitor، free tier کافی است اگر:
- Scheduled posts کم باشن (مثلاً 2-3 بار در روز)
- Traffic زیاد نباشه

---

## 📞 پشتیبانی

### Railway Support
- Docs: https://docs.railway.com
- Discord: https://discord.gg/railway
- Twitter: @Railway

### GitHub Actions
- Docs: https://docs.github.com/actions
- Community: https://github.community

---

## ✨ نکات مهم

1. **همیشه secrets رو امن نگه دار** - هیچوقت در کد commit نکن
2. **Database backup بگیر** - قبل از هر تغییر بزرگ
3. **Logs رو چک کن** - برای شناسایی مشکلات
4. **Free tier رو monitor کن** - تا credit تموم نشه
5. **Environment variables رو update کن** - وقتی API keys تغییر می‌کنن

---

## 🎉 تبریک!

پروژه AI Twitter Monitor تو حالا روی Railway deploy شده و با GitHub Actions خودکار update می‌شه! 🚀

هر سوالی داشتی، بپرس! 😊
