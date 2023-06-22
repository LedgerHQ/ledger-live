import { StacksMainnet, StacksTestnet } from "@stacks/network";

export const StacksNetwork = {
  mainnet: new StacksMainnet(),
  testnet: new StacksTestnet(),
};

export interface EstimatedFeesRequest {
  to: string;
  from: string;
}

export type EstimatedFeesResponse = number;

export interface TransactionsResponse {
  limit: number;
  offset: number;
  total: number;
  results: TransactionResponse[];
}

export interface TransactionResponse {
  tx: {
    tx_id: string;
    nonce: number;
    tx_status: string;
    tx_type: string;
    fee_rate: string;
    sender_address: string;
    sponsored: boolean;
    block_hash: string;
    block_height: number;
    tx_index: number;
    burn_block_time: number;
    token_transfer: {
      recipient_address: string;
      amount: string;
      memo: string;
    };
  };
  stx_transfers: {
    amount: string;
    sender: string;
    recipient: string;
  }[];
}

export interface MempoolTransaction {
  tx_id: string;
  nonce: number;
  tx_status: string;
  tx_type: string;
  receipt_time: number;
  receipt_time_iso: string;
  fee_rate: string;
  sender_address: string;
  sponsored: boolean;
  token_transfer: {
    recipient_address: string;
    amount: string;
    memo: string;
  };
}

export interface MempoolResponse {
  limit: number;
  offset: number;
  total: number;
  results: MempoolTransaction[];
}

export interface GetNonceResponse {
  last_mempool_tx_nonce: number;
  last_executed_tx_nonce: number;
  possible_next_nonce: number;
  detected_missing_nonces: number[];
}

export interface BalanceResponse {
  balance: string;
}

export interface NetworkStatusResponse {
  server_version: string;
  status: string;
  chain_tip: BlockIdentifier;
}

export type BroadcastTransactionRequest = Buffer;

export type BroadcastTransactionResponse = string;

interface BlockIdentifier {
  block_height: number;
  block_hash: string;
}
