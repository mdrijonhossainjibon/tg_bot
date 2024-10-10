import { bot } from "bot";
import { AccountBalance, getStatistics, handleReferral, HomePage, joinedChannel, Maintenance, refundUser, Register, sendWithdrawalHistory, WithdrawalsMaintenance } from "controller";
 
import { getConfig } from "lib";

import { NOSQL } from "models";
import { handleWithdrawal, handleWithdrawalAmount, handleWithdrawalOption } from "withdrow";

const userStateStore = new Map<number, string>(); // userId -> state
const adminStates: { [key: string]: string } = {};
export let referralMap = new Map<number, number>();
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const userId = callbackQuery.from.id;
    
    if (!msg) return;

    try {
        let existingUser = await NOSQL.User.findOne({ userId });
        const data = callbackQuery.data || '';

        const userMessageRecord = await NOSQL.UserPreviousMessage.findOne({ chatId: userId });

        if (userMessageRecord) {
            try {
                // Delete the previous message
                await bot.deleteMessage(userId, parseInt(userMessageRecord.messageId));
            } catch (error) {
                // Handle error silently
            }
        }
 
        const checkJoined = await joinedChannel(existingUser, userId as any, msg);
 
        if ( checkJoined ) return;

        
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
                userStateStore.set(userId, 'xrocket');
                break;
            case 'wallet':
                await handleWithdrawalAmount(msg, userId);
                userStateStore.set(userId, 'wallet');
                break;
            case 'menu':
                await HomePage(userId as any, msg)
                break;
            case 'claim_usdc' :
                await Register(userId , referralMap , msg)
                break;   
            default:
                const amountMatch = data.match(/^withdraw_(\d+(\.\d{1,2})?)$/);
                if (amountMatch) {
                    const options = userStateStore.get(userId)
                    await handleWithdrawal(msg, userId, amountMatch[1], options as string, callbackQuery);
                    userStateStore.delete(userId);
                    break;
                }
                break;
        }
 

    } catch (error) {

    }
});
















bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    const userMessageRecord = await NOSQL.UserPreviousMessage.findOne({ chatId  });

        if (userMessageRecord) {
            try {
                // Delete the previous message
                await bot.deleteMessage(chatId, parseInt(userMessageRecord.messageId));
            } catch (error) {
                // Handle error silently
            }
        }
    const admins = await NOSQL.User.findOne({ userId: chatId });
 

    // Check if the message is from the admin and is a reply to the payment key request
    if (admins && admins.rule === 'admin' && adminStates[chatId] === 'awaiting_add_payment_key') {
        if (text) {
            // Process and save the new payment key
            adminStates[chatId] = ''; // Clear the state

            const config = await getConfig();

            config.paymentKey = text;
            await config.save()

            const message = await bot.sendMessage(chatId, `✅ Payment key has been updated to: ${text}` ,{ reply_markup : { inline_keyboard :  [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }]]}});
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
        } else {
            const message = await bot.sendMessage(chatId, '❌ Invalid input. Please provide a valid payment key.');
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
        }
    }
    if (admins && admins.rule == 'admin' && adminStates[chatId] === 'awaiting_add_channel') {
        if (text) {
            // Process and save the new payment key
            const [username, url] = text.split(',').map(item => item.trim());
            if (username && url) {
                // Process and save the new channel
                adminStates[chatId] = ''; // Clear the state
                const channelList = await NOSQL.Channel.findOne({ username, url })

                if (channelList) {
                    channelList.username = username;
                    channelList.channelurl = url;
                    const message = await bot.sendMessage(chatId, `✅ Channel added: \nUsername: ${username}\nURL: ${url}` ,{ reply_markup : { inline_keyboard : [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }] ]} });
                    return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
                }

                await NOSQL.Channel.create({ url, username });
                const message = await bot.sendMessage(chatId, `✅ Channel added: \nUsername: ${username}\nURL: ${url}`, { reply_markup : { inline_keyboard : [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }] ]} });
                return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
            } else {
                 adminStates[chatId] = ''; // Clear the state
                const message = await bot.sendMessage(chatId, '❌ Invalid input. Please provide in the format: `username, url`.' , { reply_markup : { inline_keyboard : [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }] ]} });
                return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
            }
        } else {
            adminStates[chatId] = ''; // Clear the state
            const message = await bot.sendMessage(chatId, '❌ Invalid input. Please provide in the format: `username, url`.' , { reply_markup : { inline_keyboard : [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }] ]} });
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId }, { messageId: message.message_id }, { upsert: true, new: true });
        }
    }
    if (admins && admins.rule == 'admin' && adminStates[chatId] === 'awaiting_add_refund') {
        if (text) {
            // Process and save the new payment key
            adminStates[chatId] = ''; // Clear the state
            const [userId, amount, symbol] = text.split(',').map(item => item.trim());
            if (userId && amount && symbol) {
               
               
                await refundUser(userId as any,  amount  as any , symbol);
            }
        } else {
            adminStates[chatId] = ''; // Clear the state
            const message = await bot.sendMessage(chatId, '❌ Invalid input. Please provide in the format: `userid, amount , symbol (e.g., USD)`.' , { reply_markup : { inline_keyboard : [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }] ]} });
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
        }
    }

    if (admins && admins.rule === 'admin' && adminStates[chatId] === 'awaiting_crypto_wallet') {
        if (text) {
            // Process and save the new payment key
            adminStates[chatId] = ''; // Clear the state

            const config = await getConfig();

            config.private_Key = text;
            await config.save()

            const message = await bot.sendMessage(chatId, `✅  crypto_wallet  key has been updated to: ${text}` ,{ reply_markup : { inline_keyboard :  [[{ text: '↩️ Back', callback_data: 'menu' }, { text: '👩‍💼 Admin', callback_data: 'admin_panel' }]]}});
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
        } else {
            const message = await bot.sendMessage(chatId, '❌ Invalid input. Please provide a valid payment key.');
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId  }, { messageId: message.message_id }, { upsert: true, new: true });
        }
    }
     
});

