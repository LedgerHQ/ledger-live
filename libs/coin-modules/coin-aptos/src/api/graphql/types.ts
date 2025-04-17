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

export type GetAccountTransactionsDataQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
}>;

export type GetAccountTransactionsDataQuery = {
  __typename?: "query_root";
  account_transactions: Array<{
    __typename?: "account_transactions";
    transaction_version: number;
  }>;
};

export type GetAccountTransactionsDataGtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  gt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataGtQuery = {
  __typename?: "query_root";
  account_transactions: Array<{
    __typename?: "account_transactions";
    transaction_version: number;
  }>;
};

export type GetAccountTransactionsDataLtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  lt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataLtQuery = {
  __typename?: "query_root";
  account_transactions: Array<{
    __typename?: "account_transactions";
    transaction_version: number;
  }>;
};

export type DelegatedStakingActivity = {
  amount: number;
  delegator_address: string;
  event_index: number;
  event_type: string;
  pool_address: string;
  transaction_version: bigint;
};

export type GetDelegatedStakingActivitiesQuery = {
  delegated_staking_activities: Array<DelegatedStakingActivity>;
};

export type PartitionedDelegatedStakingActivities = Record<string, DelegatedStakingActivity[]>;

export type StakePrincipals = {
  activePrincipals: number;
  pendingInactivePrincipals: number;
};

export type StakeDetails = {
  active: number;
  inactive: number;
  pendingInactive: number;
  canWithdrawPendingInactive: boolean;
  poolAddress: string;
};

export type GetNumActiveDelegatorPerPoolQuery = {
  __typename?: "query_root";
  num_active_delegator_per_pool: Array<{
    __typename?: "num_active_delegator_per_pool";
    pool_address: string;
    num_active_delegator: number;
  }>;
  delegated_staking_pools: Array<{
    __typename?: "delegated_staking_pools";
    staking_pool_address: string;
    current_staking_pool: {
      __typename?: "current_staking_pool";
      operator_address: string;
      operator_aptos_name: Array<{
        __typename?: "operator_aptos_name";
        domain: string;
        is_primary: boolean;
      }>;
    };
  }>;
};

export type GetCurrentDelegatorBalancesQuery = {
  __typename?: "query_root";
  current_delegator_balances: Array<{
    __typename?: "CurrentDelegatorBalance";
    current_pool_balance: {
      __typename?: "CurrentPoolBalance";
      total_coins: string; // Total coins in the pool
      operator_commission_percentage: string; // Percentage, potentially divided by 100
      staking_pool_address: string;
      total_shares: string;
      inactive_table_handle: string;
      last_transaction_version: string;
      active_table_handle: string;
    };
    shares: string; // The number of shares
    delegator_address: string;
    staking_pool_metadata: {
      __typename?: "StakingPoolMetadata";
      operator_aptos_name: {
        __typename?: "OperatorAptosName";
        subdomain: string;
        token_name: string;
        registered_address: string;
        domain_with_suffix: string;
        domain_expiration_timestamp: string;
        domain: string;
      };
    };
  }>;
};

export interface DelegationPoolAddress {
  staking_pool_address: string;
}

interface CurrentPoolBalance {
  __typename?: "CurrentPoolBalance";
  total_coins: string;
  operator_commission_percentage: string;
  staking_pool_address: string;
  total_shares: string;
  inactive_table_handle: string;
  last_transaction_version: string;
  active_table_handle: string;
}

interface StakingPoolMetadata {
  __typename?: "StakingPoolMetadata";
  operator_aptos_name: OperatorAptosName;
}

interface OperatorAptosName {
  __typename?: "OperatorAptosName";
  subdomain: string;
  token_name: string;
  registered_address: string;
  domain_with_suffix: string;
  domain_expiration_timestamp: string;
  domain: string | null;
}

export interface CurrentDelegatorBalance {
  __typename?: "CurrentDelegatorBalance";
  shares: string;
  delegator_address: string;
  current_pool_balance: CurrentPoolBalance;
  staking_pool_metadata: StakingPoolMetadata;
}
