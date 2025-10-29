import { gql } from "@apollo/client";

export const GetAccountTransactionsData = gql`
  query GetAccountTransactionsData($address: String, $limit: Int, $offset: Int) {
    account_transactions(
      where: { account_address: { _eq: $address } }
      limit: $limit
      offset: $offset
    ) {
      transaction_version
      __typename
    }
  }
`;

export const GetAccountTransactionsDataGt = gql`
  query GetAccountTransactionsDataGt($address: String, $limit: Int, $gt: bigint, $offset: Int) {
    account_transactions(
      where: { account_address: { _eq: $address }, transaction_version: { _gt: $gt } }
      limit: $limit
      offset: $offset
    ) {
      transaction_version
      __typename
    }
  }
`;

export const GetCurrentDelegatorBalancesData = gql`
  query GetCurrentDelegatorBalances {
    current_delegator_balances(distinct_on: pool_address) {
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
