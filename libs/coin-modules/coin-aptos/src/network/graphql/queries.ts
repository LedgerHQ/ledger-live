import { gql } from "@apollo/client";

export const GetDelegatedStakingActivities = gql`
  query getDelegatedStakingActivities($delegatorAddress: String) {
    delegated_staking_activities(
      where: { delegator_address: { _eq: $delegatorAddress } }
      order_by: { transaction_version: asc }
    ) {
      amount
      delegator_address
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

export const GetNumActiveDelegatorPerPoolData = gql`
  query GetNumActiveDelegatorPerPoolData {
    num_active_delegator_per_pool {
      num_active_delegator
      pool_address
    }
    delegated_staking_pools {
      staking_pool_address
      current_staking_pool {
        operator_address
        operator_aptos_name(where: { is_active: { _eq: true } }) {
          domain
          is_primary
        }
      }
    }
  }
`;

export const GetCurrentDelegatorBalancesData = gql`
  query GetCurrentDelegatorBalances {
    current_delegator_balances(
      distinct_on: pool_address
      order_by: { current_pool_balance: { total_coins: desc }, pool_address: asc }
    ) {
      current_pool_balance {
        total_coins
        operator_commission_percentage
        staking_pool_address
        total_shares
      }
      shares
      delegator_address
      staking_pool_metadata {
        operator_aptos_name {
          domain_with_suffix
          is_active
        }
      }
    }
  }
`;
