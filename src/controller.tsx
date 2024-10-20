import { API_CALL } from "API_CALL";
import { bot } from "bot";
import { getConfig, isUserInChannel, keyboard } from "lib";
import { IUser, NOSQL } from "models";
import TelegramBot, { InlineKeyboardButton, InlineKeyboardMarkup } from "node-telegram-bot-api";
import qrcode from 'qrcode';



export async function handleReferralBonus(referrerId: number) {
    const referrer = await NOSQL.User.findOne({ userId: referrerId });
    if (!referrer) return;

    // Calculate and add a fixed bonus
    const bonus = 0.04; // Use a fixed referral bonus amount
    referrer.bonus = (referrer.bonus || 0) + bonus;
    referrer.referralCount = (referrer.referralCount || 0) + 1;

    await referrer.save();

    // Send a notification message to the referrer
     await bot.sendMessage(referrer.userId, `🎉 You have a new referral! You earned a bonus of ${bonus} USDT!`);
}


export const  getBotInfo = async () =>{
    try {
        return await bot.getMe()
    } catch (error) {
        console.log(error)
    }
}


export const Register = async (userId: any, referralMap: any, msg: TelegramBot.Message) => {
   
    try {

        const config = await getConfig();

        if (config.toggle_bot === 'off') {
            return bot.sendMessage(userId, '🔧 The bot is currently under maintenance. Please check back later.' ,{ reply_to_message_id :  msg.message_id });
        }

        const admins = await NOSQL.User.findOne({ userId });
        const checkJoined = await joinedChannel(admins, userId as any, msg);
 
        if ( checkJoined ) return;
 
         const { response } = await API_CALL({ url: 'create-account', body: { userId, referrerId: referralMap.get(userId), username: msg.chat.username }, method: 'post' });
        if (response && response.success) {
            setTimeout(async () => {
                const message = await bot.sendPhoto(userId, 'https://ibb.co/h1phDbr', {
                    caption: `Hi <b>@${msg.chat.username}</b> ✌️\nThis is Earning Bot. Welcome to Ton Network App. An Amazing App Ever Made for Online Earning lovers.`,
                    parse_mode: 'HTML', reply_markup: keyboard as any
                });
                return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });
            }, 5500);
        } else {
            const message = await bot.sendPhoto(userId, 'https://ibb.co/0KB4TMb', { caption: response?.message as string, reply_markup: { inline_keyboard: [[{ text: '↩️ Back', callback_data: 'menu' }]] } });
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });
        }
    } catch (error) {

    }

}


export const joinedChannel = async (existingUser: IUser | null, userId: any , msg :TelegramBot.Message) => {
    const channelUsernames = await NOSQL.Channel.find({  });
    const photoUrl = 'https://ibb.co/TbnZv2d';
    if (channelUsernames.length === 0 ) {

        const message = await bot.sendPhoto(userId, 'https://ibb.co/0KB4TMb', {
            caption: '🚫 No channels found. Please add a channel first.',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '↩️ Back', callback_data: 'menu' }, { text: '➕ Add Channel', callback_data: 'add_channel' }
                    ]
                ]
            }
        });
        return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });

    }  
    

    
    const visibleChannels: any[] = [];

    if (existingUser && existingUser.role === 'admin') {
        // If the user is an admin, show all channels with status 'active' (admin and member)
        visibleChannels.push(...channelUsernames.filter((channel) => channel.status === 'active'));
    } else {
        // If the user is a member, show only 'member' channels with status 'active' (hide 'admin' channels)
        visibleChannels.push(...channelUsernames.filter((channel) => channel.role !== 'admin' && channel.status === 'active'));
    }
    
    const joinedChannels =  await Promise.all(visibleChannels.map(channel => isUserInChannel(userId, channel.username)));
 
const inlineKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
        ...visibleChannels.map((channel, index) => {
            const joined = joinedChannels[index]; // Assuming you track joined status
            return {
                text: `Join Channel ${joined ? '✅' : '❌'}`,
                url: channel.channelurl,
            };
        }).reduce((rows: any[], button: any, index: number) => {
            if (index % 2 === 0) rows.push([button]);
            else rows[rows.length - 1].push(button);
            return rows;
        }, []),
        [{ text: '✌️ Claim Your USDT', callback_data: 'claim_usdc' }]
    ]
};

 

    if (joinedChannels.some(joined => !joined  )) {
        if (userId) {
            const message = await bot.sendPhoto(userId, photoUrl, {
                caption: `Hi <b>@${msg.chat.username}</b> ✌️\nWelcome to <b>$USDT Airdrop</b>\n\nAn Amazing Bot Ever Made for Online Earning lovers. Earn Unlimited <b>$USDT</b>`,
                parse_mode: 'HTML',
                reply_markup: inlineKeyboard
            });
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });
        }

    }
  
     
    return joinedChannels.some(joined => !joined  )
} 

export async function sendWelcomeMessage(user: any) {
    const welcomeMessage = `Welcome, ${user.username}! 🎉\n\nThank you for creating an account. We're excited to have you on board! Enjoy your welcome bonus of 0.10 USDT and start exploring our services. 😊`;
    user.bonus = (user.bonus || 0) + 0.10;
    user.newUser =  true;
    await user.save();
    await bot.sendMessage(user.userId, welcomeMessage);
 
} 

export const HomePage = async ( userId : string  , msg : TelegramBot.Message  ) =>{
    const message = await bot.sendPhoto(userId, 'https://ibb.co.com/RCYgjB2', {
        caption: `Hi <b>@${msg.chat.username}</b> ✌️\nThis is Earning Bot. Welcome to Ton Network App. An Amazing App Ever Made for Online Earning lovers.`,
        parse_mode: 'HTML', reply_markup: keyboard as any
        
    });
      return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId: userId },   { messageId: message.message_id },  { upsert: true, new: true }  );
}


export const Maintenance = async(existingUser: IUser | null, userId: any , msg :TelegramBot.Message )=>{
    const config = await getConfig();;
    

     
}


export const WithdrawalsMaintenance = async(existingUser: IUser | null, userId: any , msg :TelegramBot.Message )=>{
    const config = await getConfig();;
    
   
}


 




export async function handleReferral(msg: TelegramBot.Message, userId?: number) {
    const chatId = msg.chat.id;

    if (!userId) {
        const message = await bot.sendMessage(chatId, 'User ID not found. Please try again later.');
        return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId: userId },   { messageId: message.message_id },  { upsert: true, new: true }  );
    }

    try {
        const user = await NOSQL.User.findOne({ userId });

        
        if (user) {

            const username = await getBotInfo();
            const referralLink = `https://t.me/${username?.username}?startapp=${ user.uid }&hash=${ user.id }`;

            // Generate QR code
            const qrCodeImage = await qrcode.toDataURL(referralLink, { type: 'image/png' });

            // Convert data URL to Buffer
            const qrCodeBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');

            const keyboard: InlineKeyboardButton[][] = [
                [{ text: '↩️ Back', callback_data: 'menu' }],
            ];

            const caption = `*👫 Your Referral Information*\n\n` +
                `🔗 Your Referral Link: \`${referralLink}\`\n\n` +
                `*▪️ Your Total Referrals:* \`${user.referralCount || 0} Users\`\n\n` +
                `*👫 Per Referral \`0.06 $USDT\` - Share Your referral link with your friends & earn unlimited \`$USDT\`*\n\n` +
                `*⚠️ Note:* Fake, empty, or spam users are deleted after checking.`;


            // Send photo with caption including emojis
            const message = await bot.sendPhoto(chatId, qrCodeBuffer, {
                caption,
                reply_markup: { inline_keyboard: keyboard },
                parse_mode: 'Markdown'
            });
            return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId: userId },   { messageId: message.message_id },  { upsert: true, new: true }  );
        } else {
            await bot.sendMessage(chatId, 'User not found. Please start the bot first by sending /start.');
        }
    } catch (error: any) {

    }
}






export async function AccountBalance(msg: TelegramBot.Message, userId?: any) {
    const chatId = msg.chat.id;

    try {
        if (!userId) {
            throw new Error('User ID not found.');
        }

        const userDetails = await NOSQL.User.findOne({ userId });

        if (!userDetails) {
            throw new Error('User details not found.');
        }

        const messages = `🕵️‍♂️ Name: ${userDetails.username}\n\n` +
            `🆔 User Id: ${userDetails.userId}\n\n` +
            `💵 Balance: ${userDetails.bonus.toFixed(2)} $ USDT\n\n` +
            `$USDT Address: ${userDetails.wallet || userDetails.uid }\n` +
            `Not Create Xrocket Wallet? Then First Create Wallet👉 [Create Wallet](https://t.me/xrocket?start=mci_G2m7TBpnA8DanfM)\n\n` +
            `👫 Refer And Earn More $USDT\n\n` +
            `💳 Minimum Redeem: 0.50 $ USDT`;

        // Assuming you have a publicly accessible URL for the photo
        const photoUrl = 'https://ibb.co.com/RCYgjB2';

        const keyboard: InlineKeyboardButton[][] = [
            [
                { text: '📢 All Updated Channels', url: 'https://t.me/OnlineEarning24RIYAD' },
                { text: '📈 Live Charting Channel', url: 'https://t.me/RiyadRana' },
            ],
            [
                { text: '↩️ Back', callback_data: 'menu' },
            ]
        ];


        // Send photo with caption and markdown parsing
        const message = await bot.sendPhoto(chatId, photoUrl, {
            parse_mode: 'Markdown',
            caption: messages, reply_markup: { inline_keyboard: keyboard },
            disable_notification: true // Optional: Disable notification for this message
        });

        return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId: userId },   { messageId: message.message_id },  { upsert: true, new: true }  );

    } catch (error: any) {

    }
}


 export async function getStatistics(msg: TelegramBot.Message, userId?: number) {
    const chatId = msg.chat.id;

    try {
        if (!userId) {
            throw new Error('User ID not found.');
        }
        const totalMembers = await NOSQL.User.countDocuments();
        let totalPayouts = (await NOSQL.WithdrawalHistory.find({}))
            .reduce((total, record) => total + record.amount, 0);



        let statisticsMessage = `📊 Statistics 📊\n\n`;
        statisticsMessage += `👥 Total members: ${totalMembers} Users\n`;
        statisticsMessage += `💵 Total Payouts: ${totalPayouts.toPrecision(5)} $USDT`;

        // Example keyboard for Telegram inline buttons
        const keyboard = [
            [
                { text: 'Subscribe', url: 'https://www.youtube.com/channel/UCVnK6wLj7ix_laFyuiAA3yg' }, { text: 'Deploy Bot Contact', url: 'https://t.me/MdRijonHossainJibon' },
            ],
            [
                { text: '↩️ Back', callback_data: 'menu' },
            ]
        ];


        // Assuming `bot` is your Telegram bot instance (replace with your actual bot instance)
        const message = await bot.sendPhoto(chatId, 'https://ibb.co/6Hp9vxb', {
            caption: statisticsMessage,
            reply_markup: { inline_keyboard: keyboard },
            parse_mode: 'HTML' as const // Specify 'HTML' as const to prevent type errors
        });
        return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId: userId },   { messageId: message.message_id },  { upsert: true, new: true }  );
    } catch (error: any) {
        
    }
}
const statuses = {  pending: '🕒 Pending',  success: '✅ Success',    fail: '❌ Failed ' };

export async function sendWithdrawalHistory(chatId: number) {
    try {
        // Fetch withdrawal history (adjust query if needed)
        const history = await NOSQL.WithdrawalHistory.find({ userId: chatId }).sort({ date : -1 }).limit(10);

        if (history.length === 0) {
            const message = await bot.sendMessage(chatId, 'No withdrawal history available.',{ reply_markup : { inline_keyboard : [[  { text: '↩️ Back', callback_data: 'menu' },]]}});
            return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId },   { messageId: message.message_id },  { upsert: true, new: true }  );
        }

        // Construct messages with status and emojis
        const maxMessageLength = 4000; // Leave some buffer below the limit of 4096
        let message = '📜 *Withdrawal History*:\n\n';
        const messages = [];

        history.reverse().forEach((record, index) => {
            const status = statuses[record.status] || 'Unknown';
            const recordMessage = `#${index + 1}\n` +
                `Amount: ${record.amount}\n` +
                `Status: ${status}\n\n`;

            // Check if adding this record will exceed the max length
            if ((message + recordMessage).length > maxMessageLength) {
                // If it does, push the current message to the messages array
                messages.push(message);
                // Start a new message
                message = '📜 *Withdrawal History* (continued):\n\n' + recordMessage;
            } else {
                // Otherwise, add the record to the current message
                message += recordMessage;
            }
        });

        // Add the last message
        messages.push(message);

        // Send each message part
        for (const msg of messages) {
            const message = await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '↩️ Back', callback_data: 'menu' }]] } });
            return   await NOSQL.UserPreviousMessage.findOneAndUpdate(    { chatId },   { messageId: message.message_id },  { upsert: true, new: true }  );
        }
    } catch (error) {

    }
}