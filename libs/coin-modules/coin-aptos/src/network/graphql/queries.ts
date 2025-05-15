// We need to target CJS for the CJS build of the lib
import { gql } from "@apollo/client";

export const GetDelegatedStakingActivities = gql`
  query getDelegatedStakingActivities($delegatorAddress: String) {
    delegated_staking_activities(
      where: { delegator_address: { _eq: $delegatorAddress } }
      order_by: { transaction_version: asc }
    ) {
      amount
      delegator_address
      event_index
      event_type
      pool_address
      transaction_version
    }
  }
`;
export const GetAccountTransactionsData = gql`
  query GetAccountTransactionsData($address: String, $limit: Int) {
    account_transactions(
      where: { account_address: { _eq: $address } }
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
    account_transactions(
      where: { account_address: { _eq: $address }, transaction_version: { _gt: $gt } }
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
    account_transactions(
      where: { account_address: { _eq: $address }, transaction_version: { _lt: $lt } }
      order_by: { transaction_version: desc }
      limit: $limit
    ) {
      transaction_version
      __typename
    }
  }
`;
