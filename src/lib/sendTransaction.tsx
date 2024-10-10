import { API_CALL, TypeApiPromise } from "API_CALL";
import { Wallet, ethers } from "ethers";

// Define ABI as a constant
const abi = [
    "function transfer(address to, uint256 amount) returns (bool)"
];

// Define interface for transaction effects
interface TransactionEffects {
    status?: { status: string; error: string };
    gasUsed?: number;
}

// Define interface for raw transaction result
interface RawTransaction {
    result: {
        effects?: TransactionEffects;
    };
}

// Define class for sending transactions
export class SendTransaction {

    private wallet: Wallet;
    private provider: ethers.providers.JsonRpcProvider;
    
    constructor(providerUrl: string, privateKey: string) {
        this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
        this.wallet = new Wallet(privateKey, this.provider);
    }

    // Method to transfer Ether
    public async transfer(to: string, value: string): Promise<TypeApiPromise> {
        const nonce = await this.provider.getTransactionCount(this.wallet.address);
        const gasPrice = await this.provider.getGasPrice();
        const gasLimit = 21000;
        const amountToSend = ethers.utils.parseEther(value);
        const chainId = (await this.provider.getNetwork()).chainId; // Fetch chain ID

        const tx: ethers.providers.TransactionRequest = {
            nonce: ethers.utils.hexlify(nonce),
            gasPrice: ethers.utils.hexlify(gasPrice),
            gasLimit: ethers.utils.hexlify(gasLimit),
            to,
            value: ethers.utils.hexlify(amountToSend),
            chainId  // Include chain ID
        };

        const signedTx = await this.wallet.signTransaction(tx);
        const response = await API_CALL({
            baseURL: this.provider.connection.url, // Use provider connection URL
            method: 'POST',
            data: {
                jsonrpc: '2.0',
                method: 'eth_sendRawTransaction',
                params: [signedTx],
                id: 1,
            }
        });

        return response;
    }

    // Method to transfer ERC20 tokens
    public async erc20Transfer(to: string, value: string, contractAddress: string): Promise<ethers.ContractTransaction> {
        const tokenContract = new ethers.Contract(contractAddress, abi, this.wallet);
        const amountToSend = ethers.utils.parseUnits(value, 18); // Assuming 18 decimals, adjust accordingly
        const tx = await tokenContract.transfer(to, amountToSend);
        return tx;
    }
}
