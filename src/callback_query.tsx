import { bot } from "bot";
import { AccountBalance, getStatistics, handleReferral, HomePage, joinedChannel,    sendWithdrawalHistory  } from "controller";
 

import { NOSQL } from "models";
import {  handleWithdrawalAmount, handleWithdrawalOption } from "withdrow";

const userStateStore = new Map<number, string>(); // userId -> state
 
 
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const userId = callbackQuery.from.id;
    
    if (!msg) return;

    try {
        let existingUser = await NOSQL.User.findOne({ userId });
        const data = callbackQuery.data || '';

       
        const userMessageRecord = await NOSQL.UserPreviousMessage.findOne({ chatId  : userId });

        if (userMessageRecord) {
            try {
                // Delete the previous message
                await bot.deleteMessage(userId, parseInt(userMessageRecord.messageId));
            } catch (error) {
                // Handle error silently
            }
        }
         
        ///const checkJoined = await joinedChannel(existingUser, userId as any, msg);
 
        //if ( checkJoined ) return;

        
        switch (data) {

            case 'account_balance':
                await AccountBalance(msg, userId)
                break
            case 'statistics':
                await getStatistics(msg, userId);
                break;
            case 'withdrawal':
               
                
                await handleWithdrawalOption(msg, userId);
                break
            case 'invite':
                await handleReferral(msg, userId)
                break;
            case 'history':
                await sendWithdrawalHistory(userId)
                break
            case 'xrocket':
                await handleWithdrawalAmount(msg, userId);
               
                break;
            case 'wallet':
                await handleWithdrawalAmount(msg, userId);
                break;
            case 'menu':
                await HomePage(userId as any, msg)
                break;
            case 'claim_usdc' :
  
                break;   
            default:
                const amountMatch = data.match(/^withdraw_(\d+(\.\d{1,2})?)$/);
                if (amountMatch) {
                   
                }
                break;
        }
 

    } catch (error) {

    }
});


 
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
   

    const userMessageRecord = await NOSQL.UserPreviousMessage.findOne({ chatId  });

        if (userMessageRecord) {
            try {
                // Delete the previous message
                await bot.deleteMessage(chatId, parseInt(userMessageRecord.messageId));
            } catch (error) {
                // Handle error silently
            }
        }
  
});


 
