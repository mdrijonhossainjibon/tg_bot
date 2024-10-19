import { bot } from "bot";
import { IConfig, NOSQL } from "models";
import { InlineKeyboardMarkup, KeyboardButton } from "node-telegram-bot-api";

export const saveUserPreviousMessage = async (chatId: string, messageId: string): Promise<void> => {
    try {
        // Find the user's previous message record
        let userMessage = await NOSQL.UserPreviousMessage.findOne({ chatId });

        if (userMessage) {
            // Update the existing record
            userMessage.messageId = messageId;
            await userMessage.save();
        } else {
            // Create a new record
            userMessage = new NOSQL.UserPreviousMessage({ chatId, messageId });
            await userMessage.save();
        }
    } catch (error) {
        console.error('Error saving user previous message:', error);
    }
};


export const getUserPreviousMessage = async (chatId: string): Promise<string | null> => {
    try {
        const userMessage = await NOSQL.UserPreviousMessage.findOne({ chatId });
        return userMessage ? userMessage.messageId : null;
    } catch (error) {
        console.error('Error retrieving user previous message:', error);
        return null;
    }
};


export const getConfig = async (): Promise<IConfig> => {
    let config = await NOSQL.Config.findOne<IConfig>();
    if (!config) {
        config = new NOSQL.Config({ paymentKey: '' });
        await config.save();
    }
    return config;
}


export async function isUserInChannel(userId: number, username: string): Promise<boolean> {
    try {
        const member = await bot.getChatMember(username, userId);
        return member.status !== 'left';
    } catch (error: any) {
        if (error.code === 403) {
            return false;
        } else {
            return false;
        }
    }
}

 
 export const keyboard    = {
    inline_keyboard: [
        [
            { text: '💰 Account Balance', callback_data: 'account_balance' },
            { text: '📩 Invite', callback_data: 'invite' },
        ],
        [
            { text: '💸 Withdrawal', callback_data: 'withdrawal' },
            { text: '📊 Statistics', callback_data: 'statistics' },
        ],
        [
            { text: '🕒 History',  web_app : { url : `https://mdrijonhossainjibonyt.xyz/auth/user/history`  } }, { text: '↩️ Back', callback_data: 'menu' }
        ]
    ]
};




export const isValidEthereumAddress = (address: string): boolean => {
    // Check if the address is 42 characters long and starts with '0x'
    const regex = /^0x[a-fA-F0-9]{40}$/;
    return regex.test(address);
};


 


export  async function generateUID() {
    // Find or create the serial counter
    const serialCounter = await NOSQL.Serial.findOneAndUpdate(
        { name: 'user_uid' }, // Name of the serial counter
        { $inc: { value: 1 } }, // Increment the serial number
        { new: true, upsert: true } // Return the updated document, or create it if it doesn't exist
    );

    const prefix = 'ID';
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const serialPart = serialCounter.value.toString().padStart(3, '0'); // Ensure it's a 3-digit number

    return `${prefix}${randomPart}${serialPart}`;
}