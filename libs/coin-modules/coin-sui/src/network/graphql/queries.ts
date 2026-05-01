/**
 * Hand-written GraphQL documents (typed via `gql.tada`); each export is
 * paired with a runtime mapper in `sdk.ts` that re-shapes the response to
 * the existing JSON-RPC types so downstream callers stay untouched.
 */
import { graphql, type ResultOf } from "./tada";

/**
 * Checkpoint by sequence number; `null` returns the latest. Unlike
 * JSON-RPC `sui_getCheckpoint`, GraphQL only accepts a UInt53 — digest
 * lookups must stay on JSON-RPC for now.
 */
export const CHECKPOINT_BY_SEQUENCE = graphql(`
  query CheckpointBySequence($sequenceNumber: UInt53) {
    checkpoint(sequenceNumber: $sequenceNumber) {
      digest
      sequenceNumber
      timestamp
    }
  }
`);

export type CheckpointBySequenceResult = ResultOf<typeof CHECKPOINT_BY_SEQUENCE>;

/** Latest checkpoint's sequence number (`sui_getLatestCheckpointSequenceNumber` equivalent). */
export const LATEST_CHECKPOINT_SEQUENCE = graphql(`
  query LatestCheckpointSequence {
    checkpoint {
      sequenceNumber
    }
  }
`);

export type LatestCheckpointSequenceResult = ResultOf<typeof LATEST_CHECKPOINT_SEQUENCE>;

/**
 * All `StakedSui` (`0x3::staking_pool::StakedSui`) Move objects owned by
 * an address. Contents come back as parsed JSON via `MoveValue.json` —
 * no BCS decoder needed. Mapper joins `pool_id` against the system-state
 * pool→validator map to build `DelegatedStake[]`.
 */
export const STAKED_SUI_OBJECTS_BY_OWNER = graphql(`
  query StakedSuiObjects($owner: SuiAddress!, $first: Int, $after: String) {
    address(address: $owner) {
      objects(filter: { type: "0x3::staking_pool::StakedSui" }, first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          contents {
            json
          }
        }
      }
    }
  }
`);

export type StakedSuiObjectsResult = ResultOf<typeof STAKED_SUI_OBJECTS_BY_OWNER>;

/** Current `SuiSystemStateInnerV2` as parsed JSON; enumerates active validators. */
export const SUI_SYSTEM_STATE = graphql(`
  query SuiSystemState {
    epoch {
      epochId
      systemState {
        json
      }
    }
  }
`);

export type SuiSystemStateResult = ResultOf<typeof SUI_SYSTEM_STATE>;

/**
 * One entry of a pool's `exchange_rates` Move Table at a given epoch
 * (server-parsed via `literal`, no BCS). Used for per-stake reward and
 * per-validator APY. `null` when the table has no entry at that epoch —
 * caller must degrade gracefully (zero reward / zero APY).
 */
export const EXCHANGE_RATE_AT_EPOCH = graphql(`
  query ExchangeRateAtEpoch($table: SuiAddress!, $literal: String!) {
    address(address: $table) {
      dynamicField(name: { literal: $literal }) {
        value {
          __typename
          ... on MoveValue {
            json
          }
        }
      }
    }
  }
`);

export type ExchangeRateAtEpochResult = ResultOf<typeof EXCHANGE_RATE_AT_EPOCH>;

/**
 * 15-aliased batch of {@link EXCHANGE_RATE_AT_EPOCH}: collapses 15 lookups
 * into one HTTP round-trip via GraphQL aliasing. Fixed-N (gql.tada
 * validates static docs only) — full chunks of {@link EXCHANGE_RATE_AT_EPOCH}-
 * sized requests use this; smaller tail chunks fall back to parallel
 * single-query calls. Variable count and alias count must stay in sync
 * with `RATE_BATCH_CHUNK_SIZE` in `./constants.ts`.
 */
// @ts-expect-error TS2589 — gql.tada's type-instantiation depth overflows for 15 aliases.
// SAFETY: structurally identical to 15× EXCHANGE_RATE_AT_EPOCH; tsc width limit, not a
// correctness issue. Drift is caught at runtime via `parseExchangeRateNode` →
// `isExchangeRateJson`. Alias count vs `RATE_BATCH_CHUNK_SIZE` is asserted in `utils.test.ts`.
// prettier-ignore
export const BATCH_RATES_15 = graphql(`
  query BatchExchangeRates(
    $t0: SuiAddress!, $l0: String!,
    $t1: SuiAddress!, $l1: String!,
    $t2: SuiAddress!, $l2: String!,
    $t3: SuiAddress!, $l3: String!,
    $t4: SuiAddress!, $l4: String!,
    $t5: SuiAddress!, $l5: String!,
    $t6: SuiAddress!, $l6: String!,
    $t7: SuiAddress!, $l7: String!,
    $t8: SuiAddress!, $l8: String!,
    $t9: SuiAddress!, $l9: String!,
    $t10: SuiAddress!, $l10: String!,
    $t11: SuiAddress!, $l11: String!,
    $t12: SuiAddress!, $l12: String!,
    $t13: SuiAddress!, $l13: String!,
    $t14: SuiAddress!, $l14: String!
  ) {
    v0: address(address: $t0) { dynamicField(name: { literal: $l0 }) { value { __typename ... on MoveValue { json } } } }
    v1: address(address: $t1) { dynamicField(name: { literal: $l1 }) { value { __typename ... on MoveValue { json } } } }
    v2: address(address: $t2) { dynamicField(name: { literal: $l2 }) { value { __typename ... on MoveValue { json } } } }
    v3: address(address: $t3) { dynamicField(name: { literal: $l3 }) { value { __typename ... on MoveValue { json } } } }
    v4: address(address: $t4) { dynamicField(name: { literal: $l4 }) { value { __typename ... on MoveValue { json } } } }
    v5: address(address: $t5) { dynamicField(name: { literal: $l5 }) { value { __typename ... on MoveValue { json } } } }
    v6: address(address: $t6) { dynamicField(name: { literal: $l6 }) { value { __typename ... on MoveValue { json } } } }
    v7: address(address: $t7) { dynamicField(name: { literal: $l7 }) { value { __typename ... on MoveValue { json } } } }
    v8: address(address: $t8) { dynamicField(name: { literal: $l8 }) { value { __typename ... on MoveValue { json } } } }
    v9: address(address: $t9) { dynamicField(name: { literal: $l9 }) { value { __typename ... on MoveValue { json } } } }
    v10: address(address: $t10) { dynamicField(name: { literal: $l10 }) { value { __typename ... on MoveValue { json } } } }
    v11: address(address: $t11) { dynamicField(name: { literal: $l11 }) { value { __typename ... on MoveValue { json } } } }
    v12: address(address: $t12) { dynamicField(name: { literal: $l12 }) { value { __typename ... on MoveValue { json } } } }
    v13: address(address: $t13) { dynamicField(name: { literal: $l13 }) { value { __typename ... on MoveValue { json } } } }
    v14: address(address: $t14) { dynamicField(name: { literal: $l14 }) { value { __typename ... on MoveValue { json } } } }
  }
`);

export type BatchRates15Result = ResultOf<typeof BATCH_RATES_15>;
