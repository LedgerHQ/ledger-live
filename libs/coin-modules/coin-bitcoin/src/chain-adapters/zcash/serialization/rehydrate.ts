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
  ShieldedSyncResult,
  ShieldedSyncResultRaw,
  ShieldedTransaction,
  ShieldedTransactionRaw,
} from "../types";

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
        orchard_outputs: raw.decryptedData.orchard_outputs.map(o => ({
          amount: new BigNumber(o.amount),
          memo: o.memo,
          transfer_type: o.transfer_type,
        })),
        sapling_outputs: raw.decryptedData.sapling_outputs.map(o => ({
          amount: new BigNumber(o.amount),
          memo: o.memo,
          transfer_type: o.transfer_type,
        })),
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
  };
}
