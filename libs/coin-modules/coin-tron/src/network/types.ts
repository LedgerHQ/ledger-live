import { TrongridTxType } from "../types";

/**
 * TronProtocol Account datamodel.
 * Beware as `address` property is NOT base58 encoded.
 */
export type AccountTronAPI = {
  // Be careful as the address in NOT base58 encoded
  address: string;
  account_name?: string;
  balance?: number;
  account_resource?: {
    delegated_frozenV2_balance_for_energy?: number;
    frozen_balance_for_energy?: {
      frozen_balance: number;
      expire_time: number;
    };
  };
  delegated_frozenV2_balance_for_bandwidth?: number;
  frozen?: {
    frozen_balance: number;
    expire_time: number;
  }[];
  frozenV2?: {
    type?: "ENERGY" | "TRON_POWER" | string;
    amount?: number;
  }[];
  latest_withdraw_time?: number;
  unfrozenV2?: {
    type?: "ENERGY" | string;
    unfreeze_amount: number;
    unfreeze_expire_time: number;
  }[];
  votes?: {
    vote_address: string;
    vote_count: number;
  }[];
  // TRC10
  assetV2?: {
    key: string;
    value: number;
  }[];
  trc20: Record<string, string>[];
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
  block_timestamp: number;
  blockNumber?: number;
  energy_fee: number;
  energy_usage_total: number;
  unfreeze_amount?: number;
  withdraw_amount?: number;
  raw_data: TransactionRawData<T>;
  internal_transactions: any[];
};

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

type Contract<T> = {
  parameter: {
    value: T;
    type_url: string;
  };
  type: TrongridTxType;
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

export function isTransactionTronAPI(tx: unknown): tx is TransactionTronAPI {
  return (tx as TransactionTronAPI).txID !== undefined;
}

//-- TRC20
export type Trc20API = {
  transaction_id: string;
  token_info: TokenInfo;
  block_timestamp: number;
  from: string;
  to: string;
  detail: TransactionTronAPI<Trc20Contract>;
  type: "Approval" | "Transfer";
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

//-- Malformed?
export type MalformedTransactionTronAPI = {
  internal_tx_id: string;
  data: {
    note: string;
    rejected: boolean;
    call_value: {
      _: number;
    };
  };
  block_timestamp: number;
  to_address: string;
  tx_id: string;
  from_address: string;
};

export type Block = {
  height: number;
  hash: string;
  time?: Date;
};

export function isMalformedTransactionTronAPI(
  tx: TransactionTronAPI | MalformedTransactionTronAPI,
): tx is MalformedTransactionTronAPI {
  return (
    (tx as MalformedTransactionTronAPI).internal_tx_id !== undefined ||
    (tx as MalformedTransactionTronAPI).tx_id !== undefined
  );
}
