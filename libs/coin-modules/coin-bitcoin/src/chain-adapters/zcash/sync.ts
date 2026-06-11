import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { defer, from, map, mergeMap, Observable, scan } from "rxjs";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { SyncConfig } from "@ledgerhq/types-live";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import type { ShieldedTransaction, ShieldedSyncResult, ZcashPrivateInfo } from "./types";
import { DEFAULT_ZCASH_PRIVATE_INFO, ZCASH_GRPC_URL_MAINNET } from "./constants";
import type { ZCashClient } from "./types";
import type { BtcOperation } from "../../types";
import { removeReplaced } from "../../synchronisation";
import type { ZcashAccount } from "./types";
import { convertShieldedTransactionsToOperations, computeBalanceFromNotes } from "./operations";
import { computeZcashBalance, getTransparentBalance } from "./balance";

// ─── Zcash native sync (formerly familyConfig.ts) ───────────────────────────

const ZCASH_NATIVE_CHUNK_SIZE = 5_000;

let ZCASH_GRPC_URL_CUSTOM: string | null = null;

/** Override the Zaino gRPC URL used for shielded sync. */
export const setZainoGrpcUrl = (url: string | null): void => {
  ZCASH_GRPC_URL_CUSTOM = url;
};

// Lazy import to avoid loading @ledgerhq/zcash-utils at module initialization.
// The import path is resolved at build time; the desktop renderer's rspack config
// aliases it to ZCashIPC for Electron IPC.
type ZCashModule = { createZCashClient: (args: { grpcUrl: string }) => ZCashClient };

let nativeModuleCache: Promise<ZCashModule> | null = null;

const getNativeModule = (): Promise<ZCashModule> => {
  nativeModuleCache ??= import(
    /* webpackChunkName: "zcash-native" */ "@ledgerhq/coin-bitcoin/chain-adapters/zcash/ZCash"
  );
  return nativeModuleCache;
};

async function resolveStartBlockHeight(
  lastProcessedBlock: number | null | undefined,
  birthday: string | null | undefined,
  findBlockHeight: (timestamp: number) => Promise<number>,
): Promise<number> {
  if (lastProcessedBlock !== null && lastProcessedBlock !== undefined) {
    return lastProcessedBlock + 1;
  }
  if (birthday) {
    const ts = Math.floor(new Date(birthday).getTime() / 1000);
    return findBlockHeight(ts);
  }
  return 0;
}

export const zcashSyncShielded = (
  acc: AccountShapeInfo<ZcashAccount>,
  _syncConfig: SyncConfig,
): Observable<ShieldedSyncResult> => {
  return defer(() => {
    const viewingKey = acc.initialAccount?.privateInfo?.ufvk;
    if (!viewingKey) {
      throw new Error("Missing unified full viewing key (ufvk) for ZCash shielded sync");
    }
    const { lastProcessedBlock, birthday, transactions } = acc.initialAccount?.privateInfo ?? {};

    // Collect nullifiers of unspent notes from previous syncs so the engine
    // can detect when previously-received notes are spent in this scan range.
    const knownNullifiers: string[] = [
      ...new Set(
        (transactions ?? []).flatMap(tx =>
          (tx.decryptedData?.orchard_outputs ?? [])
            .filter(
              n =>
                n.isSpent !== true &&
                n.nullifier !== undefined &&
                (n.transfer_type === "incoming" || n.transfer_type === "internal"),
            )
            .map(n => n.nullifier!),
        ),
      ),
    ];

    return from(getNativeModule()).pipe(
      mergeMap(({ createZCashClient }) => {
        const client = createZCashClient({
          grpcUrl: ZCASH_GRPC_URL_CUSTOM ?? ZCASH_GRPC_URL_MAINNET,
        });
        return from(
          resolveStartBlockHeight(lastProcessedBlock, birthday, ts => client.findBlockHeight(ts)),
        ).pipe(
          mergeMap(startBlockHeight =>
            client.syncShielded({
              startBlockHeight,
              viewingKey,
              maxBatchSize: ZCASH_NATIVE_CHUNK_SIZE,
              ...(knownNullifiers.length > 0 && { knownNullifiers }),
            }),
          ),
        );
      }),
    );
  });
};

// ─── Shielded sync logic ────────────────────────────────────────────────────

type ShieldedScanAccumulated = {
  processedOperations: ShieldedTransaction[];
  accountUpdate: Partial<ZcashAccount>;
};

export function reduceShieldedSyncResult(
  accumulated: ShieldedScanAccumulated,
  result: ShieldedSyncResult,
  info: AccountShapeInfo<ZcashAccount>,
  accountId: string,
): ShieldedScanAccumulated {
  const existingPrivateInfo =
    accumulated.accountUpdate.privateInfo ||
    info.initialAccount?.privateInfo ||
    DEFAULT_ZCASH_PRIVATE_INFO;
  const processedIds = new Set(accumulated.processedOperations.map(tx => tx.id));
  const newTransactions = result.transactions.filter(tx => !processedIds.has(tx.id));

  // Transparent balance comes from the transparent sync's UTXOs (stable source),
  // so we can recompute the transparent + private total here without double-counting.
  const transparentBalance = getTransparentBalance(info.initialAccount?.bitcoinResources?.utxos);

  if (newTransactions.length === 0) {
    const totalBlocks = result.processedBlocks + result.remainingBlocks;
    // Even without new transactions, spentKnownNullifiers may mark existing notes as spent.
    const spentNfs = result.spentKnownNullifiers ?? [];
    let updatedTransactions = existingPrivateInfo.transactions;
    if (spentNfs.length > 0) {
      const spentSet = new Set(spentNfs);
      updatedTransactions = updatedTransactions.map(tx => {
        const outputs = tx.decryptedData?.orchard_outputs;
        if (!outputs?.some(n => n.nullifier && spentSet.has(n.nullifier))) return tx;
        return {
          ...tx,
          decryptedData: {
            orchard_outputs: outputs.map(n =>
              n.nullifier && spentSet.has(n.nullifier) ? { ...n, isSpent: true } : n,
            ),
            sapling_outputs: tx.decryptedData?.sapling_outputs ?? [],
          },
        };
      });
    }
    const orchardBalance =
      spentNfs.length > 0
        ? computeBalanceFromNotes(updatedTransactions)
        : existingPrivateInfo.orchardBalance;
    return {
      ...accumulated,
      accountUpdate: {
        ...accumulated.accountUpdate,
        balance: computeZcashBalance(transparentBalance, {
          orchardBalance,
          saplingBalance: existingPrivateInfo.saplingBalance,
        }),
        blockHeight: result.lastProcessedBlock ?? accumulated.accountUpdate.blockHeight ?? 0,
        privateInfo: {
          ...existingPrivateInfo,
          syncState: result.remainingBlocks > 0 ? ("running" as const) : ("complete" as const),
          progress:
            totalBlocks > 0 ? Math.round((result.processedBlocks / totalBlocks) * 100) : 100,
          lastProcessedBlock: result.lastProcessedBlock ?? null,
          lastSyncTimestamp: Date.now(),
          transactions: updatedTransactions,
          orchardBalance,
        },
      },
    };
  }

  const newOperations = convertShieldedTransactionsToOperations(newTransactions, accountId);

  const currentOperations = (accumulated.accountUpdate.operations || []) as BtcOperation[];
  const mergedOperations = mergeOps(currentOperations, newOperations);
  const operations = removeReplaced(mergedOperations as BtcOperation[]);

  // Deduplicate: when a block range is re-scanned (e.g. after a state reset),
  // the same transaction may already exist in the persisted list. Keep only the
  // freshly-scanned version (which carries the up-to-date `isSpent` flag).
  const newIds = new Set(newTransactions.map(tx => tx.id));
  const allShieldedTx: ShieldedTransaction[] = [
    ...(accumulated.accountUpdate.privateInfo?.transactions ?? []).filter(tx => !newIds.has(tx.id)),
    ...newTransactions,
  ];

  // Mark previously-stored notes as spent using Rust's cross-scan detection.
  // Clone transactions that need mutation to preserve immutability of the
  // accumulated state (allShieldedTx contains refs to existing objects).
  const spentNfs = result.spentKnownNullifiers ?? [];
  if (spentNfs.length > 0) {
    const spentSet = new Set(spentNfs);
    for (let i = 0; i < allShieldedTx.length; i++) {
      const tx = allShieldedTx[i];
      const outputs = tx.decryptedData?.orchard_outputs;
      if (!outputs?.some(n => n.nullifier && spentSet.has(n.nullifier))) continue;
      // Clone only txs that need mutation
      allShieldedTx[i] = {
        ...tx,
        decryptedData: {
          orchard_outputs: outputs.map(n =>
            n.nullifier && spentSet.has(n.nullifier) ? { ...n, isSpent: true } : n,
          ),
          sapling_outputs: tx.decryptedData?.sapling_outputs ?? [],
        },
      };
    }
  }

  const orchardBalance = computeBalanceFromNotes(allShieldedTx);
  const saplingBalance = accumulated.accountUpdate.privateInfo?.saplingBalance ?? new BigNumber(0);

  const totalBlocks = result.processedBlocks + result.remainingBlocks;
  const privateInfo: ZcashPrivateInfo = {
    saplingBalance,
    orchardBalance,
    syncState: result.remainingBlocks > 0 ? ("running" as const) : ("complete" as const),
    progress: totalBlocks > 0 ? Math.round((result.processedBlocks / totalBlocks) * 100) : 100,
    estimatedTimeRemaining: existingPrivateInfo.estimatedTimeRemaining ?? { hours: 0, minutes: 0 },
    ufvk: existingPrivateInfo?.ufvk ?? null,
    birthday: existingPrivateInfo?.birthday ?? null,
    lastSyncTimestamp: Date.now(),
    lastProcessedBlock: result.lastProcessedBlock ?? null,
    transactions: allShieldedTx,
  };

  log(
    "bitcoin/reduceShieldedSyncResult",
    `Processed ${newOperations.length} new shielded operations`,
    {
      accountId,
      totalOperations: operations.length,
      lastProcessedBlock: result.lastProcessedBlock ?? 0,
      orchardBalance: orchardBalance.toString(),
      previousOperations: currentOperations.length,
    },
  );

  const missingOpsCount = Math.max(
    0,
    (info.initialAccount?.operationsCount ?? 0) - (info.initialAccount?.operations?.length ?? 0),
  );

  return {
    processedOperations: [...result.transactions],
    accountUpdate: {
      ...accumulated.accountUpdate,
      balance: computeZcashBalance(transparentBalance, { orchardBalance, saplingBalance }),
      operations,
      operationsCount: missingOpsCount + operations.length,
      blockHeight: result.lastProcessedBlock ?? info.initialAccount?.blockHeight ?? 0,
      privateInfo,
    },
  };
}

export function createShieldedSyncObservable(
  info: AccountShapeInfo<ZcashAccount>,
  shieldedSyncRaw: Observable<ShieldedSyncResult>,
): Observable<Partial<ZcashAccount>> {
  const accountId =
    info.initialAccount?.id ??
    encodeAccountId({
      type: "js",
      version: "2",
      currencyId: info.currency.id,
      xpubOrAddress: info.initialAccount?.xpub || "",
      derivationMode: info.derivationMode,
    });

  const initialAccountUpdate: ShieldedScanAccumulated["accountUpdate"] = {
    operations: (info.initialAccount?.operations || []) as BtcOperation[],
    ...(info.initialAccount?.blockHeight !== undefined && {
      blockHeight: info.initialAccount.blockHeight,
    }),
    ...(info.initialAccount?.privateInfo && {
      privateInfo: { ...info.initialAccount.privateInfo, syncState: "running" as const },
    }),
  };

  const initialAccumulated: ShieldedScanAccumulated = {
    processedOperations: [],
    accountUpdate: initialAccountUpdate,
  };

  return shieldedSyncRaw.pipe(
    scan(
      (accumulated, result) => reduceShieldedSyncResult(accumulated, result, info, accountId),
      initialAccumulated,
    ),
    map(accumulated => accumulated.accountUpdate),
  );
}

/**
 * Build the extra shielded sync observable for Zcash accounts.
 * Returns `undefined` if the account is not eligible for shielded sync.
 */
export function buildExtraSyncObservable(
  info: AccountShapeInfo<ZcashAccount>,
  syncConfig: SyncConfig,
): Observable<Partial<ZcashAccount>> | undefined {
  const syncType = syncConfig.syncType ?? 0;
  if (!(syncType & SYNC_TYPE_SHIELDED)) return undefined;

  const zcashInitialAccount = info.initialAccount as ZcashAccount | undefined;

  const ufvkIsPresent =
    !!zcashInitialAccount &&
    !!zcashInitialAccount.privateInfo?.ufvk &&
    zcashInitialAccount.privateInfo.ufvk.length > 0;

  const syncStateIsEnabled =
    !!zcashInitialAccount &&
    (zcashInitialAccount.privateInfo?.syncState === "ready" ||
      zcashInitialAccount.privateInfo?.syncState === "running" ||
      zcashInitialAccount.privateInfo?.syncState === "stopped" ||
      zcashInitialAccount.privateInfo?.syncState === "outdated");

  if (!ufvkIsPresent || !syncStateIsEnabled) return undefined;

  const shieldedSyncRaw = zcashSyncShielded(info, syncConfig);
  return createShieldedSyncObservable(info, shieldedSyncRaw);
}
