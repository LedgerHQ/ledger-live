import { BigNumber } from "bignumber.js";
import wallet from "@ledgerhq/wallet-btc/index";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type {
  BitcoinOutput,
  BitcoinOutputRaw,
  BitcoinResources,
  BitcoinResourcesRaw,
  ZcashAccount,
  ZcashAccountRaw,
} from "../types/bridge";
import type {
  DecryptedOutput,
  DecryptedOutputRaw,
  ZcashPrivateInfo,
  ZcashPrivateInfoRaw,
} from "../network/types";
import { rehydrateOutput } from "../network/serialization/rehydrate";
import { walletBtcCurrencyById } from "../walletBtcCurrency";

// ── Transparent (bitcoinResources) serialization ────────────────────────
//
// Structurally identical to coin-bitcoin's serialization.ts: the persisted
// AccountRaw for an existing Zcash account was produced by coin-bitcoin's
// assignToAccountRaw (bitcoinResources/utxos/xpub), and `family` is never
// persisted -- so routing can flip between coin-bitcoin and coin-zcash
// freely as long as this round-trips the same shape.

export function toBitcoinOutputRaw({
  hash,
  outputIndex,
  blockHeight,
  address,
  value,
  rbf,
  isChange,
}: BitcoinOutput): BitcoinOutputRaw {
  return [hash, outputIndex, blockHeight, address, value.toString(), rbf ? 1 : 0, isChange ? 1 : 0];
}

export function fromBitcoinOutputRaw([
  hash,
  outputIndex,
  blockHeight,
  address,
  value,
  rbf,
  isChange,
]: BitcoinOutputRaw): BitcoinOutput {
  return {
    hash,
    outputIndex,
    blockHeight: blockHeight || undefined,
    address: address || undefined,
    value: new BigNumber(value),
    rbf: !!rbf,
    isChange: !!isChange,
  };
}

export function toBitcoinResourcesRaw(r: BitcoinResources): BitcoinResourcesRaw {
  return {
    utxos: r.utxos.map(toBitcoinOutputRaw),
    ...(r.walletAccount && {
      walletAccount: wallet.exportToSerializedAccountSync(r.walletAccount),
    }),
  };
}

export function fromBitcoinResourcesRaw(r: BitcoinResourcesRaw): BitcoinResources {
  return {
    utxos: r.utxos.map(fromBitcoinOutputRaw),
    ...(r.walletAccount && {
      walletAccount: wallet.importFromSerializedAccountSync(
        r.walletAccount,
        walletBtcCurrencyById(r.walletAccount.params.currency),
      ),
    }),
  };
}

// ── Shielded (privateInfo) serialization ────────────────────────────────

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
    syncState: info.syncState as ZcashPrivateInfo["syncState"],
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

// ── AccountBridge hooks ──────────────────────────────────────────────────

export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  const zcashAccount = account as ZcashAccount;
  if (zcashAccount.bitcoinResources) {
    (accountRaw as ZcashAccountRaw).bitcoinResources = toBitcoinResourcesRaw(
      zcashAccount.bitcoinResources,
    );
  }
  if (zcashAccount.privateInfo) {
    (accountRaw as ZcashAccountRaw).privateInfo = toZcashPrivateInfoRaw(zcashAccount.privateInfo);
  }
}

export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  const zcashAccountRaw = accountRaw as ZcashAccountRaw;
  if (zcashAccountRaw.bitcoinResources) {
    (account as ZcashAccount).bitcoinResources = fromBitcoinResourcesRaw(
      zcashAccountRaw.bitcoinResources,
    );
  }
  if (zcashAccountRaw.privateInfo) {
    (account as ZcashAccount).privateInfo = fromZcashPrivateInfoRaw(zcashAccountRaw.privateInfo);
  }
}
