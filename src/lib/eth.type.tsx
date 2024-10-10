


export interface EthereumRPCMethods {
    getBlockNumber: string;
    getAccounts: string;
    getChainId: string;
    getEstimateGas: string;
    getfeeHistory: string;
    getgasPrice: string;
    getBalance: string;
    getBlockByHash: string;
    getBlockByNumber: string;
    getBlockReceipts: string;
    getBlockTransactionCountByHash: string;
    getBlockTransactionCountByNumber: string;
    getCode: string;
    getLogs: string;
    getProof: string;
    getTransactionByBlockHashAndIndex: string;
    getTransactionByBlockNumberAndIndex: string;
    getTransactionByHash: string;
    getTransactionCount: string;
    getTransactionReceipt: string;
    newBlockFilter: string;
    newFilter: string;
    newPendingTransactionFilter: string;
    sendRawTransaction: string;
    signTransaction: string;
    Subscribe: string;
    Subscription: string
    Unsubscribe: string;
    eth_sendTransaction : string
  }
  
  // Usage:
  export const RPC_JSON_ETH: EthereumRPCMethods = {
    getBlockNumber: 'eth_blockNumber',
    getAccounts: 'eth_accounts',
    getChainId: 'eth_chainId',
    getEstimateGas: 'eth_estimateGas',
    getfeeHistory: 'eth_feeHistory',
    getgasPrice: 'eth_gasPrice',
    getBalance: 'eth_getBalance',
    getBlockByHash: 'eth_getBlockByHash',
    getBlockByNumber: 'eth_getBlockByNumber',
    getBlockReceipts: 'eth_getBlockReceipts',
    getBlockTransactionCountByHash: 'eth_getBlockTransactionCountByHash',
    getBlockTransactionCountByNumber: 'eth_getBlockTransactionCountByNumber',
    getCode: 'eth_getCode',
    getLogs: 'eth_getLogs',
    getProof: 'eth_getProof',
    getTransactionByBlockHashAndIndex: 'eth_getTransactionByBlockHashAndIndex',
    getTransactionByBlockNumberAndIndex: 'eth_getTransactionByBlockNumberAndIndex',
    getTransactionByHash: 'eth_getTransactionByHash',
    getTransactionCount: 'eth_getTransactionCount',
    getTransactionReceipt: 'eth_getTransactionReceipt',
    newBlockFilter: 'eth_newBlockFilter',
    newFilter: 'eth_newFilter',
    newPendingTransactionFilter: 'eth_newPendingTransactionFilter',
    sendRawTransaction: 'eth_sendRawTransaction',
    eth_sendTransaction : "eth_sendTransaction",
    signTransaction: 'eth_signTransaction',
    Subscribe: 'eth_subscribe',
    Subscription: 'eth_subscription',
    Unsubscribe: 'eth_unsubscribe',
  };
  
  export interface RPC_JSON_BTC {
    getBlock: string
    getBlockHash: string;
    getConnecttioncount: string;
    getDifficulty: string;
    getBlockchaininfo: string;
    getMininginfo: string
    getPeerinfo: string;
    getRawmempool: string;
  
  }
  export const RPC_JSON_BTC: RPC_JSON_BTC = {
    getBlock: 'getblockcount',
    getBlockHash: 'getbestblockhash',
    getConnecttioncount: 'getconnectioncount',
    getDifficulty: 'getdifficulty',
    getBlockchaininfo: 'getblockchaininfo',
    getMininginfo: 'getmininginfo',
    getPeerinfo: 'getpeerinfo',
    getRawmempool: 'getrawmempool'
  
  }
  
  
  
  export type EthereumRPCMethod = keyof EthereumRPCMethods;
  
  export type BTC_RPCMethod = keyof RPC_JSON_BTC;
  