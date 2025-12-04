import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

type FreezeStatus = "NOT_APPLICABLE" | "FROZEN" | "UNFROZEN";

type KycStatus = "NOT_APPLICABLE" | "GRANTED" | "REVOKED";

export interface HederaMirrorCoinTransfer {
  account: string;
  amount: number;
}

export interface HederaMirrorTokenTransfer {
  token_id: string;
  account: string;
  amount: number;
  is_approval?: boolean;
}

export interface HederaMirrorTransaction {
  transfers: HederaMirrorCoinTransfer[];
  token_transfers: HederaMirrorTokenTransfer[];
  staking_reward_transfers: HederaMirrorCoinTransfer[];
  charged_tx_fee: number;
  transaction_hash: string;
  transaction_id: string;
  consensus_timestamp: string;
  entity_id: string | null;
  result: string;
  name: string;
  memo_base64?: string;
}

export interface HederaMirrorToken {
  automatic_association: boolean;
  balance: number;
  created_timestamp: string;
  decimals: number;
  token_id: string;
  freeze_status: FreezeStatus;
  kyc_status: KycStatus;
}

export interface HederaMirrorAccount {
  account: string;
  max_automatic_token_associations: number;
  staked_node_id: number | null;
  pending_reward: number;
  balance: {
    balance: number;
    timestamp: string;
    tokens: {
      token_id: string;
      balance: number;
    }[];
  };
}

export interface HederaMirrorAccountTokensResponse {
  tokens: HederaMirrorToken[];
  links: {
    next: string | null;
  };
}

export interface HederaMirrorAccountsResponse {
  accounts: HederaMirrorAccount[];
  links: {
    next: string | null;
  };
}

export interface HederaMirrorTransactionsResponse {
  transactions: HederaMirrorTransaction[];
  links: {
    next: string | null;
  };
}

export interface HederaMirrorNetworkFees {
  fees: {
    gas: number;
    transaction_type: "ContractCall" | "ContractCreate" | "EthereumTransaction";
  }[];
  timestamp: string;
}

export interface HederaMirrorContractCallResult {
  contract_id: string;
  block_gas_used: number;
  gas_consumed: number;
  gas_limit: number;
  gas_used: number;
  timestamp: string;
}

export interface HederaERC20TokenBalance {
  token: TokenCurrency;
  balance: BigNumber;
}

export interface HederaMirrorContractCallEstimate {
  result: string;
}

export interface HederaMirrorContractCallBalance {
  result: string;
}

export interface HederaMirrorNode {
  node_id: number;
  node_account_id: string;
  description: string;
  max_stake: number;
  min_stake: number;
  stake: number;
  stake_rewarded: number;
  reward_rate_start: number;
}

export interface HederaMirrorNodesResponse {
  nodes: HederaMirrorNode[];
  links: {
    next: string | null;
  };
}
