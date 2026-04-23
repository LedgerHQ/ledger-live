import BigNumber from "bignumber.js";
import {
  type AccountShapeInfo,
  type GetAccountShapeStream,
  makeSync,
  mergeOps,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { log } from "@ledgerhq/logs";
import { concat, merge, Observable, of } from "rxjs";
import { concatMap } from "rxjs/operators";
import { SyncConfig, SYNC_TYPE_SHIELDED, SYNC_TYPE_TRANSPARENT } from "@ledgerhq/types-live";
import invariant from "invariant";
import { AleoApiConfigurationResetError } from "../errors";
import { getBalance, lastBlock, listOperations } from "../logic";
import {
  extractViewKey,
  isProvableApiConfigured,
  isRecordScannerReady,
  splitPrivateAndPublicOperations,
} from "../logic/utils";
import { accessProvableApi, fetchAllOwnedRecords, patchPublicOperations } from "../network/utils";
import type {
  AleoAccount,
  AleoOperation,
  AleoUnspentRecord,
  Transaction as AleoTransaction,
} from "../types";
import { getPrivateBalance } from "../logic/getPrivateBalance";
import { listPrivateOperations } from "../logic/listPrivateOperations";

/**
 * Performs the public (transparent) portion of the Aleo account sync.
 *
 * Retrieves public operations, transparent balance and block height. When a
 * private sync is not scheduled this result also preserves the existing private
 * operations from the previous cycle so that the account remains complete.
 */
export async function performPublicSync(
  info: AccountShapeInfo<AleoAccount>,
  _syncConfig: SyncConfig,
): Promise<Partial<AleoAccount>> {
  const { initialAccount, address, derivationMode, currency } = info;
  const viewKey = initialAccount ? extractViewKey(initialAccount) : undefined;

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
    ...(viewKey && { customData: viewKey }),
  });

  const [balances, latestBlock] = await Promise.all([
    getBalance(currency, address),
    lastBlock(currency),
  ]);

  const blockHeight = latestBlock?.height ?? initialAccount?.blockHeight ?? 0;
  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());

  const shouldSyncFromScratch = !initialAccount;
  const allOldOperations = shouldSyncFromScratch ? [] : (initialAccount?.operations ?? []);

  // Keep public and private ops separate so each cursor is derived from the correct op type.
  // Mixing them risks using a private op's blockHeight as the public sync cursor.
  const [oldPrivateOps, oldPublicOps] = splitPrivateAndPublicOperations(allOldOperations);
  const lastBlockHeight = shouldSyncFromScratch ? 0 : (oldPublicOps[0]?.blockHeight ?? 0);

  const latestAccountPublicOperations = await listOperations({
    currency,
    address,
    ledgerAccountId,
    mode: "bridge",
    options: {
      minHeight: 0,
      order: "asc",
      ...(lastBlockHeight > 0 && { cursor: lastBlockHeight.toString() }),
    },
  });

  // sort by date desc
  latestAccountPublicOperations.operations.sort((a, b) => b.date.getTime() - a.date.getTime());

  const publicOperations = shouldSyncFromScratch
    ? latestAccountPublicOperations.operations
    : (mergeOps(oldPublicOps, latestAccountPublicOperations.operations) as AleoOperation[]);

  // Preserve existing private operations so the public-only result is complete.
  // They will be replaced by performPrivateSync when the private sync runs.
  const preservedPrivateOps = shouldSyncFromScratch ? [] : (oldPrivateOps as AleoOperation[]);

  const operations = [...publicOperations, ...preservedPrivateOps].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  const preservedPrivateBalance = initialAccount?.aleoResources?.privateBalance ?? null;
  const totalBalance = transparentBalance.plus(preservedPrivateBalance ?? 0);

  return {
    type: "Account",
    id: ledgerAccountId,
    balance: totalBalance,
    spendableBalance: totalBalance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
    aleoResources: {
      transparentBalance,
      provableApi: initialAccount?.aleoResources?.provableApi ?? null,
      privateBalance: preservedPrivateBalance,
      unspentPrivateRecords: initialAccount?.aleoResources?.unspentPrivateRecords ?? null,
      lastPrivateSyncDate: initialAccount?.aleoResources?.lastPrivateSyncDate ?? null,
    },
  };
}

export function createPublicSyncObservable(
  info: AccountShapeInfo<AleoAccount>,
  syncConfig: SyncConfig,
): Observable<Partial<AleoAccount>> {
  const currencyId = info.currency.id;
  log("aleo/createPublicSyncObservable", `Initiating public sync for ${currencyId}`);
  return new Observable<Partial<AleoAccount>>(subscriber => {
    performPublicSync(info, syncConfig)
      .then(result => {
        log("aleo/createPublicSyncObservable", `Public sync completed for ${currencyId}`, {
          blockHeight: result.blockHeight,
          operationsCount: result.operationsCount,
        });
        subscriber.next(result);
        subscriber.complete();
      })
      .catch(err => {
        log("aleo/createPublicSyncObservable", `Public sync error for ${currencyId}`, {
          error: err.message,
        });
        subscriber.error(err);
      });
  });
}

/**
 * Performs the private sync for an Aleo account.
 *
 * @param currentPublicOps - The public operations from the current sync cycle
 *   (returned by performPublicSync). These are passed instead of being
 *   re-derived from initialAccount so that patchPublicOperations works against
 *   freshly-fetched data rather than the previous cycle's state.
 * @param freshTransparentBalance - The transparent balance from the current
 *   public sync cycle. Used to compute the correct total balance.
 */
export async function performPrivateSync(
  info: AccountShapeInfo<AleoAccount>,
  _syncConfig: SyncConfig,
  currentPublicOps: AleoOperation[],
  freshTransparentBalance?: BigNumber,
  emitProgressUpdates?: boolean,
): Promise<Partial<AleoAccount> | null> {
  const { initialAccount, address, derivationMode, currency } = info;
  invariant(initialAccount, "aleo: performPrivateSync requires initialAccount");

  const viewKey = extractViewKey(initialAccount);

  const provableApi = await accessProvableApi({
    currency,
    viewKey,
    provableApi: initialAccount.aleoResources?.provableApi ?? null,
  }).catch(err => {
    log("aleo/sync", "Error while configuring record scanner API access", {
      err,
      address,
      hasApiConfigured: !!initialAccount.aleoResources?.provableApi,
    });

    // this error means that the current provableApi configuration is invalid and needs to be reset
    if (err instanceof AleoApiConfigurationResetError) {
      throw err;
    }

    // for other errors (e.g. network issues) optimistically assume the existing provableApi is still valid
    // so the sync can be retried without forcing a new registration immediately
    if (initialAccount.aleoResources?.provableApi) {
      return initialAccount.aleoResources?.provableApi;
    }

    throw err;
  });

  if (!isProvableApiConfigured(provableApi)) {
    throw new AleoApiConfigurationResetError();
  }

  if (!isRecordScannerReady(provableApi)) {
    if (emitProgressUpdates && initialAccount.aleoResources) {
      return {
        operations: initialAccount.operations,
        operationsCount: initialAccount.operationsCount,
        aleoResources: {
          ...initialAccount.aleoResources,
          provableApi,
        },
      };
    }
    return null;
  }

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
    customData: viewKey,
  });

  const latestBlock = await lastBlock(currency);
  const blockHeight = latestBlock?.height ?? initialAccount?.blockHeight ?? 0;

  const allOldOperations = initialAccount.operations ?? [];
  const [oldPrivateOps] = splitPrivateAndPublicOperations(allOldOperations);
  const lastPrivateBlockHeight = oldPrivateOps[0]?.blockHeight ?? 0;

  const [rawNewPrivateRecords, rawUnspentPrivateRecords] = await Promise.all([
    fetchAllOwnedRecords({
      currency,
      uuid: provableApi.uuid,
      start: lastPrivateBlockHeight,
    }),
    fetchAllOwnedRecords({
      currency,
      uuid: provableApi.uuid,
      unspent: true,
    }),
  ]);

  const [latestAccountPrivateOperations, patchedPublicOperations] = await Promise.all([
    listPrivateOperations({
      currency,
      viewKey,
      address,
      ledgerAccountId,
      privateRecords: rawNewPrivateRecords,
    }),
    patchPublicOperations({
      currency,
      publicOperations: currentPublicOps,
      privateRecords: rawNewPrivateRecords,
      address,
      ledgerAccountId,
      viewKey,
    }),
  ]);

  // Record scanner API may return already-spent records even with "unspent: true" filter.
  // This is confirmed and expected behavior for now - scanner relies on two processes that can lag behind each other.
  // The workaround is to remove records whose tags appear as inputs in currently processed transactions.
  // Records spent before are expected to have been cleared from the scanner by then.
  const filteredUnspentRecords = rawUnspentPrivateRecords.filter(
    record => !latestAccountPrivateOperations.consumedRecordTags.has(record.tag),
  );

  const privateBalanceResult = await getPrivateBalance({
    currency,
    viewKey,
    privateRecords: filteredUnspentRecords,
    oldUnspentRecords: initialAccount.aleoResources?.unspentPrivateRecords ?? [],
  });
  const privateBalance = privateBalanceResult.balance;
  const unspentPrivateRecords: AleoUnspentRecord[] = privateBalanceResult.unspentRecords;

  // merge old and new private operations — same incremental pattern as public ops;
  // deduplication is by operation id (encodeOperationId(accountId, txHash, type))
  const privateOperations = mergeOps(oldPrivateOps, latestAccountPrivateOperations.operations);

  const operations = [...patchedPublicOperations, ...(privateOperations as AleoOperation[])].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  // Use the transparent balance from the current public sync cycle when supplied,
  // otherwise fall back to what the account last recorded.
  const transparentBalance =
    freshTransparentBalance ?? initialAccount.aleoResources?.transparentBalance ?? new BigNumber(0);
  const totalBalance = transparentBalance.plus(privateBalance ?? 0);

  log("aleo/performPrivateSync", "Private sync completed", {
    ledgerAccountId,
    privateOpsCount: latestAccountPrivateOperations.operations.length,
    patchedPublicOpsCount: patchedPublicOperations.length,
    privateBalance: privateBalance.toString(),
  });

  return {
    type: "Account",
    id: ledgerAccountId,
    balance: totalBalance,
    spendableBalance: totalBalance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: initialAccount?.lastSyncDate,
    aleoResources: {
      transparentBalance,
      provableApi,
      privateBalance,
      unspentPrivateRecords,
      lastPrivateSyncDate: new Date(),
    },
  };
}

export function createPrivateSyncObservable(
  info: AccountShapeInfo<AleoAccount>,
  syncConfig: SyncConfig,
  publicOps: AleoOperation[],
  freshTransparentBalance?: BigNumber,
  emitProgressUpdates?: boolean,
): Observable<Partial<AleoAccount>> {
  const { initialAccount } = info;
  const currencyId = info.currency.id;
  log("aleo/createPrivateSyncObservable", `Initiating private sync for ${currencyId}`);
  return new Observable<Partial<AleoAccount>>(subscriber => {
    performPrivateSync(info, syncConfig, publicOps, freshTransparentBalance, emitProgressUpdates)
      .then(result => {
        if (result) {
          log("aleo/createPrivateSyncObservable", `Private sync completed for ${currencyId}`, {
            operationsCount: result.operationsCount,
          });
          subscriber.next(result);
        } else {
          log(
            "aleo/createPrivateSyncObservable",
            `Private sync skipped for ${currencyId} — provableApi not ready`,
          );
        }
        subscriber.complete();
      })
      .catch(err => {
        if (err instanceof AleoApiConfigurationResetError && initialAccount?.aleoResources) {
          // set `provableApi` to null before surfacing the error so the next sync cycle starts fresh re-registration
          subscriber.next({
            operations: initialAccount.operations,
            operationsCount: initialAccount.operationsCount,
            aleoResources: {
              ...initialAccount.aleoResources,
              provableApi: null,
            },
          });
        }

        log("aleo/createPrivateSyncObservable", `Private sync error for ${currencyId}`, {
          error: err.message,
        });
        subscriber.error(err);
      });
  });
}

/**
 * Builds the list of sync observables to run based on syncConfig.syncType.
 *
 * When both public and private syncs are requested the two are chained
 * sequentially (public → private) so that private sync always receives
 * up-to-date public operations for patching.
 *
 * When only one sync type is requested a single observable is returned for
 * that type.
 */
export function buildSyncObservables(
  info: AccountShapeInfo<AleoAccount>,
  syncConfig: SyncConfig,
): { syncs: Observable<Partial<AleoAccount>>[]; syncType: number } {
  const { initialAccount } = info;
  const syncType = syncConfig.syncType ?? SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED;

  const viewKey = initialAccount ? extractViewKey(initialAccount) : undefined;
  const privateEnabled = !!initialAccount && !!viewKey;

  const isPublicSync = !!(syncType & SYNC_TYPE_TRANSPARENT);
  const isPrivateSync = !!(syncType & SYNC_TYPE_SHIELDED) && privateEnabled;

  const syncs: Observable<Partial<AleoAccount>>[] = [];

  if (isPublicSync && isPrivateSync) {
    syncs.push(
      createPublicSyncObservable(info, syncConfig).pipe(
        concatMap(publicResult =>
          concat(
            of(publicResult),
            createPrivateSyncObservable(
              info,
              syncConfig,
              // Pass only pure public ops - publicResult.operations also contains preserved
              // private ops from the previous cycle; feeding those into patchPublicOperations
              // would cause them to be re-processed and duplicated in the final result.
              splitPrivateAndPublicOperations(publicResult.operations ?? [])[1] as AleoOperation[],
              publicResult.aleoResources?.transparentBalance,
            ),
          ),
        ),
      ),
    );
  } else if (isPublicSync) {
    syncs.push(createPublicSyncObservable(info, syncConfig));
  } else if (isPrivateSync) {
    const [, initialPublicOps] = splitPrivateAndPublicOperations(initialAccount?.operations ?? []);
    syncs.push(
      createPrivateSyncObservable(
        info,
        syncConfig,
        initialPublicOps as AleoOperation[],
        undefined,
        true,
      ),
    );
  }

  return { syncs, syncType };
}

export function makeGetAccountShape(): GetAccountShapeStream<AleoAccount> {
  return (info: AccountShapeInfo<AleoAccount>, syncConfig: SyncConfig) =>
    new Observable(o => {
      const { currency } = info;
      const { syncs, syncType } = buildSyncObservables(info, syncConfig);

      if (syncs.length === 0) {
        log("aleo/makeGetAccountShape", `No syncs to perform for ${currency.id}`);
        o.complete();
        return;
      }

      log("aleo/makeGetAccountShape", `Running sync(s) for ${currency.id}`, {
        hasPublic: !!(syncType & SYNC_TYPE_TRANSPARENT),
        hasPrivate: !!(syncType & SYNC_TYPE_SHIELDED),
      });

      const subscription = merge(...syncs).subscribe({
        next: result => o.next(result),
        complete: () => o.complete(),
        error: err => o.error(err),
      });

      return () => subscription.unsubscribe();
    });
}

/**
 * Aleo doesn't have a per-account transaction nonce, so there is no natural value
 * to assign to `transactionSequenceNumber` on confirmed operations.
 *
 * The framework's `shouldRetainPendingOperation` drops a pending operation when the most recent
 * confirmed operation from the same sender has an equal or higher `transactionSequenceNumber`.
 *
 * Optimistic pending operations are created with increasing sequence numbers via `getNextSequenceNumber`,
 * because without this only one pending operation could be rendered in LW.
 * Confirmed operations lack this field, making the comparison always false and leaving pending operations stuck.
 *
 * Instead pending operations are removed here by matching on operation id:
 * once a confirmed operation with the same id appears in the confirmed list,
 * the corresponding pending operation is no longer needed.
 */
export function postSync(_initial: AleoAccount, synced: AleoAccount): AleoAccount {
  const pendingOperations = synced.pendingOperations ?? [];

  if (pendingOperations.length === 0) {
    return synced;
  }

  const confirmedIds = new Set(synced.operations.map(o => o.id));

  return {
    ...synced,
    pendingOperations: pendingOperations.filter(po => !confirmedIds.has(po.id)),
  };
}

export const sync = makeSync<AleoTransaction, AleoAccount>({
  getAccountShape: makeGetAccountShape(),
  shouldMergeOps: false,
  postSync,
});
