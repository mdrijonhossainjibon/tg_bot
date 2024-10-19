import * as crypto from 'crypto';
import { Wallet  } from 'ethers';
import bip39, { generateMnemonic, wordlists } from 'bip39';
  
 export function generateMnemonicString( ): string {
    // Generate a mnemonic with the specified number of words
    const mnemonic: string =  generateMnemonic(256, undefined, wordlists.english);
    return mnemonic;
  } 



  
function mnemonicToSeed(mnemonic: string): Buffer {
    const mnemonicBuffer : any = Buffer.from(mnemonic, 'utf8');
    const salt :any = Buffer.from('mnemonic' + '\u0012' + mnemonicBuffer.toString('hex'), 'utf8');
    return crypto.pbkdf2Sync(mnemonicBuffer, salt, 2048, 64, 'sha512');
  }
  
  function derivePrivateKey(masterKey: any, index: number): Buffer {
    const hmac = crypto.createHmac('sha512', masterKey );
    hmac.update(Buffer.from(index.toString(), 'utf8') as any);
    return hmac.digest().slice(0, 32); // Take first 32 bytes as private key
  }
   
  
 export function createWalletFromMnemonic(mnemonic: string, index: number = 0) {
    const seed :any = mnemonicToSeed(mnemonic);
    const masterKey = crypto.createHmac('sha512', 'Bitcoin seed').update(seed).digest();
    const privateKey = derivePrivateKey(masterKey, index);
   
     
  ///const erc20Address = publicKeyToERC20Address(publicKey); 
  
  const erc20Address =  new Wallet( privateKey.toString('hex') )
  ///console.log("ERC-20 Address:", new Wallet('807fdf4bdb94e04d01d9bf66e4b53b320424acaa15a544c2c638c5789f07431f'));
  
  
    return {  Address  : erc20Address.address ,  privateKey  : privateKey.toString('hex') };
  }
  
  
   
  