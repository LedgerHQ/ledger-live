/**
 * Hand-written GraphQL documents used by the GraphQL transport for the SUI
 * data calls that have no high-level method on `SuiGraphQLClient`. The typed
 * `graphql` tag below is bound to the SUI production schema introspection
 * (see `./tada.ts`) so field names, arguments, and result shapes are
 * checked by the TypeScript compiler.
 *
 * Each export is paired with a thin runtime mapper in `sdk.ts` that turns
 * the GraphQL response into the same shape the existing JSON-RPC code
 * paths produce, keeping downstream callers untouched during migration.
 */
import { graphql, type ResultOf } from "./tada";

/**
 * Fetch a single checkpoint by sequence number. Passing `null` (or omitting
 * the variable) returns the latest checkpoint.
 *
 * Behavioural difference vs. JSON-RPC `sui_getCheckpoint({ id })`:
 *   - JSON-RPC accepted either a sequence number string OR a digest.
 *   - GraphQL `Query.checkpoint(sequenceNumber:)` only accepts UInt53.
 *
 * Digest-based lookups are not migrated in this PR; callers that pass a
 * digest must continue to use the JSON-RPC transport (see
 * `getCheckpointFromGraphQL` in `../sdk.ts` for the guard).
 */
export const CHECKPOINT_BY_SEQUENCE = graphql(`
  query CheckpointBySequence($sequenceNumber: UInt53) {
    checkpoint(sequenceNumber: $sequenceNumber) {
      digest
      sequenceNumber
      timestamp
      networkTotalTransactions
      previousCheckpointDigest
      epoch {
        epochId
      }
    }
  }
`);

export type CheckpointBySequenceResult = ResultOf<typeof CHECKPOINT_BY_SEQUENCE>;

/**
 * Fetch the latest checkpoint's sequence number. Equivalent to JSON-RPC
 * `sui_getLatestCheckpointSequenceNumber`. Implemented as `checkpoint()`
 * with no args, returning only the field we need.
 */
export const LATEST_CHECKPOINT_SEQUENCE = graphql(`
  query LatestCheckpointSequence {
    checkpoint {
      sequenceNumber
    }
  }
`);

export type LatestCheckpointSequenceResult = ResultOf<typeof LATEST_CHECKPOINT_SEQUENCE>;

/**
 * Fetch all `StakedSui` Move objects owned by an address. The contents come
 * back as already-parsed JSON via `MoveValue.json` — no BCS decoder needed.
 *
 * Move struct (`0x3::staking_pool::StakedSui`):
 *   { id, pool_id, stake_activation_epoch, principal }
 *
 * The mapper in `./mappers.ts` joins `pool_id` against the system-state
 * pool→validator map to produce JSON-RPC's `DelegatedStake[]` shape.
 */
export const STAKED_SUI_OBJECTS_BY_OWNER = graphql(`
  query StakedSuiObjects($owner: SuiAddress!, $first: Int, $after: String) {
    address(address: $owner) {
      objects(
        filter: { type: "0x3::staking_pool::StakedSui" }
        first: $first
        after: $after
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          address
          version
          digest
          contents {
            type { repr }
            json
          }
        }
      }
    }
  }
`);

export type StakedSuiObjectsResult = ResultOf<typeof STAKED_SUI_OBJECTS_BY_OWNER>;

/**
 * Fetch the current epoch's full `SuiSystemStateInnerV2` Move struct as
 * parsed JSON. Used to enumerate active validators and to build the
 * pool_id → validator_address map needed by stake mapping.
 *
 * The Move struct is large (~127 active validators × ~25 fields each),
 * but is fetched in a single query and is identical for every account
 * synced in the same epoch — callers may cache for the epoch duration.
 */
export const SUI_SYSTEM_STATE = graphql(`
  query SuiSystemState {
    epoch {
      epochId
      referenceGasPrice
      systemState { json }
    }
  }
`);

export type SuiSystemStateResult = ResultOf<typeof SUI_SYSTEM_STATE>;

/**
 * Look up a single entry of a pool's `exchange_rates` Move Table at a given
 * epoch. Used both to compute per-stake `estimatedReward` (rate at the
 * stake's activation epoch) and per-validator APY (rate ~30 epochs ago).
 *
 * The server parses the `literal` argument server-side (e.g. `"1234u64"`),
 * so the client never has to BCS-encode anything. Returns the parsed
 * `PoolTokenExchangeRate` Move struct as JSON:
 *   { sui_amount: string, pool_token_amount: string }
 *
 * Returns `null` if the table has no entry at that epoch — the caller
 * must treat that as a missing data point and degrade gracefully (zero
 * reward / zero APY) rather than failing the whole sync.
 */
export const EXCHANGE_RATE_AT_EPOCH = graphql(`
  query ExchangeRateAtEpoch($table: SuiAddress!, $literal: String!) {
    address(address: $table) {
      dynamicField(name: { literal: $literal }) {
        value {
          __typename
          ... on MoveValue {
            type { repr }
            json
          }
        }
      }
    }
  }
`);

export type ExchangeRateAtEpochResult = ResultOf<typeof EXCHANGE_RATE_AT_EPOCH>;
