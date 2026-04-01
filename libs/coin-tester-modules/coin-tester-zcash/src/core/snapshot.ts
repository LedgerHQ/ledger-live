import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { BigNumber } from "bignumber.js";
import type { ZcashAccount, ZcashAccountRaw } from "@ledgerhq/coin-bitcoin/types";
import { ZCASH_SHIELDED_TX_TYPES } from "@ledgerhq/zcash-shielded/types";
import { assignToAccountRaw, assignFromAccountRaw } from "@ledgerhq/coin-bitcoin/serialization";
import type { AccountRaw, BalanceHistoryCache } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { compress, decompress } from "../utils/compression";

const EMPTY_BALANCE_HISTORY_CACHE: BalanceHistoryCache = {
  HOUR: { latestDate: null, balances: [] },
  DAY: { latestDate: null, balances: [] },
  WEEK: { latestDate: null, balances: [] },
};

export const SNAPSHOT_FORMAT_VERSION = 1;

export interface SnapshotMetadata {
  formatVersion: number;
  accountLabel: string;
  /** SHA-256 of UFVK — no raw keys stored */
  ufvkFingerprint: string;
  birthHeight: number;
  snapshotHeight: number;
  chainTipAtCapture: number;
  createdAt: string;
  coinBitcoinVersion: string;
  zcashShieldedVersion: string;
  network: "mainnet" | "testnet";
}

export interface SnapshotDerivedData {
  transparentBalance: string;
  shieldedBalance: string;
  availableBalance: string;
  operationsCount: number;
  shieldedTxCount: number;
  transparentTxCount: number;
}

export interface Snapshot {
  metadata: SnapshotMetadata;
  accountShapeRaw: ZcashAccountRaw;
  derivedData: SnapshotDerivedData;
}

export function ufvkFingerprint(ufvk: string): string {
  return "sha256:" + createHash("sha256").update(ufvk).digest("hex").slice(0, 16);
}

export function computeDerivedData(account: Partial<ZcashAccount>): SnapshotDerivedData {
  const privateInfo = account.privateInfo;
  const shieldedBalance = privateInfo
    ? (privateInfo.orchardBalance ?? new BigNumber(0)).plus(
        privateInfo.saplingBalance ?? new BigNumber(0),
      )
    : new BigNumber(0);
  // account.balance = transparent + shielded; transparentBalance is the remainder
  const transparentBalance = (account.balance ?? new BigNumber(0)).minus(shieldedBalance);
  const availableBalance = account.balance ?? new BigNumber(0);

  // Count shielded txs by operation type (works when account.operations is populated at write time)
  const ops = account.operations ?? [];
  const shieldedTxCount = ops.filter(op => ZCASH_SHIELDED_TX_TYPES.includes(op.type)).length;
  const transparentTxCount = Math.max(0, (account.operationsCount ?? ops.length) - shieldedTxCount);

  return {
    transparentBalance: transparentBalance.dividedBy(1e8).toFixed(8),
    shieldedBalance: shieldedBalance.dividedBy(1e8).toFixed(8),
    availableBalance: availableBalance.dividedBy(1e8).toFixed(8),
    operationsCount: account.operationsCount ?? ops.length,
    shieldedTxCount,
    transparentTxCount,
  };
}

export async function writeSnapshot(
  snapshotPath: string,
  account: Partial<ZcashAccount>,
  metadata: Omit<SnapshotMetadata, "formatVersion" | "createdAt">,
): Promise<void> {
  const raw: ZcashAccountRaw = buildAccountRaw(account);
  const derivedData = computeDerivedData(account);

  const snapshot: Snapshot = {
    metadata: {
      ...metadata,
      formatVersion: SNAPSHOT_FORMAT_VERSION,
      createdAt: new Date().toISOString(),
    },
    accountShapeRaw: raw,
    derivedData,
  };

  const json = JSON.stringify(snapshot);
  const compressed = await compress(json);
  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await fs.writeFile(snapshotPath, compressed);
}

export async function readSnapshot(snapshotPath: string): Promise<Snapshot> {
  const raw = await fs.readFile(snapshotPath);
  const json = await decompress(raw);
  const snapshot = JSON.parse(json) as Snapshot;

  if (snapshot.metadata.formatVersion !== SNAPSHOT_FORMAT_VERSION) {
    throw new Error(
      `Snapshot format version mismatch: expected ${SNAPSHOT_FORMAT_VERSION}, got ${snapshot.metadata.formatVersion}`,
    );
  }

  return snapshot;
}

export function snapshotToAccount(snapshot: Snapshot): ZcashAccount {
  return accountRawToAccount(snapshot.accountShapeRaw);
}

function buildAccountRaw(account: Partial<ZcashAccount>): ZcashAccountRaw {
  const baseRaw: AccountRaw = {
    id: account.id ?? "",
    seedIdentifier: account.seedIdentifier ?? "",
    derivationMode: account.derivationMode ?? "",
    index: account.index ?? 0,
    freshAddress: account.freshAddress ?? "",
    freshAddressPath: account.freshAddressPath ?? "",
    blockHeight: account.blockHeight ?? 0,
    creationDate: account.creationDate?.toISOString() ?? new Date().toISOString(),
    operationsCount: account.operationsCount ?? account.operations?.length ?? 0,
    operations: [],
    pendingOperations: [],
    currencyId: account.currency?.id ?? "zcash",
    lastSyncDate: account.lastSyncDate?.toISOString() ?? new Date().toISOString(),
    balance: account.balance?.toString() ?? "0",
    spendableBalance: account.spendableBalance?.toString() ?? "0",
    used: account.used ?? false,
    swapHistory: [],
    nfts: [],
  };

  assignToAccountRaw(account as ZcashAccount, baseRaw);
  return baseRaw as ZcashAccountRaw;
}

function accountRawToAccount(raw: ZcashAccountRaw): ZcashAccount {
  const account = {
    type: "Account" as const,
    id: raw.id,
    seedIdentifier: raw.seedIdentifier,
    derivationMode: raw.derivationMode as string,
    index: raw.index,
    freshAddress: raw.freshAddress,
    freshAddressPath: raw.freshAddressPath,
    blockHeight: raw.blockHeight,
    currency: getCryptoCurrencyById(raw.currencyId),
    creationDate: new Date(raw.creationDate ?? 0),
    operationsCount: raw.operationsCount ?? 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(raw.lastSyncDate ?? 0),
    balance: new BigNumber(raw.balance),
    spendableBalance: new BigNumber(raw.spendableBalance ?? raw.balance),
    used: raw.used ?? false,
    swapHistory: [],
    nfts: [],
    balanceHistoryCache: EMPTY_BALANCE_HISTORY_CACHE,
    bitcoinResources: {
      utxos: [],
    },
  } as ZcashAccount;

  assignFromAccountRaw(raw, account);
  return account;
}
