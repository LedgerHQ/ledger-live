export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  bigint: any;
  jsonb: any;
  numeric: any;
  timestamp: any;
  timestamptz: any;
};

export type GetAccountTransactionsDataQuery = {
  account_transactions: Array<{
    transaction_version: number;
  }>;
};

export type GetAccountTransactionsDataGtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  offset?: InputMaybe<Scalars["Int"]>;
  gt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataGtQuery = {
  account_transactions: Array<{
    transaction_version: number;
  }>;
};

export type StakeDetails = {
  active: number;
  inactive: number;
  pendingInactive: number;
  canWithdrawPendingInactive: boolean;
  poolAddress: string;
};

export type GetCurrentDelegatorBalancesQuery = {
  current_delegator_balances: Array<{
    current_pool_balance: {
      total_coins: string;
      operator_commission_percentage: string;
      staking_pool_address: string;
      total_shares: string;
    };
    shares: string;
    delegator_address: string;
    staking_pool_metadata: {
      operator_aptos_name: {
        domain_with_suffix: string;
        is_active: boolean;
      };
    };
  }>;
};

interface CurrentPoolBalance {
  total_coins: string;
  operator_commission_percentage: string;
  staking_pool_address: string;
  total_shares: string;
}

interface StakingPoolMetadata {
  operator_aptos_name: OperatorAptosName;
}

interface OperatorAptosName {
  domain_with_suffix: string;
  is_active: boolean;
}

export interface CurrentDelegatorBalance {
  shares: string;
  delegator_address: string;
  current_pool_balance: CurrentPoolBalance;
  staking_pool_metadata: StakingPoolMetadata;
}

export type TransactionVersion = {
  transaction_version: number;
};
