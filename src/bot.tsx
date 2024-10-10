import TelegramBot from "node-telegram-bot-api";

const token =  process.env.TELEGRAM_BOT_TOKEN as string || '7225380221:AAEUo8B-szHox0ChqFLlkRVTi8O_Z7Gu0QE';
export const bot = new TelegramBot(token, { polling: true });  