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

/**
 * Current `SuiSystemStateInnerV2` as parsed JSON: enumerates active
 * validators and builds the pool_id → validator_address map. The struct
 * is large (~127 validators × ~25 fields) but identical for every account
 * synced in the same epoch — cacheable for the epoch duration.
 */
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
