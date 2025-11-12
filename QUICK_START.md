# ⚡ راهنمای سریع Deploy به Railway

این راهنمای خلاصه برای deploy سریع پروژه است. برای جزئیات کامل، `RAILWAY_DEPLOYMENT_GUIDE.md` را ببینید.

---

## 🚀 مراحل (5 دقیقه)

### 1️⃣ ساخت پروژه در Railway
```
1. برو به https://railway.app
2. کلیک "New Project" → "Empty Project"
3. نام: ai-twitter-monitor
4. کلیک "+ New" → "Database" → "Add MySQL"
5. کپی کن: Project ID (از Settings)
```

### 2️⃣ تنظیم GitHub Secrets
```
برو به: https://github.com/danialalikia/ai-twitter-monitor/settings/secrets/actions

اضافه کن:
✅ RAILWAY_TOKEN = 107a4168-fca3-47e3-a967-520955d64164
✅ RAILWAY_PROJECT_ID = [از Railway گرفتی]
✅ DATABASE_URL = [از Railway MySQL Variables]
✅ APIFY_TOKEN = [Apify token تو]
✅ TELEGRAM_BOT_TOKEN = [Bot token تو]
✅ TELEGRAM_CHAT_ID = [Chat ID تو]
✅ OPENROUTER_API_KEY = [OpenRouter key تو]
✅ JWT_SECRET = [32+ random chars]
```

**تولید JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3️⃣ Push به GitHub
```bash
cd /home/ubuntu/ai-twitter-monitor-new
git add .
git commit -m "Add Railway deployment"
git push origin main
```

### 4️⃣ اجرای Deploy
```
1. برو به: https://github.com/danialalikia/ai-twitter-monitor/actions
2. کلیک "Deploy to Railway"
3. کلیک "Run workflow" → "Run workflow"
4. صبر کن تا تمام شه (2-3 دقیقه)
```

### 5️⃣ Generate Domain
```
1. برو به Railway project
2. کلیک روی service
3. Settings → Networking → "Generate Domain"
4. کپی کن URL
```

---

## ✅ تست

### تست 1: باز کردن سایت
```
1. باز کن: [Railway domain تو]
2. باید صفحه login نمایش داده بشه
```

### تست 2: Import Database
```bash
# از local:
railway login
railway link [PROJECT_ID]
railway run node import-database.mjs database-backup-2025-11-11T16-47-47-877Z.json
```

### تست 3: Telegram Bot
```
1. برو به Settings در سایت
2. کلیک "🤖 Setup Telegram Mini App"
3. بفرست یک لینک Twitter به ربات
4. باید rewrite شده + media دریافت کنی
```

---

## 🐛 مشکل داری؟

### Build failed
```
✅ چک کن GitHub Actions logs
✅ مطمئن شو همه secrets set شدن
✅ چک کن Railway project ID درست است
```

### Database error
```
✅ چک کن DATABASE_URL در Railway
✅ مطمئن شو MySQL running است
✅ تست با: railway run node -e "console.log(process.env.DATABASE_URL)"
```

### Telegram bot کار نمی‌کنه
```
✅ برو Settings → Setup Bot دوباره
✅ چک کن TELEGRAM_BOT_TOKEN
✅ چک کن webhook URL
```

---

## 📚 منابع

- 📖 راهنمای کامل: `RAILWAY_DEPLOYMENT_GUIDE.md`
- 🚂 Railway Docs: https://docs.railway.com
- 🤖 GitHub Actions: https://docs.github.com/actions

---

## 💡 نکات

- ✅ هر push به `main` خودکار deploy می‌شه
- ✅ Free tier: $5/month credit
- ✅ Logs: Railway Dashboard → Service → Logs
- ✅ Rollback: Railway → Deployments → Redeploy

---

**موفق باشی! 🎉**
