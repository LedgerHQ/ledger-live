import BigNumber from "bignumber.js";
import { defaultAccountBalances } from "@ledgerhq/ledger-wallet-framework/account/balances";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
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
import { rehydrateOutputs } from "../network/serialization/rehydrate";
import { computeZcashBalance, getTransparentBalance } from "../logic/account/balance";
import { parseZatoshis } from "../logic/zatoshis";
import { makeZcashAccountBalances } from "./accountBalances";
import { forgetSyncedHistory } from "./walletHistory";
import { walletBtcCurrencyById, type ExplorerConfig } from "../walletBtcCurrency";
import type { Logger } from "@ledgerhq/coin-module-framework/config";

// ── Transparent (bitcoinResources) serialization ────────────────────────
//
// Structurally identical to coin-bitcoin's serialization.ts: the persisted
// AccountRaw of a Zcash account saved before this module served it was produced
// by coin-bitcoin's assignToAccountRaw (bitcoinResources/utxos/xpub), and
// `family` is never persisted -- so this must keep round-tripping that shape.

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

// No explorer endpoint at deserialization: sync and broadcast bind it from the coin config
// before first use (see bridge/explorer.ts), so a remote endpoint change is not frozen here.
const UNBOUND_EXPLORER: ExplorerConfig = { explorer: { url: "" } };

export function fromBitcoinResourcesRaw(logger: Logger, r: BitcoinResourcesRaw): BitcoinResources {
  return {
    // An unreadable persisted UTXO is dropped: the next transparent sync lists it again.
    utxos: r.utxos.filter(([, , , , value]) => parseZatoshis(value)).map(fromBitcoinOutputRaw),
    ...(r.walletAccount && {
      walletAccount: wallet.importFromSerializedAccountSync(
        logger,
        r.walletAccount,
        walletBtcCurrencyById(r.walletAccount.params.currency, UNBOUND_EXPLORER),
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
    shieldedAddress: info.shieldedAddress,
    syncState: info.syncState,
    progress: info.progress,
    estimatedTimeRemaining: info.estimatedTimeRemaining,
    birthday: info.birthday,
    lastProcessedBlock: info.lastProcessedBlock,
    // exactOptionalPropertyTypes: undefined can't be assigned to an optional
    // field directly -- omit the key entirely rather than write it as undefined.
    ...(info.lastSyncError !== undefined && { lastSyncError: info.lastSyncError }),
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

/**
 * Where a reset shielded state resumes from: a full rescan the automatic sync picks up, unless
 * shielded sync is off or the user paused it, which stays theirs to restart.
 */
function rescanState({
  syncState,
  lastSyncError,
}: Pick<ZcashPrivateInfo, "syncState" | "lastSyncError">): Pick<
  ZcashPrivateInfo,
  "syncState" | "progress" | "lastSyncError"
> {
  const isUserPaused = syncState === "stopped" && !lastSyncError;
  return {
    syncState: syncState === "disabled" || isUserPaused ? syncState : "ready",
    progress: 0,
    lastSyncError: null,
  };
}

/** Zero only on an account persisted before Ironwood support, which holds no Ironwood note either. */
function readIronwoodBalance(info: ZcashPrivateInfoRaw): BigNumber | undefined {
  if (info.ironwoodBalance !== undefined) return parseZatoshis(info.ironwoodBalance);
  const holdsIronwoodNotes = info.transactions.some(
    ({ decryptedData }) => (decryptedData?.ironwood_outputs?.length ?? 0) > 0,
  );
  return holdsIronwoodNotes ? undefined : new BigNumber(0);
}

function readZcashPrivateInfoRaw(info: ZcashPrivateInfoRaw): {
  privateInfo: ZcashPrivateInfo;
  isReset: boolean;
} {
  const saplingBalance = parseZatoshis(info.saplingBalance);
  const orchardBalance = parseZatoshis(info.orchardBalance);
  const ironwoodBalance = readIronwoodBalance(info);
  let hasUnreadableScalar = false;
  const readScalar = (value: string): BigNumber => {
    const parsed = parseZatoshis(value);
    if (!parsed) hasUnreadableScalar = true;
    return parsed ?? new BigNumber(0);
  };
  const transactions = info.transactions.map(({ fee, transparentOut, decryptedData, ...tx }) => ({
    ...tx,
    fee: readScalar(fee),
    // Read back only what was written: an account persisted before the
    // scanner reported the transparent bundle states nothing about it, and
    // zero would state something.
    ...(transparentOut !== undefined && { transparentOut: readScalar(transparentOut) }),
    decryptedData: {
      orchard_outputs: rehydrateOutputs(decryptedData?.orchard_outputs ?? []),
      sapling_outputs: rehydrateOutputs(decryptedData?.sapling_outputs ?? []),
      ...(decryptedData?.ironwood_outputs && {
        ironwood_outputs: rehydrateOutputs(decryptedData.ironwood_outputs),
      }),
    },
  }));
  const persistedNoteCount = info.transactions.reduce(
    (count, { decryptedData }) => count + countOutputs(decryptedData),
    0,
  );
  const readableNoteCount = transactions.reduce(
    (count, { decryptedData }) => count + countOutputs(decryptedData),
    0,
  );
  const persisted = {
    lastSyncTimestamp: info.lastSyncTimestamp,
    ufvk: info.ufvk,
    shieldedAddress: info.shieldedAddress ?? null,
    syncState: info.syncState as ZcashPrivateInfo["syncState"],
    progress: info.progress,
    estimatedTimeRemaining: info.estimatedTimeRemaining,
    birthday: info.birthday,
    // Guard accounts persisted before this field was added.
    lastSyncError: info.lastSyncError ?? null,
  };

  if (
    !saplingBalance ||
    !orchardBalance ||
    !ironwoodBalance ||
    hasUnreadableScalar ||
    readableNoteCount !== persistedNoteCount
  ) {
    return {
      isReset: true,
      privateInfo: {
        ...persisted,
        ...rescanState(persisted),
        saplingBalance: new BigNumber(0),
        orchardBalance: new BigNumber(0),
        ironwoodBalance: new BigNumber(0),
        lastProcessedBlock: null,
        transactions: [],
      },
    };
  }

  return {
    isReset: false,
    privateInfo: {
      ...persisted,
      saplingBalance,
      orchardBalance,
      ironwoodBalance,
      lastProcessedBlock: info.lastProcessedBlock,
      transactions,
    },
  };
}

export function fromZcashPrivateInfoRaw(info: ZcashPrivateInfoRaw): ZcashPrivateInfo {
  return readZcashPrivateInfoRaw(info).privateInfo;
}

const countOutputs = (decryptedData?: {
  orchard_outputs?: unknown[];
  sapling_outputs?: unknown[];
  ironwood_outputs?: unknown[];
}): number =>
  (decryptedData?.orchard_outputs?.length ?? 0) +
  (decryptedData?.sapling_outputs?.length ?? 0) +
  (decryptedData?.ironwood_outputs?.length ?? 0);

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

export const makeAssignFromAccountRaw =
  (logger: Logger) =>
  (accountRaw: AccountRaw, account: Account): void => {
    const zcashAccountRaw = accountRaw as ZcashAccountRaw;
    const zcashAccount = account as ZcashAccount;
    let droppedUtxo = false;
    if (zcashAccountRaw.bitcoinResources) {
      zcashAccount.bitcoinResources = fromBitcoinResourcesRaw(
        logger,
        zcashAccountRaw.bitcoinResources,
      );
      droppedUtxo =
        zcashAccount.bitcoinResources.utxos.length < zcashAccountRaw.bitcoinResources.utxos.length;
    }
    let isReset = false;
    if (zcashAccountRaw.privateInfo) {
      const read = readZcashPrivateInfoRaw(zcashAccountRaw.privateInfo);
      zcashAccount.privateInfo = read.privateInfo;
      isReset = read.isReset;
    }
    if (isReset) keepTransparentState(logger, zcashAccount);
    else if (droppedUtxo) recountWithoutDroppedUtxo(logger, zcashAccount);
  };

/** A dropped UTXO no longer counts: totals are rebuilt from what was kept and the transparent history refetched. */
function recountWithoutDroppedUtxo(logger: Logger, account: ZcashAccount): void {
  const balance = computeZcashBalance(
    getTransparentBalance(account.bitcoinResources?.utxos),
    account.privateInfo,
  );
  account.balance = balance;
  account.spendableBalance = balance;
  account.balances =
    makeZcashAccountBalances(() => !!account.privateInfo)(account).account ??
    defaultAccountBalances(account);
  account.balanceHistoryCache = emptyHistoryCache;
  const walletAccount = account.bitcoinResources?.walletAccount;
  if (walletAccount) forgetSyncedHistory(logger, walletAccount);
}

/** A reset shielded state keeps the transparent funds and drops the history, which both legs then reload in full. */
function keepTransparentState(logger: Logger, account: ZcashAccount): void {
  const balance = getTransparentBalance(account.bitcoinResources?.utxos);
  account.balance = balance;
  account.spendableBalance = balance;
  account.balances =
    makeZcashAccountBalances(() => false)(account).account ?? defaultAccountBalances(account);
  account.balanceHistoryCache = emptyHistoryCache;
  account.operations = [];
  account.operationsCount = 0;
  const walletAccount = account.bitcoinResources?.walletAccount;
  if (walletAccount) forgetSyncedHistory(logger, walletAccount);
}
