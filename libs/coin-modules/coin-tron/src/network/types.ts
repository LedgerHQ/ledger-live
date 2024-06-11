import { TrongridTxType } from "../types";

type Ret = {
  contractRet: string; // Better to have an exhaustive list: "STRING" + ?
  fee?: number;
};

type TransactionRawData<T> = {
  contract: Contract<T>[];
  ref_block_bytes: string;
  ref_block_hash: string;
  expiration: number;
  timestamp?: number;
  fee_limit?: number;
  data?: string;
};

export type TransactionResponseTronAPI<T> = {
  data: T[];
  success: boolean;
  meta: {
    at: number;
    page_size: number;
    links?: {
      next: string;
    };
  };
};

type Contract<T> = {
  parameter: {
    value: T;
    type_url: string;
  };
  type: TrongridTxType;
};

//-- TRANSACTION
export type TransactionTronAPI<T = TransactionContract> = {
  ret: Ret[];
  signature: string[];
  txID: string;
  tx_id?: string; // Not found in request to TronGrid...
  net_usage: number;
  raw_data_hex: string;
  net_fee: number;
  energy_usage: number;
  blockNumber?: number;
  block_timestamp: number;
  energy_fee: number;
  energy_usage_total: number;
  unfreeze_amount?: number;
  withdraw_amount?: number;
  raw_data: TransactionRawData<T>;
  internal_transactions: any[];
};

type Vote = {
  vote_address: string;
  vote_count: number;
};
type TransactionContract = {
  owner_address: string;
  votes?: Vote[];
  resource: any;
  frozen_balance?: number;
  amount?: number;
  to_address?: string;
  data?: string;
  contract_address?: string;
  asset_name?: string;
  frozen_duration?: number;
  resource_type?: "BANDWIDTH" | "ENERGY";
  resource_value?: number;
  quant?: number;
  receiver_address?: string;
  unfreeze_balance?: number;
  balance?: number;
};

//-- Transaction details
export type TransactionInfoTronAPI = {
  id: string;
  fee: number;
  blockNumber: number;
  blockTimeStamp: number;
  contractResult: string[];
  receipt: {
    net_usage?: number;
    net_fee?: number;
  };
};

//-- TRC20
export type Trc20API = {
  transaction_id: string;
  token_info: TokenInfo;
  block_timestamp: number;
  from: string;
  to: string;
  detail: TransactionTronAPI<Trc20Contract>;
  type: string;
  value?: string;
};

type TokenInfo = {
  symbol: string;
  address?: string;
  decimals: number;
  name: string;
};

type Trc20Contract = {
  data: string;
  owner_address: string;
  contract_address: string;
};
