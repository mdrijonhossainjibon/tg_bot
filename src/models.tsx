import mongoose, { Document, Schema } from 'mongoose';


export interface IUser extends Document {
  uid : string;
  userId: number;
  username: string;
  wallet: string;
  referrerId?: string;
  referralCount: number;
  bonus: number;
  ipAddress: string;
  newUser : boolean;
  status: 'pending' | 'active' | 'banned';
  role: 'admin' | 'member';
  createdAt: Date; // Add createdAt to the interface
  updatedAt: Date; // Add updatedAt to the interface
  lastWithdrawalDate : Date;
  
}

const UserSchema: Schema<IUser> = new Schema<IUser>({
  uid  : String,
  userId: { type: Number, required: true, unique: true },
 
  username: { type: String, required: true },
  wallet: { type: String, default: null },
  referrerId: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  ipAddress: String,
  status: { type: String, default: 'active' },
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
  newUser : { type : Boolean , default :  false },
  lastWithdrawalDate: { type: Date, default: null },
}, {
  timestamps: true // Enable timestamps
});

  

export interface IChannel extends Document {
  
  username: string;
  path  : string;
  title: string;
  status : 'deactive' | 'active';
  role : 'admin' | 'member';
  created_at : Date;
}


const ChannelSchema: Schema<IChannel> = new Schema<IChannel> ({
  username: { type: String, required: true },
  path : { type: String, required: true },
  title : { type: String  },
  status : { type: String, default : 'active' },
  role : { type: String, enum: ['member', 'admin'], default: 'member' },
  created_at: { type: Date, default: Date.now },
});

type  WithdrawalStatus =  'pending' | 'success' | 'fail'


interface IWithdrawalHistory extends Document {
  userId: number;
  amount: number;
  symbol: string;
  status: WithdrawalStatus;
  hash: string;
  method : 'wallet' | 'xrocket';
  wallet : string;
  proposerId?: number;
  username : string;
  date: Date;
}



const WithdrawalHistorySchema: Schema<IWithdrawalHistory> = new Schema({
  userId: { type: Number, required: true },
  amount: { type: Number, required: true },
  symbol: { type: String, default : 'USDT' },
  hash: { type: String, default : null },
  status: { type: String, enum: ['pending' , 'success' , 'fail'],   default:  'pending' },
  method : { type : String , enum : [ 'wallet' , 'xrocket'] ,    default :  'xrocket'},
  wallet : {  type : String , default : null  }, 
  proposerId: { type: Number, default: null },
  username: { type: String, default : null },
  date: { type: Date, default: Date.now },
});


 


export interface IConfig extends Document {
  paymentKey: string;
  toggle_bot : 'on' | 'off';
  withdraw: "enabled" | "disabled"; 
  private_Key : string;
  createdAt?: Date;
}

export interface IUserPreviousMessage extends Document {
  chatId: string;
  messageId: string;
  createdAt?: Date;
}
// Create a schema for the configuration
const ConfigSchema: Schema = new Schema<IConfig>({
  paymentKey: { type: String , default : null },
  withdraw : { type: String , default : 'disabled'  },
  toggle_bot : { type: String , default : 'off'  },
  private_Key : { type : String , default :  null  },
  createdAt : { type : Date , default : Date.now() }
});



// Define the Mongoose schema for UserPreviousMessage
const UserPreviousMessageSchema: Schema = new Schema<IUserPreviousMessage>({
  chatId: {
      type: String,
      required: true,
      unique: true
  },
  messageId: {
      type: String,
      required: true
  },
  // Optionally, add a timestamp
  createdAt: {
      type: Date,
      default: Date.now
  }
});

// Create the model from the schema


const SerialSchema = new Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true }
});




 const Channel = mongoose.model<IChannel>('Channel', ChannelSchema);

 const Config = mongoose.model<IConfig>('Config', ConfigSchema);
 const Serial = mongoose.model('Serial', SerialSchema);
  const UserPreviousMessage = mongoose.model<IUserPreviousMessage>('UserPreviousMessage', UserPreviousMessageSchema);
  const WithdrawalHistory = mongoose.model<IWithdrawalHistory>('WithdrawalHistory', WithdrawalHistorySchema);
  const User = mongoose.model<IUser>('User', UserSchema);


export const NOSQL = { User , UserPreviousMessage , WithdrawalHistory  , Config , Channel , Serial }