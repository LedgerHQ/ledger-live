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
//
// TODO: remove this module once the `zcashShielded` feature flag is retired and
// Zcash is served by @ledgerhq/coin-zcash by default. At that point set the
// Zcash `currency.family` to "zcash" (see domain/entity/currency-crypto) and
// drop the flag-based routing in ledger-live-common's `resolveFamily`
// (bridge/impl.ts): both decode and encode then resolve to coin-zcash
// unconditionally, coin-bitcoin no longer serves Zcash, and this file — along
// with the `assignToAccountRaw`/`assignFromAccountRaw` hooks in ./index.ts —
// becomes dead code. coin-zcash's own bridge/serialization.ts already owns the
// same round-trip, so persistence is preserved by that move alone.
//
// This holds only if the transparent transaction path is re-routed through
// @ledgerhq/coin-zcash too. Today it is this chain-adapter — getAddress,
// getWalletXpub, getFullViewingKey, createSigner and the ZIP-317 fee pricer in
// ./index.ts — that backs the transparent PSBT flow whenever coin-bitcoin
// serves Zcash. If that path stays on coin-bitcoin, then coin-bitcoin keeps
// serving Zcash, `currency.family` cannot become "zcash", and this
// serialization must stay. So the precondition for the cleanup above is that
// coin-zcash owns the whole Zcash path, transparent included.

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
