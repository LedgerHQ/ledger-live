/**
 * Converts the IPC-safe `Raw` types (amounts/fees as strings) back into the
 * public `ShieldedSyncResult` / `ShieldedTransaction` types that use
 * `BigNumber`.
 *
 * Used by both:
 *   - `ZCashIPC` (Electron renderer), after receiving a chunk from the
 *     UtilityProcess via `structuredClone`.
 *   - `ZCash` (in-process), for symmetry with the IPC client -- the
 *     engine always emits `Raw` shapes and this keeps the two code paths
 *     interchangeable.
 *
 * With `exactOptionalPropertyTypes: true`, we can't assign `undefined` to an
 * optional field; conditional spreads are used to omit missing keys entirely.
 */

import { BigNumber } from "bignumber.js";
import type {
  DecryptedOutput,
  DecryptedOutputRaw,
  ShieldedSyncResult,
  ShieldedSyncResultRaw,
  ShieldedTransaction,
  ShieldedTransactionRaw,
} from "../types";

export function rehydrateOutput(raw: DecryptedOutputRaw): DecryptedOutput {
  return {
    memo: raw.memo,
    transfer_type: raw.transfer_type,
    amount: new BigNumber(raw.amount),
    // pass-through, no BigNumber conversion needed
    ...(raw.nullifier !== undefined && { nullifier: raw.nullifier }),
    ...(raw.rho !== undefined && { rho: raw.rho }),
    ...(raw.rseed !== undefined && { rseed: raw.rseed }),
    ...(raw.cmx !== undefined && { cmx: raw.cmx }),
    ...(raw.position !== undefined && { position: raw.position }),
    ...(raw.recipient !== undefined && { recipient: raw.recipient }),
    ...(raw.is_spent !== undefined && { isSpent: raw.is_spent }),
  };
}

export function rehydrateTransaction(raw: ShieldedTransactionRaw): ShieldedTransaction {
  return {
    id: raw.id,
    hex: raw.hex,
    blockHeight: raw.blockHeight,
    blockHash: raw.blockHash,
    timestamp: raw.timestamp,
    fee: new BigNumber(raw.fee),
    ...(raw.decryptedData && {
      decryptedData: {
        orchard_outputs: raw.decryptedData.orchard_outputs.map(rehydrateOutput),
        sapling_outputs: raw.decryptedData.sapling_outputs.map(rehydrateOutput),
      },
    }),
  };
}

export function rehydrateSyncResult(raw: ShieldedSyncResultRaw): ShieldedSyncResult {
  return {
    processedBlocks: raw.processedBlocks,
    remainingBlocks: raw.remainingBlocks,
    ...(raw.lastProcessedBlock !== undefined && { lastProcessedBlock: raw.lastProcessedBlock }),
    transactions: raw.transactions.map(rehydrateTransaction),
    ...(raw.spentKnownNullifiers && { spentKnownNullifiers: raw.spentKnownNullifiers }),
  };
}
