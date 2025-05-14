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
export const GetAccountTransactionsV2Data = gql`
  query GetAccountTransactionsV2Data($address: String, $limit: Int) {
    account_transactions(
      where: { account_address: { _eq: $address } }
      limit: $limit
      order_by: { transaction_version: desc }
    ) {
      account_address
      transaction_version
      user_transaction {
        block_height
        gas_unit_price
      }
      fungible_asset_activities {
        amount
        asset_type
        gas_fee_payer_address
        block_height
        is_gas_fee
        is_transaction_success
        transaction_timestamp
        transaction_version
        type
        event_index
      }
      coin_activities {
        amount
        activity_type
        coin_type
        transaction_version
        is_transaction_success
        is_gas_fee
        owner_address
        transaction_timestamp
        block_height
      }
      token_activities_v2 {
        is_fungible_v2
        token_amount
        transaction_timestamp
        transaction_version
        type
      }
      token_activities {
        coin_type
        from_address
        token_amount
        to_address
        transaction_timestamp
        transaction_version
        transfer_type
        coin_amount
      }
      delegated_staking_activities {
        amount
        pool_address
        transaction_version
        delegator_address
        event_type
      }
    }
  }
`;
