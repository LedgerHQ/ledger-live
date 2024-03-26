export const BroadcastBlockIncl = 1;

export enum TxStatus {
  Ok = "Ok",
  Fail = "Fail",
}

export interface EstimatedFeesRequest {
  to?: string;
  from: string;
  methodNum?: number;
  blockIncl?: number;
}

export interface EstimatedFeesResponse {
  gas_limit: number;
  gas_fee_cap: string;
  gas_premium: string;
  nonce: number;
}

export interface TransactionsResponse {
  txs: TransactionResponse[];
}

export interface TransactionResponse {
  amount: number;
  to: string;
  from: string;
  status: string;
  type: string;
  hash: string;
  timestamp: number;
  height: number;
  fee?: number;
}

export interface BalanceResponse {
  locked_balance: string;
  spendable_balance: string;
  total_balance: string;
}

export interface NetworkStatusResponse {
  current_block_identifier: BlockIdentifier;
  genesis_block_identifier: BlockIdentifier;
  oldest_block_identifier?: BlockIdentifier;
  current_block_timestamp: number;
}

export interface BroadcastTransactionRequest {
  message: {
    version: number;
    to: string;
    from: string;
    nonce: number;
    value: string;
    gaslimit: number;
    gasfeecap: string;
    gaspremium: string;
    method: number;
    params: string;
  };
  signature: {
    type: number;
    data: string;
  };
}

export interface BroadcastTransactionResponse {
  hash: string;
}

interface BlockIdentifier {
  index: number;
  hash: string;
}

export interface ConvertFilToEthResponse {
  address: string;
}

export interface FetchERC20TransactionsResponse {
  txs: ERC20Transfer[];
}

export interface ERC20Transfer {
  id: string;
  height: number;
  type: string;
  to: string;
  from: string;
  amount: string;
  contract_address: string;
  timestamp: number;
  tx_hash: string;
  tx_cid?: string;
}

export interface ERC20BalanceResponse {
  data: { balance: string; height: number }[];
}
