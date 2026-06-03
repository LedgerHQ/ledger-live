/**
 * Hand-written GraphQL documents typed via `gql.tada`. Each export pairs
 * with a runtime mapper in `sdk.graphql.ts` that re-shapes results to JSON-RPC types.
 */
import { graphql, type ResultOf } from "./tada";

/** GraphQL accepts only UInt53; digest lookups must stay on JSON-RPC. `null` sequence returns latest. */
export const CHECKPOINT_BY_SEQUENCE = graphql(`
  query CheckpointBySequence($sequenceNumber: UInt53) {
    checkpoint(sequenceNumber: $sequenceNumber) {
      digest
      sequenceNumber
      timestamp
      previousCheckpointDigest
    }
  }
`);

export type CheckpointBySequenceResult = ResultOf<typeof CHECKPOINT_BY_SEQUENCE>;

/**
 * Block-explorer view: checkpoint metadata + all transactions in the block.
 * Reuses the same per-transaction field set as
 * {@link TRANSACTIONS_BY_AFFECTED_ADDRESS} so the adapter is shared.
 */
export const BLOCK_BY_SEQUENCE = graphql(`
  query BlockBySequence($sequenceNumber: UInt53, $txFirst: Int!, $txAfter: String, $eventsFirst: Int!) {
    checkpoint(sequenceNumber: $sequenceNumber) {
      digest
      sequenceNumber
      timestamp
      previousCheckpointDigest
      transactions(first: $txFirst, after: $txAfter) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          digest
          transactionJson
          effects {
            status
            timestamp
            balanceChangesJson
            effectsJson
            gasEffects {
              gasSummary {
                computationCost
                storageCost
                storageRebate
                nonRefundableStorageFee
              }
            }
            events(first: $eventsFirst) {
              nodes {
                contents {
                  type {
                    repr
                  }
                  json
                }
              }
            }
            checkpoint {
              sequenceNumber
            }
          }
        }
      }
    }
  }
`);

export type BlockBySequenceResult = ResultOf<typeof BLOCK_BY_SEQUENCE>;

/** Latest checkpoint's sequence number (`sui_getLatestCheckpointSequenceNumber` equivalent). */
export const LATEST_CHECKPOINT_SEQUENCE = graphql(`
  query LatestCheckpointSequence {
    checkpoint {
      sequenceNumber
    }
  }
`);

export type LatestCheckpointSequenceResult = ResultOf<typeof LATEST_CHECKPOINT_SEQUENCE>;

/** `StakedSui` Move objects owned by an address; `MoveValue.json` returns parsed JSON, no BCS decoder needed. */
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

/** One `exchange_rates` Move Table entry; server-parses `literal`. `null` when missing — caller degrades to zero. */
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

/** 15-aliased batch of {@link EXCHANGE_RATE_AT_EPOCH}; alias count must stay in sync with `RATE_BATCH_CHUNK_SIZE`. */
// @ts-expect-error TS2589 — gql.tada's type-instantiation depth overflows for 15 aliases.
// SAFETY: structurally identical to 15× EXCHANGE_RATE_AT_EPOCH; runtime drift caught via
// `parseExchangeRateNode`. Alias count vs `RATE_BATCH_CHUNK_SIZE` asserted in `utils.test.ts`.
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

/** All coin balances owned by an address; cursor-paginated. */
export const ALL_BALANCES_BY_OWNER = graphql(`
  query GetAllBalances($owner: SuiAddress!, $limit: Int, $cursor: String) {
    address(address: $owner) {
      balances(first: $limit, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          coinType {
            repr
          }
          totalBalance
          addressBalance
        }
      }
    }
  }
`);

/**
 * Single transaction by digest. JSON blobs (`transactionJson`, `effectsJson`,
 * `balanceChangesJson`) carry the gRPC-proto shapes the existing JSON-RPC
 * mappers consume; typed `gasEffects` and `events` are read directly.
 */
export const TRANSACTION_BY_DIGEST = graphql(`
  query TransactionByDigest($digest: String!, $eventsFirst: Int!) {
    transaction(digest: $digest) {
      digest
      transactionJson
      effects {
        status
        timestamp
        balanceChangesJson
        effectsJson
        gasEffects {
          gasSummary {
            computationCost
            storageCost
            storageRebate
            nonRefundableStorageFee
          }
        }
        events(first: $eventsFirst) {
          nodes {
            contents {
              type {
                repr
              }
              json
            }
          }
        }
        checkpoint {
          sequenceNumber
        }
      }
    }
  }
`);

export type TransactionByDigestResult = ResultOf<typeof TRANSACTION_BY_DIGEST>;

/**
 * Paginated transaction history for an address. `affectedAddress` matches sender, sponsor, OR
 * recipient — collapsing the JSON-RPC IN+OUT merge into a single query. Backward pagination
 * (`last`/`before`) yields newest-first order; `beforeCheckpoint`/`afterCheckpoint` pin the
 * page boundary for `getListOperations`'s cursor translation.
 */
export const TRANSACTIONS_BY_AFFECTED_ADDRESS = graphql(`
  query TransactionsByAffectedAddress(
    $address: SuiAddress!
    $last: Int
    $before: String
    $beforeCheckpoint: UInt53
    $afterCheckpoint: UInt53
    $eventsFirst: Int!
  ) {
    transactions(
      filter: {
        affectedAddress: $address
        beforeCheckpoint: $beforeCheckpoint
        afterCheckpoint: $afterCheckpoint
      }
      last: $last
      before: $before
    ) {
      pageInfo {
        hasPreviousPage
        startCursor
      }
      nodes {
        digest
        transactionJson
        effects {
          status
          timestamp
          balanceChangesJson
          effectsJson
          gasEffects {
            gasSummary {
              computationCost
              storageCost
              storageRebate
              nonRefundableStorageFee
            }
          }
          events(first: $eventsFirst) {
            nodes {
              contents {
                type {
                  repr
                }
                json
              }
            }
          }
          checkpoint {
            sequenceNumber
            digest
          }
        }
      }
    }
  }
`);

export type TransactionsByAffectedAddressResult = ResultOf<typeof TRANSACTIONS_BY_AFFECTED_ADDRESS>;

/**
 * Dry-run a transaction (replaces JSON-RPC `dryRunTransactionBlock`); accepts already-built BCS.
 * `status` + `effectsJson` let the adapter distinguish a successful dry-run from a failed one
 * whose effects payload is still populated. Without these the adapter would report `$0` gas
 * on a failed simulation.
 */
export const SIMULATE_TRANSACTION = graphql(`
  query SimulateTransaction($transaction: JSON!) {
    simulateTransaction(transaction: $transaction, doGasSelection: false) {
      effects {
        status
        effectsJson
        gasEffects {
          gasSummary {
            computationCost
            storageCost
            storageRebate
          }
        }
        transaction {
          gasInput {
            gasBudget
          }
        }
      }
    }
  }
`);

export type SimulateTransactionResult = ResultOf<typeof SIMULATE_TRANSACTION>;

/** Broadcast a signed transaction (replaces JSON-RPC `executeTransactionBlock`); returns after finality on chain. */
export const EXECUTE_TRANSACTION = graphql(`
  mutation ExecuteTransaction($transactionDataBcs: Base64!, $signatures: [Base64!]!) {
    executeTransaction(transactionDataBcs: $transactionDataBcs, signatures: $signatures) {
      effects {
        digest
        status
        effectsJson
      }
    }
  }
`);

export type ExecuteTransactionResult = ResultOf<typeof EXECUTE_TRANSACTION>;

// ----- Build-side queries (write-flow GraphQL adapter) ---------------------

/**
 * Address-owned objects filtered by Move type — replaces JSON-RPC
 * `getCoins(owner, coinType, cursor)`. Supplies the gas-coin selection list
 * to `Transaction.build`. Use the fully-qualified `Coin<T>` type literal in
 * `$type` (e.g. `0x2::coin::Coin<0x2::sui::SUI>`).
 */
export const LIST_COINS_BY_OWNER_AND_TYPE = graphql(`
  query ListCoinsByOwnerAndType(
    $owner: SuiAddress!
    $type: String!
    $first: Int
    $after: String
  ) {
    address(address: $owner) {
      objects(filter: { type: $type }, first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          address
          version
          digest
          contents {
            json
          }
        }
      }
    }
  }
`);

export type ListCoinsByOwnerAndTypeResult = ResultOf<typeof LIST_COINS_BY_OWNER_AND_TYPE>;

/**
 * Single object fetch by address — replaces JSON-RPC `getObject(id)` and
 * batch-driven `multiGetObjects([ids])` (issue N parallel queries). The
 * adapter projects `address`/`version`/`digest`/owner into the JSON-RPC
 * `SuiObjectResponse` shape `Transaction.build` consumes.
 */
export const OBJECT_BY_ADDRESS = graphql(`
  query ObjectByAddress($address: SuiAddress!, $version: UInt53) {
    object(address: $address, version: $version) {
      address
      version
      digest
      objectBcs
      owner {
        __typename
        ... on AddressOwner {
          address {
            address
          }
        }
        ... on ConsensusAddressOwner {
          address {
            address
          }
          startVersion
        }
        ... on Shared {
          initialSharedVersion
        }
      }
      asMoveObject {
        contents {
          type {
            repr
          }
          json
        }
      }
    }
  }
`);

export type ObjectByAddressResult = ResultOf<typeof OBJECT_BY_ADDRESS>;

/**
 * Chain identifier — replaces JSON-RPC `getChainIdentifier()`. Used by
 * `Transaction.build` as the BCS-prefix discriminator. Stable across
 * checkpoints; cache aggressively.
 */
export const CHAIN_IDENTIFIER = graphql(`
  query ChainIdentifier {
    chainIdentifier
  }
`);

export type ChainIdentifierResult = ResultOf<typeof CHAIN_IDENTIFIER>;

/**
 * Minimal system-state query for the build-side adapter — only the fields
 * `coreClientResolveTransactionPlugin` reads (`epochId`, `referenceGasPrice`,
 * `startTimestamp`). Separate from `SUI_SYSTEM_STATE` to avoid pulling the
 * heavy `systemState.json` blob on every transaction build.
 */
export const SYSTEM_STATE_FOR_BUILD = graphql(`
  query SystemStateForBuild {
    epoch {
      epochId
      referenceGasPrice
      startTimestamp
    }
  }
`);

export type SystemStateForBuildResult = ResultOf<typeof SYSTEM_STATE_FOR_BUILD>;

/**
 * Move function signature — replaces JSON-RPC `getNormalizedMoveFunction(...)`.
 * Fetches the structured `signature` JSON scalar (recursive `{ ref, body }`)
 * which the adapter projects into the SDK's `OpenSignature[]` shape.
 */
export const MOVE_FUNCTION_BY_NAME = graphql(`
  query MoveFunctionByName(
    $package: SuiAddress!
    $module: String!
    $function: String!
  ) {
    package(address: $package) {
      module(name: $module) {
        function(name: $function) {
          name
          typeParameters {
            constraints
          }
          parameters {
            signature
            repr
          }
          return {
            signature
            repr
          }
          isEntry
          visibility
        }
      }
    }
  }
`);

export type MoveFunctionByNameResult = ResultOf<typeof MOVE_FUNCTION_BY_NAME>;
