import gql from "graphql-tag";
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

export type GetAccountTransactionsDataGtQueryVariables = Exact<{
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

export const GetAccountTransactionsData = gql`
  query GetAccountTransactionsData($address: String, $limit: Int) {
    address_version_from_move_resources(
      where: { address: { _eq: $address } }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      transaction_version
      __typename
    }
  }
`;
export const GetAccountTransactionsDataGt = gql`
  query GetAccountTransactionsDataGt($address: String, $limit: Int, $gt: bigint) {
    address_version_from_move_resources(
      where: { address: { _eq: $address }, transaction_version: { _gt: $gt } }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      transaction_version
      __typename
    }
  }
`;
export const GetAccountTransactionsDataLt = gql`
  query GetAccountTransactionsDataLt($address: String, $limit: Int, $lt: bigint) {
    address_version_from_move_resources(
      where: { address: { _eq: $address }, transaction_version: { _lt: $lt } }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      transaction_version
      __typename
    }
  }
`;
