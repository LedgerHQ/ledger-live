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
