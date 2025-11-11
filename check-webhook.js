import('dotenv/config');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7955535829:AAH_N8Lhz5Uf1Iq7eP8XKGJsaFbXWyKJNXE';

async function checkWebhook() {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const data = await response.json();
  console.log('Webhook Info:');
  console.log(JSON.stringify(data, null, 2));
}

checkWebhook();
