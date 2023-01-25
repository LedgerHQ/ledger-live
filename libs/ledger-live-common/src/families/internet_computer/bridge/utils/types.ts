import { SubmitResponse } from "@dfinity/agent";

export interface BlockHeightResponse {
  current_block_identifier: BlockIdentifier;
  current_block_timestamp: number;
  genesis_block_identifier: BlockIdentifier;
  sync_status: Syncstatus;
  peers: any[];
}

interface BlockIdentifier {
  index: number;
  hash: string;
}

export interface GetBalancesResponse {
  block_identifier: BlockIdentifier;
  balances: Balance[];
  details?: { error_message: string };
}

interface Balance {
  value: string;
  currency: Currency;
}

interface Currency {
  symbol: string;
  decimals: number;
}

interface Syncstatus {
  current_index: number;
  target_index: number;
}

export interface GetTxnsHistoryResponse {
  transactions: {
    block_identifier: BlockIdentifier;
    transaction: {
      transaction_identifier: Transactionidentifier;
      operations: Operation[];
      metadata: {
        block_height: number;
        memo: number;
        timestamp: number;
      };
    };
  }[];
  total_count: number;
}

export interface Operation {
  operation_identifier: {
    index: number;
  };
  type: string;
  status?: string;
  account: AccountIdentifier;
  amount: Balance;
  metadata?: {
    block_index: number;
    transaction_identifier: Transactionidentifier;
  };
}

export interface BroadcastResult extends SubmitResponse {
  txnHash?: string;
  blockHeight?: string;
}

export interface ConstructionPayloadsRequest {
  network_identifier: NetworkIdentifier;
  operations: Operation[];
  metadata?: Metadata;
  public_keys: Publickey[];
}

export interface Publickey {
  hex_bytes: string;
  curve_type: string;
}

export interface Metadata {
  memo?: number;
  created_at?: number;
  ingress_end?: number;
  ingress_start?: number;
}

interface Currency {
  symbol: string;
  decimals: number;
}

interface NetworkIdentifier {
  blockchain: string;
  network: string;
}

export interface ConstructionPayloadsResponse {
  unsigned_transaction: string;
  payloads: {
    account_identifier: AccountIdentifier;
    hex_bytes: string;
    signature_type: string;
  }[];
}

interface AccountIdentifier {
  address: string;
}

export interface ConstructionParseRequest {
  network_identifier: NetworkIdentifier;
  signed: boolean;
  transaction: string;
}

export interface ConstructionParseResponse {
  operations: Operation[];
  account_identifier_signers: any[];
}

export interface ConstructionCombineRequest {
  network_identifier: NetworkIdentifier;
  unsigned_transaction: string; // cbor
  signatures: Signature[];
}

export interface Signature {
  signing_payload: {
    account_identifier: AccountIdentifier;
    hex_bytes: string;
    signature_type: string;
  };
  public_key: Publickey;
  signature_type: string;
  hex_bytes: string;
}

export interface ConstructionCombineResponse {
  signed_transaction: string;
}

export interface ConstructionSubmitRequest {
  network_identifier: NetworkIdentifier;
  signed_transaction: string;
}
export interface ConstructionSubmitResponse {
  transaction_identifier: Transactionidentifier;
  metadata: {
    operations: Operation[];
  };
}

interface Transactionidentifier {
  hash: string;
}

export interface ConstructionHashRequest {
  network_identifier: NetworkIdentifier;
  signed_transaction: string;
}

export interface ConstructionHashResponse {
  transaction_identifier: Transactionidentifier;
}
