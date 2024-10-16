import  { Message } from 'node-telegram-bot-api';
import dotenv from 'dotenv';

import { IChannel, IConfig, IUser, NOSQL } from "models";

import mongoose from 'mongoose';

import { API_CALL } from 'API_CALL';



dotenv.config();
import rateLimit from 'express-rate-limit';
import express from 'express';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors'
import { bot } from 'bot';
import 'withdrow';
import { handleReferralBonus, joinedChannel, Maintenance, Register } from 'controller';
import { generateUID,  getConfig, keyboard } from 'lib';
import './callback_query';
import { referralMap } from './callback_query';
 
const userPreviousMessages: any = {};
 
// Connect to MongoDB
 
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/admin').then(() => console.log('MongoDB connected')).catch((err: any) => console.error('MongoDB connection error:', err));

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(compression());


const createAccountLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 1, // limit each IP to 3 create account re    quests per windowMs
    message: 'Too many requests from this IP, please try again after 1s',
});


async function sendWelcomeMessage(user: any) {
    const welcomeMessage = `Welcome, ${user.username}! 🎉\n\nThank you for creating an account. We're excited to have you on board! Enjoy your welcome bonus of 0.020 USDT and start exploring our services. 😊`;
    user.bonus = (user.bonus || 0) + 0.020;
    await user.save();
    await bot.sendMessage(user.userId, welcomeMessage);

    // Assuming deleteMessage is a function provided by the bot API to delete messages
    setTimeout(async () => {
        //await bot.deleteMessage(user.userId, sentMessage.message_id);
    }, 5000); // 5000 milliseconds = 5 seconds
}

app.post('/create-account', createAccountLimiter, async (req, res: any) => {
    try {
        const ip = req.ip;
        const { referrerId, userId, username } = req.body;

        if (!username || typeof username !== 'string' || username.trim().length === 0) {
            throw new Error('Username not set');
        }

        const existingUserByIp = await NOSQL.User.findOne({ ipAddress: ip });
        if (existingUserByIp) {
            // return res.status(429).json({ success: false, message: 'Multiple accounts from the sa me IP address are not allowed. You have been banned.' });
        }

        if (userId) {
            let existingUser = await NOSQL.User.findOne({ userId });

            if (existingUser?.status === 'banned') {
                return res.status(404).json({ success: false, message: 'User banned. Account is not allowed.' });
            }
            if (!existingUser) {
                const uid = await generateUID();
                if (referrerId) {
                    const existingReferrer = await NOSQL.User.findOne({ userId: referrerId });
                    if (!existingReferrer) {
                        return res.status(404).json({ success: false, message: 'Referral code not found or user banned.', referrerId });
                    }
                    existingUser = new NOSQL.User({ userId, username, referrerId, ipAddress: ip, bonus: 0.00, uid });
                    await existingUser.save();
                    await sendWelcomeMessage(existingUser);
                    // If there is a referrer, increment their referral count and handle bonuses
                    await handleReferralBonus(referrerId); // Start with level 1
                    referralMap.delete(userId);
                    return res.status(201).json({ success: true, message: 'Account creation successful.' });
                }
                existingUser = new NOSQL.User({ userId, username, ipAddress: ip, bonus: 0.00, uid });
                await existingUser.save();
                await sendWelcomeMessage(existingUser);
                referralMap.delete(userId);
                return res.status(201).json({ success: true, message: 'Account creation successful.' });
            }
            if (existingUser) {
                return res.status(201).json({ success: true, message: 'Login successful.' });
            }
        }

        return res.status(201).json({ success: false, message: 'Login unsuccessful.' });

    } catch (error: any) {

        return res.status(500).json({ success: false, message: error.message });
    }
});



interface ALLPromise {
    uid: string;
    role: 'admin' | 'member';
    username: string;
    balance: number;
    userid: string | number;
    status: string;
    referralUid: any;
    created_at: Date
}

app.get('/getalluser', async (req, rep) => {
    try {
        const user = await NOSQL.User.find().limit(500);
        const result: ALLPromise[]  = [];

        for (let c of user) {
            result.push({ uid: c.uid, role: c.rule, username: c.username, balance: c.bonus, userid: c.userId, status: c.status, referralUid: c.referrerId, created_at: c.createdAt })
        }
        return rep.status(200).json({ result })
    } catch (error) {
        return rep.status(500).json({ message: 'An error occurred durin ' , error });
    }
})


app.post('/config', async (req, rep) => {
    try {
        const { private_Key, token , tg_group, withdraw, toggle_bot } = req.body;


       

        
        // Get current configuration
        const config = await NOSQL.Config.findOne<IConfig>();
        if (!config) {
            return rep.status(404).json({ message: 'Configuration not found.' });
        }

        // Prepare an array of promises for all updates
        const promises: Promise<any>[] = [];

        // Update private key if provided
        if (private_Key) {
            config.private_Key = private_Key;
        }

        // Update API key if provided
        if (token) {
            config.paymentKey = token;
        }

        // Insert Telegram group data if available
        if (Array.isArray(tg_group) && tg_group.length > 0) {
            // Fetch existing groups from the database
            const existingGroups = await NOSQL.Channel.find({ username : { $in: tg_group.map(g => g.username ) } });

            // Prepare updates and new inserts
            const updates: Promise<any>[] = [];
            const newGroups = tg_group.filter(group => 
                !existingGroups.some(existing => existing.username === group.username)
            );

            // Prepare updates for existing groups
            existingGroups.forEach(existing => {
                const groupToUpdate = tg_group.find(g => g.username === existing.username);
                if (groupToUpdate) {
                    updates.push(NOSQL.Channel.updateOne(
                        { username : existing.username },
                        { $set: groupToUpdate }
                    ));
                }
            });  

            // Insert new groups
            if (newGroups.length > 0) {
                updates.push(NOSQL.Channel.insertMany(newGroups));
            }

            // Wait for all updates and inserts to resolve
            promises.push(...updates);
        }
        

        // Update withdraw setting if provided
        if (withdraw) {
            config.withdraw = withdraw;
        }
 
        // Update bot toggle setting if provided
        if (typeof toggle_bot !== 'undefined') {
            config.toggle_bot = toggle_bot;
        }

       
        // Save config updates as a promise
        promises.push(config.save());

        // Wait for all promises to resolve
        await Promise.all(promises);

        // Return success response
        return rep.status(200).json({ message: { success :  'Configuration updated successfully.' }});
    } catch (error: any) {
        return rep.status(500).json({ message: 'An error occurred while updating configuration.', error: error.message });
    }
});


app.get('/config', async (req, rep) => {
    try {
        // Retrieve the configuration from your database or source
        const config = await getConfig();
        const channels = await NOSQL.Channel.find({});

        const tg_group = {
            username: channels.map(channel => channel.username),
            channel: channels.map(channel => channel.channelurl) // Assuming 'channelUrl' is the field for URLs
        };

        // Send the configuration in the response
        return rep.status(200).json({
            private_Key: config.private_Key,
            token : config.paymentKey,
            withdraw: config.withdraw,
            toggle_bot: config.toggle_bot,
            tg_group
        });
    } catch (error :any) {
        // Return error message if there's an issue fetching the configuration
        return rep.status(500).json({ message: 'An error occurred while fetching the configuration.', error: error.message });
    }
});
app.get('/channels', async (req, res) => {
    try {
        // Fetch all channels
        const result = await NOSQL.Channel.find({});
        
        if (!result.length) {
            return res.status(404).json({ message: { error : 'No channels found' } });
        }

        return res.status(200).json({ message: 'Channels retrieved successfully', result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while retrieving channels' });
    }
});

app.post('/channels', async (req, res) => {
    try {
        // Destructure the channel data from the request body
        const { username , status , role }: { username: string , status :  'active' | 'deactive' , role :  'admin' |'member' } = req.body;

        // Check if the username is provided
        if (!username) {
            return res.status(400).json({ message: { error: 'Username is required' } });
        }

        // Check if the username starts with "@" and is followed by alphanumeric characters or underscore
        const usernameRegex = /^@[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ message: { error: 'Username must start with "@" and contain only letters, numbers, or underscores' } });
        }

         // Validate the status (should be either 'active' or 'deactive')
         if (status && (status !== 'active' && status !== 'deactive')) {
            return res.status(400).json({ message: { error: 'Invalid or missing status. It must be "active" or "deactive".' } });
        }

        if (role && (role !== 'admin'  && role !== 'member')) {
            return res.status(400).json({ message: { error: 'Invalid or missing role. It must be "admin", "moderator", or "user".' } });
        }
        // Check if the channel already exists based on username
        const existingChannel = await NOSQL.Channel.findOne({ username });

        if (existingChannel) {
            if (status) {
                existingChannel.status = status;
                await existingChannel.save();
                return res.status(200).json({ message: { success: 'Channel status updated successfully' } });
            }
            if (role) {
                existingChannel.role = role;
                await existingChannel.save();
                return res.status(200).json({ message: { success: 'Channel  role updated successfully' } });
            }
            return res.status(409).json({ message: { error: 'Channel with the same username already exists' } });
        }

        const channelurl = `https://t.me/${username.slice(1)}`; // Remove "@" from the username to create the URL

        // Create a new channel if it doesn't exist
        await NOSQL.Channel.create({ username, channelurl });

        return res.status(201).json({ message: { success : 'Channel created successfully'} });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: { error: 'An error occurred while creating the channel' } });
    }
});



app.delete('/channel', async (req, res) => {
    try {
        const { username, channelUrl } = req.body; // Get both username and channelUrl from the request body
        console.log(req.body);
        
        const query = username ? { username } : { channelUrl }; // Determine the query based on the provided field
        
        // Check if either field is provided
        if (!query.username && !query.channelUrl) {
            return res.status(400).json({ message: 'Please provide either username or channelUrl' });
        }

        const deletedChannel = await NOSQL.Channel.findOneAndDelete(query);

        if (!deletedChannel) {
            return res.status(404).json({ message: 'Channel not found' });
        }

        return res.status(200).json({ message: 'Channel deleted successfully', channel: deletedChannel });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while deleting the channel' });
    }
});



app.post('/payment_processing', async (req, res) => {
    try {
        const history = await NOSQL.WithdrawalHistory.find({ status: 'pending' }).limit(10);

        if (history.length === 0) {
            return res.status(404).json({ success: false, message: 'No pending withdrawals found.' });
        }

        const config = await getConfig();
        let baseURL: string | undefined;



        for (let index of history) {
            const tgUserId = parseInt(index.userId as any, 10);
            if (isNaN(tgUserId) || tgUserId <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid tgUserId. It must be a positive number.' });
            }

            const content = `✅ <b>Withdrawal Sent Successfully</b>\n\n<b>Amount:</b> ${index.amount} USDT \n<b>WALLET:</b> ${index.userId}\n\n🤖BOT: @RR0024_bot`;
            const refundAmount = index.amount;
            const user = await NOSQL.User.findOne({ userId: index.userId });
            const transferId = tgUserId.toString() + Math.random().toString(36).substring(2, 10);

            if (index.method === 'xrocket') {
                const body = {
                    tgUserId,
                    currency: 'USDT',
                    amount: index.amount,
                    transferId,
                    description: `🤎🎣 Withdrawal Sent Successfully From @${index.username}`
                };
                baseURL = 'https://pay.ton-rocket.com/app/transfer';

                try {
                    const { response, status } = await API_CALL({
                        baseURL,
                        method: 'post',
                        body,
                        headers: { "Rocket-Pay-Key": config.paymentKey }
                    });

                    if (response && response.success) {
                        const message = await bot.sendPhoto(index.userId, 'https://ibb.co.com/xhYdr0T', {
                            caption: content,
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '✅ Payment Channel', url: `https://t.me/RR0000110/${index.public_id}` },
                                        { text: '↩️ Back', callback_data: 'menu' }
                                    ]
                                ]
                            }
                        });

                        await NOSQL.UserPreviousMessage.findOneAndUpdate(
                            { chatId: index.userId },
                            { messageId: message.message_id },
                            { upsert: true, new: true }
                        );

                        index.status = 'success';
                        await index.save();
                        return;

                    } else {
                        if (user) {
                            user.bonus += refundAmount;
                            user.lastWithdrawalDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
                            await user.save();
                        }
                        const errorMessage = `❌ Found Transfer Error. Your balance has been refunded with ${refundAmount} USDT. Try again in 1 minute.`;

                        const message = await bot.sendPhoto(index.userId, 'https://ibb.co/jG9KM1G', {
                            caption: errorMessage,
                            reply_markup: {
                                inline_keyboard: [[{ text: '↩️ Back', callback_data: 'menu' }]]
                            }
                        });

                        index.status = 'fail';
                        await index.save();
                        await NOSQL.UserPreviousMessage.findOneAndUpdate(
                            { chatId: index.userId },
                            { messageId: message.message_id },
                            { upsert: true, new: true }
                        );

                        return res.status(status as number).json({ success: false, message: response?.errors || 'Unknown error during transfer.' });
                    }



                } catch (error) {
                    return res.status(500).json({ message: 'An error occurred during payment processing.' });
                }
            }
        }

        return res.status(201).json({ success: true, message: 'Payment processed successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'An error occurred during payment processing.' });
    }
});


 


app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to API service',
        apiProvider: 'Md Rijonhossain Jibon',
        contact: '/contact'  // Replace with your actual Telegram link
    });
});


app.get('/contact', (req, res) => {
    res.redirect('https://t.me/MdRijonHossainJibon')

});


app.get('*', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to API service',
        apiProvider: 'Md Rijonhossain Jibon',
        contact: '/contact'  // Replace with your actual Telegram link
    });
});







bot.onText(/\/start(?:\s+(\d+))?/, async (msg: Message, match: RegExpExecArray | null) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    const userMessageRecord = await NOSQL.UserPreviousMessage.findOne({ chatId: userId });

    if (userMessageRecord) {
        try {
            // Delete the previous message
            await bot.deleteMessage(userId as number, parseInt(userMessageRecord.messageId));
        } catch (error) {
            // Handle error silently
        }
    }


    const referrerId = match && match[1] ? parseInt(match[1]) : null;

    try {
        if (userId && referrerId) {
            referralMap.set(userId, referrerId);
        }

        if (!userId) {
            const message = await bot.sendMessage(chatId, 'User ID not found. Please try again later.');
            return userPreviousMessages[chatId] = message.message_id;
        }



        await Register(userId, referralMap, msg);



    } catch (err) {
        // Handle error 
    }
});



bot.onText(/\/wallet_(.+)/, async (msg, match) => {
    const userId = msg.from?.id;
    const walletAddress = match ? match[1] : null;

    if (!userId || !walletAddress) return;


    if (userPreviousMessages[userId]) {
        try {
            await bot.deleteMessage(userId, userPreviousMessages[userId].toString() as any);
        } catch (error) {

        }
    }

    try {
        await NOSQL.User.findOneAndUpdate({ userId }, { wallet: walletAddress }, { upsert: true });
        const message = await bot.sendMessage(userId, `✅ Your wallet address has been set to: ${walletAddress}`);
        return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });
    } catch (error) {

    }
});






bot.on('message', async (msg) => {
    try {
        const userId = msg.chat.id;
        const text = msg.text;


       
        
   
        const startCommandRegex = /^\/start(?:\s+(\d+))?$/;

        if (text === '/start') return;
// Check if the message matches the /start command pattern
if (startCommandRegex.test(text as string)) {
    // Extract the numeric parameter if present
    const match = startCommandRegex.exec(text as string);
    const numericParam = match && match[1] ? parseInt(match[1], 10) : undefined;
    if (numericParam) return;
}
        const config = await getConfig();

        if (config.toggle_bot === 'off') {
            return bot.sendMessage(userId, '🔧 The bot is currently under maintenance. Please check back later.');
        }

        const admins = await NOSQL.User.findOne({ userId });
 

         const checkJoined = await joinedChannel(admins, userId as any, msg);

        if (checkJoined) return;

 


        if (text === '↩️ Back') {
 
             const message = await bot.sendPhoto(userId, 'https://ibb.co/h1phDbr', {
                caption: `Hi <b>@${msg.chat.username}</b> ✌️\nThis is Earning Bot. Welcome to Ton Network App. An Amazing App Ever Made for Online Earning lovers.`,
                parse_mode: 'HTML', reply_markup: keyboard
            });
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });
        }



        



        if (admins && admins.status === 'banned') {
            const message = await bot.sendPhoto(userId, 'https://ibb.co/DzCpqgR', { caption: `User banned. Account is not allowed.` })
            return await NOSQL.UserPreviousMessage.findOneAndUpdate({ chatId: userId }, { messageId: message.message_id }, { upsert: true, new: true });
        }
 
    } catch (error: any) {
    }
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Bot is running...');
});


 