import { MoveFunctionId } from "@aptos-labs/ts-sdk";

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
  address_version_from_move_resources: Array<{
    __typename: "address_version_from_move_resources";
    transaction_version?: any | null;
  }>;
};

export type FungibleAssetActivity = {
  type: MoveFunctionId;
  asset_type: MoveFunctionId;
  amount: number;
  block_height: number;
  is_gas_fee: boolean;
  is_transaction_success: boolean;
  transaction_timestamp: Date;
  transaction_version: number;
  event_index: number;
  owner_address: string;
  gas_fee_payer_address: string;
};

export type CoinActivity = {
  activity_type: MoveFunctionId;
  coin_type: MoveFunctionId;
  is_transaction_success: boolean;
  is_gas_fee: boolean;
  amount: number;
  transaction_version: number;
  transaction_timestamp: Date;
  block_height: number;
  event_index: number;
  owner_address: string;
  event_account_address: string;
};

export type TokenV2Activity = {
  amount: number;
};

export type UserTransaction = {
  block_height: number;
  gas_unit_price: number;
};

export type GetAccountTransactionsV2DataQuery = {
  account_transactions: Array<{
    account_address: string;
    transaction_version: number;
    user_transaction: UserTransaction;
    fungible_asset_activities: FungibleAssetActivity[];
    coin_activities: CoinActivity[];
    token_activities_v2: TokenV2Activity[];
    delegated_staking_activities: DelegatedStakingActivity[];
  }>;
};

export type GetAccountTransactionsDataGtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  gt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsV2DataQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  gt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataGtQuery = {
  __typename?: "query_root";
  address_version_from_move_resources: Array<{
    __typename: "address_version_from_move_resources";
    transaction_version?: any | null;
  }>;
};

export type GetAccountTransactionsDataLtQueryVariables = Exact<{
  address?: InputMaybe<Scalars["String"]>;
  limit?: InputMaybe<Scalars["Int"]>;
  lt?: InputMaybe<Scalars["bigint"]>;
}>;

export type GetAccountTransactionsDataLtQuery = {
  __typename?: "query_root";
  address_version_from_move_resources: Array<{
    __typename: "address_version_from_move_resources";
    transaction_version?: any | null;
  }>;
};

export type DelegatedStakingActivity = {
  amount: number;
  delegator_address: string;
  event_index: number;
  event_type: MoveFunctionId;
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
