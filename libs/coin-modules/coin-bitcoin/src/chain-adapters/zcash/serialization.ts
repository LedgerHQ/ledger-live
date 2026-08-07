import { BigNumber } from "bignumber.js";
import type {
  DecryptedOutput,
  DecryptedOutputRaw,
  ZcashPrivateInfo,
  ZcashPrivateInfoRaw,
  ZcashSyncState,
} from "./types";

// Persistence of the shielded `privateInfo` (its unified full viewing key,
// balances and decrypted notes) for a Zcash account served by the bitcoin
// family bridge. This is flag-independent on purpose: accounts are decoded at
// app startup, before the host has mirrored the `zcashShielded` flag, so the
// bitcoin bridge is always the one that reads a persisted Zcash account back.
// Without this the ufvk is dropped on every load and then erased on the next
// save. The standalone @ledgerhq/coin-zcash module writes the same raw shape
// when the flag is on, so the two round-trip interchangeably.

function mapDecryptedOutput(output: DecryptedOutput): DecryptedOutputRaw {
  return {
    memo: output.memo,
    transfer_type: output.transfer_type,
    amount: output.amount.toString(),
    ...(output.nullifier !== undefined && { nullifier: output.nullifier }),
    ...(output.rho !== undefined && { rho: output.rho }),
    ...(output.rseed !== undefined && { rseed: output.rseed }),
    ...(output.cmx !== undefined && { cmx: output.cmx }),
    ...(output.position !== undefined && { position: output.position }),
    ...(output.recipient !== undefined && { recipient: output.recipient }),
    ...(output.isSpent !== undefined && { is_spent: output.isSpent }),
  };
}

function rehydrateOutput(raw: DecryptedOutputRaw): DecryptedOutput {
  return {
    memo: raw.memo,
    transfer_type: raw.transfer_type,
    amount: new BigNumber(raw.amount),
    ...(raw.nullifier !== undefined && { nullifier: raw.nullifier }),
    ...(raw.rho !== undefined && { rho: raw.rho }),
    ...(raw.rseed !== undefined && { rseed: raw.rseed }),
    ...(raw.cmx !== undefined && { cmx: raw.cmx }),
    ...(raw.position !== undefined && { position: raw.position }),
    ...(raw.recipient !== undefined && { recipient: raw.recipient }),
    ...(raw.is_spent !== undefined && { isSpent: raw.is_spent }),
  };
}

export function toZcashPrivateInfoRaw(info: ZcashPrivateInfo): ZcashPrivateInfoRaw {
  return {
    saplingBalance: info.saplingBalance.toString(),
    orchardBalance: info.orchardBalance.toString(),
    ironwoodBalance: info.ironwoodBalance.toString(),
    lastSyncTimestamp: info.lastSyncTimestamp,
    ufvk: info.ufvk,
    syncState: info.syncState,
    progress: info.progress,
    estimatedTimeRemaining: info.estimatedTimeRemaining,
    birthday: info.birthday,
    lastProcessedBlock: info.lastProcessedBlock,
    transactions: info.transactions.map(({ fee, transparentOut, decryptedData, ...tx }) => ({
      ...tx,
      fee: fee.toString(),
      // Written out only when known: a transaction scanned before the scanner
      // reported the transparent bundle has no value to state, and "0" would
      // read as one. `hasTransparentInputs` needs no conversion and rides the
      // spread, absent or not.
      ...(transparentOut !== undefined && { transparentOut: transparentOut.toString() }),
      decryptedData: {
        orchard_outputs: (decryptedData?.orchard_outputs ?? []).map(mapDecryptedOutput),
        sapling_outputs: (decryptedData?.sapling_outputs ?? []).map(mapDecryptedOutput),
        ...(decryptedData?.ironwood_outputs && {
          ironwood_outputs: decryptedData.ironwood_outputs.map(mapDecryptedOutput),
        }),
      },
    })),
  };
}

export function fromZcashPrivateInfoRaw(info: ZcashPrivateInfoRaw): ZcashPrivateInfo {
  return {
    saplingBalance: new BigNumber(info.saplingBalance),
    orchardBalance: new BigNumber(info.orchardBalance),
    // Guard accounts persisted before Ironwood support was added.
    ironwoodBalance: new BigNumber(info.ironwoodBalance ?? "0"),
    lastSyncTimestamp: info.lastSyncTimestamp,
    ufvk: info.ufvk,
    syncState: info.syncState as ZcashSyncState,
    progress: info.progress,
    estimatedTimeRemaining: info.estimatedTimeRemaining,
    birthday: info.birthday,
    lastProcessedBlock: info.lastProcessedBlock,
    transactions: info.transactions.map(({ fee, transparentOut, decryptedData, ...tx }) => ({
      ...tx,
      fee: new BigNumber(fee),
      // Read back only what was written: an account persisted before the
      // scanner reported the transparent bundle states nothing about it, and
      // zero would state something.
      ...(transparentOut !== undefined && { transparentOut: new BigNumber(transparentOut) }),
      decryptedData: {
        orchard_outputs: (decryptedData?.orchard_outputs ?? []).map(rehydrateOutput),
        sapling_outputs: (decryptedData?.sapling_outputs ?? []).map(rehydrateOutput),
        ...(decryptedData?.ironwood_outputs && {
          ironwood_outputs: decryptedData.ironwood_outputs.map(rehydrateOutput),
        }),
      },
    })),
  };
}
