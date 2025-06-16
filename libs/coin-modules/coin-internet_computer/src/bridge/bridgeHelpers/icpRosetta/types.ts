import { SubmitResponse } from "@dfinity/agent";

export interface ICPRosettaBlockHeightResponse {
  current_block_identifier: ICPRosettaBlockIdentifier;
  current_block_timestamp: number;
  genesis_block_identifier: ICPRosettaBlockIdentifier;
  sync_status: ICPRosettaSyncstatus;
  peers: any[];
}

interface ICPRosettaBlockIdentifier {
  index: number;
  hash: string;
}

export interface ICPRosettaGetBalancesResponse {
  block_identifier: ICPRosettaBlockIdentifier;
  balances: ICPRosettaBalance[];
  details?: { error_message: string };
}

interface ICPRosettaBalance {
  value: string;
  currency: ICPRosettaCurrency;
}

interface ICPRosettaCurrency {
  symbol: string;
  decimals: number;
}

interface ICPRosettaSyncstatus {
  current_index: number;
  target_index: number;
}

export interface ICPRosettaGetTxnsHistoryResponse {
  transactions: {
    block_identifier: ICPRosettaBlockIdentifier;
    transaction: {
      transaction_identifier: ICPRosettaTransactionidentifier;
      operations: ICPRosettaICPRosettaOperation[];
      metadata: {
        block_height: number;
        memo: number;
        timestamp: number;
      };
    };
  }[];
  total_count: number;
}

export interface ICPRosettaICPRosettaOperation {
  operation_identifier: {
    index: number;
  };
  type: string;
  status?: string;
  account: ICPRosettaAccountIdentifier;
  amount: ICPRosettaBalance;
  metadata?: {
    block_index: number;
    transaction_identifier: ICPRosettaTransactionidentifier;
  };
}

export interface ICPRosettaConstructionPayloadsRequest {
  network_identifier: ICPRosettaNetworkIdentifier;
  operations: ICPRosettaICPRosettaOperation[];
  metadata?: ICPRosettaMetadata;
  public_keys: ICPRosettaPublickey[];
}

export interface ICPRosettaPublickey {
  hex_bytes: string;
  curve_type: string;
}

export interface ICPRosettaMetadata {
  memo?: number;
  created_at?: number;
  ingress_end?: number;
  ingress_start?: number;
}

interface ICPRosettaCurrency {
  symbol: string;
  decimals: number;
}

interface ICPRosettaNetworkIdentifier {
  blockchain: string;
  network: string;
}

export interface ICPRosettaConstructionPayloadsResponse {
  unsigned_transaction: string;
  payloads: {
    account_identifier: ICPRosettaAccountIdentifier;
    hex_bytes: string;
    signature_type: string;
  }[];
}

interface ICPRosettaAccountIdentifier {
  address: string;
}

export interface ICPRosettaConstructionCombineRequest {
  network_identifier: ICPRosettaNetworkIdentifier;
  unsigned_transaction: string; // cbor
  signatures: ICPRosettaSignature[];
}

export interface ICPRosettaSignature {
  signing_payload: {
    account_identifier: ICPRosettaAccountIdentifier;
    hex_bytes: string;
    signature_type: string;
  };
  public_key: ICPRosettaPublickey;
  signature_type: string;
  hex_bytes: string;
}

export interface ICPRosettaConstructionCombineResponse {
  signed_transaction: string;
}

export interface ICPRosettaConstructionSubmitRequest {
  network_identifier: ICPRosettaNetworkIdentifier;
  signed_transaction: string;
}
export interface ICPRosettaConstructionSubmitResponse {
  transaction_identifier: ICPRosettaTransactionidentifier;
  metadata: {
    operations: ICPRosettaICPRosettaOperation[];
  };
}

interface ICPRosettaTransactionidentifier {
  hash: string;
}

export interface ICPRosettaConstructionHashRequest {
  network_identifier: ICPRosettaNetworkIdentifier;
  signed_transaction: string;
}

export interface ICPRosettaConstructionHashResponse {
  transaction_identifier: ICPRosettaTransactionidentifier;
}

export interface ICPRosettaBroadcastResult extends SubmitResponse {
  txnHash?: string;
  blockHeight?: string;
}

export interface ICPRosettaConstructionDeriveRequest {
  network_identifier: ICPRosettaNetworkIdentifier;
  public_key: ICPRosettaPublickey;
}

export interface ICPRosettaConstructionDeriveResponse {
  account_identifier: ICPRosettaAccountIdentifier;
}
