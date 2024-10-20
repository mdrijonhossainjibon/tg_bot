import TelegramBot from 'node-telegram-bot-api';
import {  NOSQL } from "models";
import { bot } from 'bot';
import { isSameDay } from "date-fns"; // Utility to compare dates 
import { isValidEthereumAddress } from 'lib';


const chunkArray = (array :any[], size : number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};


const generateAmountOptions = (min : number, max : number, count : number) => {
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => +(min + i * step).toFixed(1));
  };
  
  const amountOptions = generateAmountOptions(0.2, 5, 7);
 
  
 
const amountButtons = amountOptions.map(amount => ({   text: `💵 ${amount} USDT`,   callback_data: `withdraw_${amount}` })); // Unique callback data for each amount

const splitAmountButtons = chunkArray(amountButtons, 3);

export const handleWithdrawalAmount  = async  (msg: TelegramBot.Message, userId: number) => {
    const chatId = msg.chat.id;

    try {
        
      
        const userMessageRecord = await NOSQL.UserPreviousMessage.findOne({ chatId: userId });

        if (userMessageRecord) {
            try {
                // Delete the previous message
                await bot.deleteMessage(userId, parseInt(userMessageRecord.messageId)  );
            } catch (error) {
                // Handle error silently
            }
        } 
            
       
        const message = await bot.sendMessage(chatId, 'Please select your withdrawal amount:', {
            reply_markup: {
                inline_keyboard: [
                    ...splitAmountButtons,
                    [
                        { text: '₿ Wallet', callback_data: 'xrocket' }, { text: '↩️ Back', callback_data: 'menu' }
                    ]
                ] 
                
            }
        });

        // Save or update the user's previous message ID in the database
        await NOSQL.UserPreviousMessage.findOneAndUpdate(   { chatId: userId },  { messageId: message.message_id },  { upsert: true, new: true }  );

    } catch (error: any) {
        
    }
} 



export const handleWithdrawalOption  = async  (msg: TelegramBot.Message, userId: number) => {
    const chatId = msg.chat.id;

    try {
        
      
        const message = await bot.sendMessage(chatId, 'Please select your withdrawal Option:', {
            reply_markup: {
                inline_keyboard: [
                    [ 
                        { text: '🚀 @XROCKET', callback_data: 'xrocket' }
                    ],
                    [
                         { text: '↩️ Back', callback_data: 'menu' } 
                    ]
                ] 
                
            }
        });

        // Save or update the user's previous message ID in the database
        await NOSQL.UserPreviousMessage.findOneAndUpdate(   { chatId: userId },    { messageId: message.message_id },   { upsert: true, new: true }  );

    } catch (error: any) {
        await bot.sendPhoto(chatId, 'https://ibb.co/0KB4TMb', {
            caption: `${error.message}`,
            reply_markup: { inline_keyboard: [[{ text: '↩️ Back', callback_data: 'menu' }]] }
        });
    }
}


export const handleWithdrawal = async(msg: TelegramBot.Message, userId: number , amountMatch :  string , options : string , callbackQuery : TelegramBot.CallbackQuery) =>{
    const selectedAmount = parseFloat(amountMatch  );
    const user= await NOSQL.User.findOne({ userId });

    if (!user) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: `❌ User data not found.` });
        return;
    }
    
    if (!user.wallet && options === 'wallet') {
        await bot.answerCallbackQuery(callbackQuery.id, { text: `❌ Please set your wallet address before withdrawing.` });
        const message = await bot.sendMessage(userId, `To set your wallet, please use the command: /wallet_0xYourWalletAddress\nExample: /wallet_0xF266D1DD7F8b288705142F1d54a571B2FeA9ad00`);
        return await NOSQL.UserPreviousMessage.findOneAndUpdate(   { chatId: userId },  { messageId: message.message_id },  { upsert: true, new: true }  );
    }
       
    if (!isValidEthereumAddress(user.wallet)&& options === 'wallet') {
         await bot.answerCallbackQuery(callbackQuery.id, { text: `❌ Please set your wallet address before withdrawing.` });
       const message = await bot.sendMessage(userId, `To set your wallet, please use the command: /wallet_0xYourWalletAddress\nExample: /wallet_0xF266D1DD7F8b288705142F1d54a571B2FeA9ad00`);
        return await NOSQL.UserPreviousMessage.findOneAndUpdate(   { chatId: userId },  { messageId: message.message_id },  { upsert: true, new: true }  );
    }


    const today = new Date();
    if (user.lastWithdrawalDate && isSameDay(today, user.lastWithdrawalDate)) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: `❌ You have already made a withdrawal today. Please try again tomorrow.` });
        const message = await bot.sendPhoto(userId, 'https://ibb.co/tQTXzcd', {   caption: '❌ You have already made a withdrawal today. Please try again tomorrow.',
            reply_markup: {
                inline_keyboard: [[{ text: '↩️ Back', callback_data: 'menu' }]]
            }
        });
        
        return await NOSQL.UserPreviousMessage.findOneAndUpdate(   { chatId: userId },  { messageId: message.message_id },  { upsert: true, new: true }  );
    }
   
    if (selectedAmount > user.bonus) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: `❌ You do not have enough bonus to withdraw ${selectedAmount} USDT.` });
        
        return;
    }

    // Deduct the bonus from user's balance
    user.bonus -= selectedAmount;
    

    const initialPhoto = 'https://ibb.co/Ksj6JtC';
        const message = await bot.sendPhoto(userId, initialPhoto, {
            caption: `Your withdrawal of ${selectedAmount} USDT has been processed!`, reply_markup: {
                inline_keyboard: [

                    [
                        { text: '↩️ Back', callback_data: 'menu' }
                    ]
                ]
            }
        });

   

    await bot.answerCallbackQuery(callbackQuery.id, { text: `⏳ Withdrawal of ${selectedAmount} USDT Pending!` });
    
     user.lastWithdrawalDate = today;
     await user.save();
    await NOSQL.WithdrawalHistory.create({ userId, amount: selectedAmount, proposerId: message.message_id, username: callbackQuery.message?.chat.username || callbackQuery.message?.chat.first_name || null , method : options  , wallet : user.wallet })
    return  await NOSQL.UserPreviousMessage.findOneAndUpdate(   { chatId: userId },  { messageId: message.message_id },  { upsert: true, new: true }  );
}    


 
 