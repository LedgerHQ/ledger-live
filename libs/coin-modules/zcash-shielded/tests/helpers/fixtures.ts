/**
 * Shared test fixtures for the zcash-shielded package.
 *
 * `makeRawChunk()` returns a canonical `ShieldedSyncResultRaw` — the IPC-safe
 * shape produced by `engine.ts` and consumed by both wrappers
 * (`ZCashNative` in-process, `ZCashNativeIPC` renderer). Centralizing it means
 * a type change ripples to every test in one edit.
 */

import type { ShieldedSyncResultRaw, ShieldedTransactionRaw } from "../../src/types";

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

export function makeRawTransaction(
  overrides: DeepPartial<ShieldedTransactionRaw> = {},
): ShieldedTransactionRaw {
  return {
    id: "txid-1",
    hex: "deadbeef",
    blockHeight: 1_000_500,
    blockHash: "hash",
    timestamp: 1_700_000_000,
    fee: "5000",
    ...overrides,
    decryptedData: {
      orchard_outputs: [{ amount: "123456789", memo: "hi", transfer_type: "orchard-in" }],
      sapling_outputs: [],
      ...overrides.decryptedData,
    } as ShieldedTransactionRaw["decryptedData"],
  };
}

export function makeRawChunk(
  overrides: DeepPartial<ShieldedSyncResultRaw> = {},
): ShieldedSyncResultRaw {
  const { transactions, ...rest } = overrides;
  return {
    processedBlocks: 1000,
    remainingBlocks: 500,
    lastProcessedBlock: 1_001_000,
    transactions: (transactions as ShieldedTransactionRaw[] | undefined) ?? [makeRawTransaction()],
    ...rest,
  };
}
