import TelegramBot from "node-telegram-bot-api";

const token =  process.env.TELEGRAM_BOT_TOKEN as string || '7837648046:AAE6IDa6EleiVEJNzkz1oQ6bwIFNcp0xKg0';
export const bot = new TelegramBot(token, { polling: true });  