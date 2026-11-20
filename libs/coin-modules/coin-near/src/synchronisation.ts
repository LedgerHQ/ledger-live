import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { makeSync, mergeOpsKeepingOlder } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
import type { Operation } from "@ledgerhq/types-live";
import {
  fetchAccountDetails,
  fetchLegacyHistory,
  getAccount,
  getAccountStateFingerprint,
} from "./network";
import type { LegacyHistory } from "./network/indexer";
import { getCoinConfig, isStateDrivenSync } from "./config";
import { HISTORY_RECHECK_WINDOW_MS } from "./constants";
import { NearAccount, NearResources } from "./types";

type HistoryRead = { history?: LegacyHistory; failed: boolean };

const readLegacyHistory = async (
  read: () => Promise<LegacyHistory>,
  nothingToKeep: boolean,
  failureLasted: boolean,
): Promise<HistoryRead> => {
  try {
    return { history: await read(), failed: false };
  } catch (error) {
    // An empty history shown as true is worse than a failed sync, and so is a failure that has
    // lasted: the stored operations and marks stay, the next sync reads again.
    if (nothingToKeep || failureLasted) throw error;
    log("Near", "history read failed, keeping the stored operations", error);
    return { failed: true };
  }
};

type HistoryState = Pick<
  NearResources,
  "accountStateFingerprint" | "historyRecheckSince" | "historyRecheckFingerprint"
> & {
  /** The recheck window ended with nothing found: the pools are listed once more. */
  windowExpired?: boolean;
};

/**
 * Which account state the next sync compares against. A state change the history does not explain
 * yet (the indexer may lag the node) keeps the previous state, so the history is read again, until
 * something new comes back or the recheck window has passed. A new state during the recheck
 * restarts the window.
 */
const nextHistoryState = ({
  fingerprint,
  storedFingerprint,
  recheckSince,
  recheckFingerprint,
  historyFailed,
  unexplainedChange,
  now,
}: {
  fingerprint: string;
  storedFingerprint: string | undefined;
  recheckSince: number | undefined;
  recheckFingerprint: string | undefined;
  historyFailed: boolean;
  unexplainedChange: boolean;
  now: number;
}): HistoryState => {
  if (historyFailed) {
    return {
      ...(storedFingerprint !== undefined && { accountStateFingerprint: storedFingerprint }),
      ...(recheckSince !== undefined && { historyRecheckSince: recheckSince }),
      ...(recheckFingerprint !== undefined && { historyRecheckFingerprint: recheckFingerprint }),
    };
  }
  if (unexplainedChange && storedFingerprint !== undefined) {
    const since =
      recheckSince !== undefined && recheckFingerprint === fingerprint ? recheckSince : now;
    if (now - since < HISTORY_RECHECK_WINDOW_MS) {
      return {
        accountStateFingerprint: storedFingerprint,
        historyRecheckSince: since,
        historyRecheckFingerprint: fingerprint,
      };
    }
  }
  return {
    accountStateFingerprint: fingerprint,
    ...(unexplainedChange && storedFingerprint !== undefined && { windowExpired: true }),
  };
};

/**
 * New operations, a first sync's included, may be only part of the transactions behind the state
 * the indexer lags: the next sync reads the history once more. So does the first fingerprint of an
 * account stored before fingerprints existed. A failed read keeps the stored marker.
 */
const nextConfirmState = ({
  confirmPending,
  historyFailed,
  stateDriven,
  hasUnseenOperation,
  firstFingerprint,
  unsettledSince,
  unsettledHashes,
}: {
  confirmPending: boolean;
  historyFailed: boolean;
  stateDriven: boolean;
  hasUnseenOperation: boolean;
  firstFingerprint: boolean;
  /** When a read first returned an operation with no recorded outcome, if one is still without. */
  unsettledSince: number | undefined;
  /** The operations whose outcome is still missing, or was not read again. */
  unsettledHashes: string[];
}): Pick<
  NearResources,
  "historyConfirmPending" | "historyUnsettledSince" | "historyUnsettledHashes"
> => {
  const settling =
    unsettledSince !== undefined && Date.now() - unsettledSince < HISTORY_RECHECK_WINDOW_MS;
  const confirm = historyFailed
    ? confirmPending
    : stateDriven && (hasUnseenOperation || firstFingerprint || settling);
  return {
    ...(confirm && { historyConfirmPending: true }),
    ...(settling && { historyUnsettledSince: unsettledSince }),
    ...(settling && unsettledHashes.length > 0 && { historyUnsettledHashes: unsettledHashes }),
  };
};

/**
 * When a read first returned an operation with no recorded outcome, while one is still without. A
 * failed read keeps the first sighting: failures do not extend its hour. An operation newly without
 * starts a fresh hour, shared with those already waiting, so it is not dropped early.
 */
const nextUnsettledSince = ({
  hasUnsettledOperation,
  addsUnsettledOperation,
  historyFailed,
  storedSince,
  now,
}: {
  hasUnsettledOperation: boolean;
  addsUnsettledOperation: boolean;
  historyFailed: boolean;
  storedSince: number | undefined;
  now: number;
}): number | undefined => {
  if (hasUnsettledOperation) return addsUnsettledOperation ? now : (storedSince ?? now);
  return historyFailed ? storedSince : undefined;
};

/**
 * The operations whose outcome is not settled: those read without one, and the stored ones that
 * this read did not reach or did not read again (the indexer lists them by block, so a later
 * confirmation may stop above them). A failed read keeps the stored ones.
 */
const nextUnsettledHashes = (
  history: LegacyHistory | undefined,
  storedHashes: string[],
  historyFailed: boolean,
): string[] => {
  if (history === undefined) return historyFailed ? storedHashes : [];
  const read = new Set(history.operations.map(({ hash }) => hash));
  return [
    ...new Set([...history.outcomePendingHashes, ...storedHashes.filter(hash => !read.has(hash))]),
  ];
};

/**
 * The newest stored operation when a read finds new ones: the confirmation read pages until it,
 * so a transaction indexed late below the new ones is not missed. An earlier boundary stays (it is
 * lower). A read across a gap, or with nothing stored, has none; a failed read keeps the stored one.
 */
const nextConfirmBoundary = ({
  stored,
  newest,
  historyFailed,
  hasUnseenOperation,
  stateDriven,
  gap,
}: {
  stored: string | undefined;
  newest: string | undefined;
  historyFailed: boolean;
  hasUnseenOperation: boolean;
  stateDriven: boolean;
  gap: boolean;
}): string | undefined => {
  if (historyFailed) return stored;
  if (!stateDriven || !hasUnseenOperation) return undefined;
  return stored ?? (gap ? undefined : newest);
};

type StoredGenericAccount = { stakingPositions?: { delegate?: string }[] } | undefined;

/** The pools already known: the stored ones, and those the generic bridge keeps on the account. */
const knownPoolIds = (initialAccount: NearAccount | undefined): string[] => {
  // The generic bridge keeps its own positions on the account and leaves `nearResources` as it was:
  // after a switch back to this sync, its pools are known pools too.
  const genericPools = ((initialAccount as StoredGenericAccount)?.stakingPositions ?? []).flatMap(
    ({ delegate }) => (delegate ? [delegate] : []),
  );
  const legacyPools =
    initialAccount?.nearResources?.stakingPositions.map(position => position.validatorId) ?? [];
  return [...new Set([...legacyPools, ...genericPools])];
};

/**
 * A candidate whose read shows no position stays one for an hour from when it was first named:
 * the pool may not have executed the staking call when the read ran. The candidates a generic sync
 * left in its mark are taken over: their staking call is already stored, so no read names them again.
 */
const openCandidatePools = (
  stored: NearResources | undefined,
  genericMark: NearAccount["historyRecheck"],
  now: number,
): { pools: string[]; since: number | undefined } => {
  const open = (pools: string[] | undefined, since: number | undefined) =>
    pools?.length && (since === undefined || now - since < HISTORY_RECHECK_WINDOW_MS)
      ? { pools, since: since ?? now }
      : undefined;
  const opened = [
    open(stored?.pendingCandidatePools, stored?.pendingCandidatesSince),
    open(genericMark?.validatorIds, genericMark?.validatorsSince),
  ].filter(candidates => candidates !== undefined);
  return {
    pools: [...new Set(opened.flatMap(({ pools }) => pools))],
    since: opened.length > 0 ? Math.min(...opened.map(({ since }) => since)) : undefined,
  };
};

/**
 * The pools of recent staking calls: a pool named by a recent call may not have executed it yet, or
 * the listing may not have indexed it, a first sync included. A pool named by an older call that
 * shows no position was emptied.
 */
const recentCalledPools = (history: LegacyHistory | undefined, now: number): string[] => {
  const operationDates = new Map(
    (history?.operations ?? []).map(({ hash, date }) => [hash, date.getTime()]),
  );
  return [...(history?.stakingPoolsCalled ?? [])]
    .filter(([hash]) => now - (operationDates.get(hash) ?? 0) < HISTORY_RECHECK_WINDOW_MS)
    .map(([, poolId]) => poolId);
};

/** What the history marks of an account with no operation say: read empty, or still lagging. */
const emptyHistoryMarks = ({
  history,
  accountDetails,
  stored,
  now,
}: {
  history: LegacyHistory | undefined;
  accountDetails: unknown;
  stored: NearResources | undefined;
  now: number;
}): Pick<NearResources, "historyEmpty" | "historyEmptySince"> => {
  // An account unknown to the node has no history yet: it keeps its fingerprint, so its unchanged
  // state skips the history.
  if (history === undefined) return stored?.historyEmpty === true ? { historyEmpty: true } : {};
  if (accountDetails === undefined) return { historyEmpty: true };
  // An empty history for an account the node knows means the indexer lags, for an hour; after that
  // it is taken as empty (an account funded only by receipts, say).
  const emptySince = stored?.historyEmptySince ?? now;
  return now - emptySince >= HISTORY_RECHECK_WINDOW_MS
    ? { historyEmpty: true }
    : { historyEmptySince: emptySince };
};

/**
 * The stored operations a generic mark still had to read again: those at or above the height its
 * read started from. The legacy read pages until it has read each of them.
 */
const genericRangeHashes = (
  mark: NearAccount["historyRecheck"],
  operations: Operation[],
): string[] => {
  const minHeight = mark?.minHeight;
  if (minHeight === undefined) return [];
  return operations
    .filter(({ blockHeight }) => (blockHeight ?? -1) >= minHeight)
    .map(({ hash }) => hash);
};

/**
 * A full page may hide older staking calls: the pools are listed on the confirmation read too, as
 * the first listing may have lagged behind them.
 */
const fullPageHidesCalls = (history: LegacyHistory | undefined, reading: boolean): boolean =>
  history?.isFullPage === true && reading;

/**
 * The candidate pools still waiting for a position. Their staking call is already stored, so no
 * later history read names them again. A candidate whose read failed is kept whatever its age: the
 * read says nothing about the pool. A pool newly named starts a fresh hour, shared with those
 * already waiting.
 */
const nextCandidateMarks = ({
  storedCandidates,
  storedCandidatesSince,
  named,
  candidatePools,
  heldPositions,
  now,
}: {
  storedCandidates: string[];
  storedCandidatesSince: number | undefined;
  named: string[];
  candidatePools: string[];
  heldPositions: string[];
  now: number;
}): Pick<NearResources, "pendingCandidatePools" | "pendingCandidatesSince"> => {
  const unresolved = [...new Set([...storedCandidates, ...named])].filter(
    id => candidatePools.includes(id) && !heldPositions.includes(id),
  );
  if (unresolved.length === 0) return {};
  const keepsWindow = unresolved.every(id => storedCandidates.includes(id));
  return {
    pendingCandidatePools: unresolved,
    pendingCandidatesSince: keepsWindow ? (storedCandidatesSince ?? now) : now,
  };
};

/** The resources without the legacy sync's marks of what it still owes. */
const withoutLegacyMarks = (resources: NearResources | undefined): NearResources | undefined => {
  if (!resources) return resources;
  const {
    historyRecheckSince: _recheckSince,
    historyRecheckFingerprint: _recheckFingerprint,
    historyConfirmPending: _confirmPending,
    historyConfirmBoundary: _confirmBoundary,
    historyUnsettledHashes: _unsettledHashes,
    historyUnsettledSince: _unsettledSince,
    historyFailedSince: _failedSince,
    historyEmpty: _empty,
    historyEmptySince: _emptySince,
    pendingCandidatePools: _candidates,
    pendingCandidatesSince: _candidatesSince,
    poolListingPending: _listingPending,
    ...kept
  } = resources;
  return kept;
};

/**
 * The marks the sync starts from. A sync hash means the generic sync ran last: the legacy marks then
 * date from before it and its own mark says what is still owed (a history read, failed, unexplained
 * or to confirm, and a pool listing), so they are not read. Its failure run goes on here, so a
 * lasting failure still surfaces after the hour; its candidate pools are taken over by the caller.
 */
const storedMarks = (initialAccount: NearAccount | undefined) => {
  const stored = initialAccount?.syncHash
    ? withoutLegacyMarks(initialAccount.nearResources)
    : initialAccount?.nearResources;
  const genericMark = initialAccount?.historyRecheck;
  const genericFailedSince = genericMark?.reason === "failed" ? genericMark.failedSince : undefined;
  return {
    stored,
    genericMark,
    genericOwesRead: genericMark !== undefined && genericMark.reason !== "pools",
    storedFailedSince: stored?.historyFailedSince ?? genericFailedSince,
  };
};

/**
 * Keys the legacy shape clears on the stored account. `makeSync` merges the shape over the
 * account, so a key given as `undefined` is dropped; `Partial<NearAccount>` does not allow that
 * value, hence the cast.
 */
const legacyShapeClears = (initialAccount: NearAccount | undefined): Partial<NearAccount> => {
  const cleared: Record<string, undefined> = {};
  // The generic sync's resume state: cleared, so a switch back to it starts from scratch rather
  // than skip a history read this sync still owes (its own marks stay in `nearResources`).
  if (initialAccount?.historyRecheck !== undefined) cleared.historyRecheck = undefined;
  // The generic positions would shadow the ones this sync keeps in `nearResources`.
  if ((initialAccount as StoredGenericAccount)?.stakingPositions !== undefined) {
    cleared.stakingPositions = undefined;
  }
  return {
    ...cleared,
    ...(initialAccount?.syncHash ? { syncHash: "" } : {}),
  } as Partial<NearAccount>;
};

export const getAccountShape: GetAccountShape<NearAccount> = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const config = getCoinConfig();
  const stateDriven = isStateDrivenSync(config);
  const { stored, genericMark, genericOwesRead, storedFailedSince } = storedMarks(initialAccount);
  const firstSync = !initialAccount;
  const storedPools = knownPoolIds(initialAccount);
  // A cleared account cache empties the operations but keeps the NEAR resources: without stored
  // operations, the stored state says nothing about what the history holds, unless the history was
  // read empty.
  const storedFingerprint =
    oldOperations.length > 0 || stored?.historyEmpty === true
      ? stored?.accountStateFingerprint
      : undefined;
  const recheckSince = stored?.historyRecheckSince;
  const recheckFingerprint = stored?.historyRecheckFingerprint;
  const confirmPending = stored?.historyConfirmPending === true;
  const hasPendingOperation = (initialAccount?.pendingOperations?.length ?? 0) > 0;

  const accountDetails = await fetchAccountDetails(config, address);
  const fingerprint = await getAccountStateFingerprint(
    config,
    address,
    accountDetails,
    stored?.accountStateFingerprint,
  );
  const fingerprintChanged = fingerprint !== storedFingerprint;

  // A stored failure keeps the read on: the retry must outlive the cause that first asked for it
  // (a pending operation that expired, say), and only a successful read clears the mark.
  const readHistory =
    genericOwesRead ||
    !stateDriven ||
    firstSync ||
    fingerprintChanged ||
    hasPendingOperation ||
    recheckSince !== undefined ||
    confirmPending ||
    storedFailedSince !== undefined;

  // An account the node knows has received at least one transaction: with no stored operations
  // (first sync, cleared cache), a failed read leaves nothing to keep.
  const nothingToKeep = firstSync || (oldOperations.length === 0 && accountDetails !== undefined);
  const now = Date.now();
  const failureLasted =
    storedFailedSince !== undefined && now - storedFailedSince >= HISTORY_RECHECK_WINDOW_MS;
  const knownHashes = new Set(oldOperations.map(operation => operation.hash));
  // The range the generic mark still had to read is read whole, and kept as unsettled until it is.
  const storedUnsettledHashes = [
    ...new Set([
      ...(stored?.historyUnsettledHashes ?? []),
      ...genericRangeHashes(genericOwesRead ? genericMark : undefined, oldOperations),
    ]),
  ];
  const storedBoundary = confirmPending ? stored?.historyConfirmBoundary : undefined;
  const { history, failed: historyFailed } = readHistory
    ? await readLegacyHistory(
        () =>
          fetchLegacyHistory(
            config,
            accountId,
            address,
            knownHashes,
            new Set([...storedUnsettledHashes, ...(storedBoundary ? [storedBoundary] : [])]),
          ),
        nothingToKeep,
        failureLasted,
      )
    : { history: undefined, failed: false };

  const hasUnseenOperation =
    history?.operations.some(({ hash }) => !knownHashes.has(hash)) ?? false;
  // A known pool called again may show no position yet (a deposit it has not executed, say): it is a
  // candidate too, or a read without it would drop it from the known pools. Only an unknown one is
  // listed.
  const calledPools = [...(history?.stakingPoolsCalled ?? [])]
    .filter(([hash]) => !knownHashes.has(hash))
    .map(([, poolId]) => poolId);
  const newPools = calledPools.filter(poolId => !storedPools.includes(poolId));
  const { pools: storedCandidates, since: storedCandidatesSince } = openCandidatePools(
    stored,
    genericMark,
    now,
  );
  const candidatePools = [...new Set([...storedCandidates, ...calledPools])];
  // The data of a relayed call does not name its pool: the pools are listed.
  const hasUnseenRelayedCall = history?.relayedHashes.some(hash => !knownHashes.has(hash)) ?? false;

  const listingNeeded =
    !stateDriven ||
    firstSync ||
    !storedFingerprint ||
    historyFailed ||
    stored?.poolListingPending === true ||
    genericMark?.listing === true ||
    fullPageHidesCalls(history, hasUnseenOperation || confirmPending) ||
    newPools.length > 0 ||
    hasUnseenRelayedCall;

  const {
    blockHeight,
    balance,
    spendableBalance,
    nearResources,
    poolListingFailed,
    failedCandidates,
  } = await getAccount(
    config,
    address,
    firstSync
      ? // No known pools: a failed first listing still fails the sync.
        { accountDetails, candidateValidatorIds: candidatePools }
      : {
          accountDetails,
          knownValidatorIds: storedPools,
          listValidators: listingNeeded,
          candidateValidatorIds: candidatePools,
        },
  );

  const { windowExpired, ...historyMarks } = nextHistoryState({
    fingerprint,
    storedFingerprint,
    recheckSince,
    recheckFingerprint,
    historyFailed,
    unexplainedChange: stateDriven && fingerprintChanged && !hasUnseenOperation,
    now,
  });
  const candidateMarks = nextCandidateMarks({
    storedCandidates,
    storedCandidatesSince,
    named: [...recentCalledPools(history, now), ...failedCandidates],
    candidatePools,
    heldPositions: nearResources.stakingPositions.map(({ validatorId }) => validatorId),
    now,
  });

  const unsettledHashes = nextUnsettledHashes(history, storedUnsettledHashes, historyFailed);

  const confirmBoundary = nextConfirmBoundary({
    stored: stored?.historyConfirmBoundary,
    newest: oldOperations[0]?.hash,
    historyFailed,
    hasUnseenOperation,
    stateDriven,
    gap: history?.gap === true,
  });

  const resources: NearResources = {
    ...nearResources,
    ...historyMarks,
    ...nextConfirmState({
      confirmPending,
      historyFailed,
      stateDriven,
      hasUnseenOperation,
      firstFingerprint: oldOperations.length > 0 && stored?.accountStateFingerprint === undefined,
      unsettledHashes,
      unsettledSince: nextUnsettledSince({
        hasUnsettledOperation: history !== undefined && unsettledHashes.length > 0,
        addsUnsettledOperation: unsettledHashes.some(hash => !storedUnsettledHashes.includes(hash)),
        historyFailed,
        storedSince: stored?.historyUnsettledSince ?? genericMark?.unsettledSince,
        now,
      }),
    }),
    ...(confirmBoundary !== undefined && { historyConfirmBoundary: confirmBoundary }),
    ...((poolListingFailed || windowExpired) && { poolListingPending: true }),
    ...candidateMarks,
    ...(historyFailed && { historyFailedSince: storedFailedSince ?? now }),
  };

  // The confirmation read may list a transaction indexed late below every stored one.
  const operations = mergeOpsKeepingOlder(
    history?.gap ? [] : oldOperations,
    history?.operations ?? [],
  );
  if (operations.length === 0) {
    Object.assign(resources, emptyHistoryMarks({ history, accountDetails, stored, now }));
  }

  return {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    nearResources: resources,
    ...legacyShapeClears(initialAccount),
    operations,
  };
};

const postSync = (initial: NearAccount, synced: NearAccount): NearAccount => {
  const pendingOperations = initial.pendingOperations || [];

  if (pendingOperations.length === 0) {
    return synced;
  }

  const { operations } = synced;

  synced.pendingOperations = pendingOperations.filter(
    po => !operations.some(o => o.hash === po.hash),
  );

  return synced;
};

export const sync = makeSync({
  getAccountShape,
  postSync,
  // The shape already holds the whole history, or replaces it across a gap.
  shouldMergeOps: false,
});
