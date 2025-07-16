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
