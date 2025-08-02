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
  account_transactions: Array<{
    transaction_version: number;
  }>;
};

export type GetAccountTransactionsDataGtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  gt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataGtQuery = {
  account_transactions: Array<{
    transaction_version: number;
  }>;
};

export type GetAccountTransactionsDataLtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  lt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataLtQuery = {
  account_transactions: Array<{
    transaction_version: number;
  }>;
};

export type DelegatedStakingActivity = {
  amount: number;
  delegator_address: string;
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
  num_active_delegator_per_pool: Array<{
    pool_address: string;
    num_active_delegator: number;
  }>;
  delegated_staking_pools: Array<{
    staking_pool_address: string;
    current_staking_pool: {
      operator_address: string;
      operator_aptos_name: Array<{
        domain: string;
        is_primary: boolean;
      }>;
    };
  }>;
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

export interface DelegationPoolAddress {
  staking_pool_address: string;
}

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
