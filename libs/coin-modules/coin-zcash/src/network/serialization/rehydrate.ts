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

import BigNumber from "bignumber.js";
import { ZcashUnreadableAmount } from "../../errors";
import { parseZatoshis } from "../../logic/zatoshis";
import type {
  DecryptedOutput,
  DecryptedOutputRaw,
  ShieldedSyncResult,
  ShieldedSyncResultRaw,
  ShieldedTransaction,
  ShieldedTransactionRaw,
} from "../types";

function parseOutput(raw: DecryptedOutputRaw): DecryptedOutput | undefined {
  const amount = parseZatoshis(raw.amount);
  if (!amount) return undefined;
  return {
    memo: raw.memo,
    transfer_type: raw.transfer_type,
    amount,
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

export function rehydrateOutput(raw: DecryptedOutputRaw): DecryptedOutput {
  const output = parseOutput(raw);
  if (!output) throw new ZcashUnreadableAmount("zcash: unreadable note amount");
  return output;
}

export function rehydrateOutputs(raws: DecryptedOutputRaw[]): DecryptedOutput[] {
  return raws.flatMap(raw => parseOutput(raw) ?? []);
}

function rehydrateScannedOutputs(txId: string, raws: DecryptedOutputRaw[]): DecryptedOutput[] {
  return raws.map(raw => {
    const output = parseOutput(raw);
    if (!output) {
      throw new ZcashUnreadableAmount(
        `zcash: unreadable note amount in scanned transaction ${txId}`,
      );
    }
    return output;
  });
}

function readScannedZatoshis(txId: string, value: string): BigNumber {
  const parsed = parseZatoshis(value);
  if (!parsed) {
    throw new ZcashUnreadableAmount(`zcash: unreadable amount in scanned transaction ${txId}`);
  }
  return parsed;
}

export function rehydrateTransaction(raw: ShieldedTransactionRaw): ShieldedTransaction {
  return {
    id: raw.id,
    hex: raw.hex,
    blockHeight: raw.blockHeight,
    blockHash: raw.blockHash,
    timestamp: raw.timestamp,
    fee: readScannedZatoshis(raw.id, raw.fee),
    // Absent on accounts persisted before the scanner reported the transparent
    // bundle. Kept absent rather than read as zero, which would be a claim
    // about the transaction rather than about what we know of it.
    ...(raw.transparentOut !== undefined && {
      transparentOut: readScannedZatoshis(raw.id, raw.transparentOut),
    }),
    ...(raw.hasTransparentInputs !== undefined && {
      hasTransparentInputs: raw.hasTransparentInputs,
    }),
    ...(raw.decryptedData && {
      decryptedData: {
        orchard_outputs: rehydrateScannedOutputs(raw.id, raw.decryptedData.orchard_outputs),
        sapling_outputs: rehydrateScannedOutputs(raw.id, raw.decryptedData.sapling_outputs),
        ...(raw.decryptedData.ironwood_outputs && {
          ironwood_outputs: rehydrateScannedOutputs(raw.id, raw.decryptedData.ironwood_outputs),
        }),
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
