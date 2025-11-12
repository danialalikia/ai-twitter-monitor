# استفاده از Node 22 Alpine برای سایز کوچکتر
FROM node:22-alpine

# نصب dependencies مورد نیاز برای native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# فعال کردن pnpm از طریق corepack
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# کپی فایل‌های package برای کش بهتر
COPY package.json pnpm-lock.yaml ./

# کپی patches اگر وجود دارد
COPY patches ./patches

# نصب dependencies
RUN pnpm install --frozen-lockfile

# کپی بقیه سورس کد
COPY . .

# بیلد پروژه
RUN pnpm run build

# پورت پیشفرض
EXPOSE 3000

# استارت production
CMD ["pnpm", "run", "start"]
