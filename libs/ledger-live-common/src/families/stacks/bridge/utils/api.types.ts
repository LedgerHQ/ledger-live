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
    fee_rate: string;
    sender_address: string;
    sponsored: boolean;
    post_condition_mode: string;
    post_conditions: Array<{
      type: string;
      condition_code: string;
      amount: string;
      principal: {
        type_id: string;
        address: string;
      };
    }>;
    anchor_mode: string;
    is_unanchored: boolean;
    block_hash: string;
    parent_block_hash: string;
    block_height: number;
    block_time: number;
    block_time_iso: string;
    burn_block_time: number;
    burn_block_time_iso: string;
    parent_burn_block_time: number;
    parent_burn_block_time_iso: string;
    canonical: boolean;
    tx_index: number;
    tx_status: string;
    tx_result: {
      hex: string;
      repr: string;
    };
    microblock_hash: string;
    microblock_sequence: number;
    microblock_canonical: boolean;
    event_count: number;
    events: Array<any>;
    execution_cost_read_count: number;
    execution_cost_read_length: number;
    execution_cost_runtime: number;
    execution_cost_write_count: number;
    execution_cost_write_length: number;
    tx_type: "token_transfer" | "contract_call";
    token_transfer?: {
      recipient_address: string;
      amount: string;
      memo: string;
    };
    smart_contract?: {
      clarity_version: number;
      contract_id: string;
      source_code: string;
    };
    contract_call?: {
      contract_id: string;
      function_name: string;
      function_signature: string;
      function_args: Array<{
        hex: string;
        repr: string;
        name: string;
        type: string;
      }>;
    };
  };
  stx_sent: string;
  stx_received: string;
  events: {
    stx: {
      transfer: number;
      mint: number;
      burn: number;
    };
    ft: {
      transfer: number;
      mint: number;
      burn: number;
    };
    nft: {
      transfer: number;
      mint: number;
      burn: number;
    };
  };
}

export interface DecodedSendManyFunctionArgsCV {
  type: string;
  value: Array<{
    type: string;
    value: {
      memo?: {
        type: string;
        value: string;
      };
      to: {
        type: string;
        value: string;
      };
      ustx: {
        type: string;
        value: string;
      };
    };
  }>;
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
