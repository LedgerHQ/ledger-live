export interface GetTxnsResponse {
  amount: string;
  blockHash: string;
  blockTime: string;
  chain: number;
  crossChainAccount?: string;
  crossChainId?: number;
  fromAccount: string;
  height: number;
  idx: number;
  requestKey: string;
  toAccount: string;
  token: string;
}

export interface GetInfoResponse {
  nodeApiVersion: string;
  nodeChains: string[];
  nodeGraphHistory: [number, [number, number[]][]][];
  nodeLatestBehaviorHeight: number;
  nodeNumberOfChains: number;
  nodeVersion: string;
}
