import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { makeSync, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
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
): Promise<HistoryRead> => {
  try {
    return { history: await read(), failed: false };
  } catch (error) {
    // An empty history shown as true is worse than a failed sync.
    if (nothingToKeep) throw error;
    log("Near", "history read failed, keeping the stored operations", error);
    return { failed: true };
  }
};

type HistoryState = Pick<
  NearResources,
  "accountStateFingerprint" | "historyRecheckSince" | "historyRecheckFingerprint"
>;

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
  return { accountStateFingerprint: fingerprint };
};

/**
 * New operations, a first sync's included, may be only part of the transactions behind the state
 * the indexer lags: the next sync reads the history once more. A failed read keeps the stored marker.
 */
const nextConfirmState = ({
  confirmPending,
  historyFailed,
  stateDriven,
  hasUnseenOperation,
}: {
  confirmPending: boolean;
  historyFailed: boolean;
  stateDriven: boolean;
  hasUnseenOperation: boolean;
}): Pick<NearResources, "historyConfirmPending"> => {
  const confirm = historyFailed ? confirmPending : stateDriven && hasUnseenOperation;
  return confirm ? { historyConfirmPending: true } : {};
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
  const stored = initialAccount?.nearResources;
  const firstSync = !initialAccount;
  const storedPools = stored?.stakingPositions.map(position => position.validatorId) ?? [];
  // A cleared account cache empties the operations but keeps the NEAR resources: without stored
  // operations, the stored state says nothing about what the history holds.
  const storedFingerprint = oldOperations.length > 0 ? stored?.accountStateFingerprint : undefined;
  const recheckSince = stored?.historyRecheckSince;
  const recheckFingerprint = stored?.historyRecheckFingerprint;
  const confirmPending = stored?.historyConfirmPending === true;
  const hasPendingOperation = (initialAccount?.pendingOperations?.length ?? 0) > 0;

  const accountDetails = await fetchAccountDetails(config, address);
  const fingerprint = await getAccountStateFingerprint(config, address, accountDetails);
  const fingerprintChanged = fingerprint !== storedFingerprint;

  const readHistory =
    !stateDriven ||
    firstSync ||
    fingerprintChanged ||
    hasPendingOperation ||
    recheckSince !== undefined ||
    confirmPending;

  // An account the node knows has received at least one transaction: with no stored operations
  // (first sync, cleared cache), a failed read leaves nothing to keep.
  const nothingToKeep = firstSync || (oldOperations.length === 0 && accountDetails !== undefined);
  const { history, failed: historyFailed } = readHistory
    ? await readLegacyHistory(() => fetchLegacyHistory(config, accountId, address), nothingToKeep)
    : { history: undefined, failed: false };

  const knownHashes = new Set(oldOperations.map(operation => operation.hash));
  const hasUnseenOperation =
    history?.operations.some(({ hash }) => !knownHashes.has(hash)) ?? false;
  const newPools = [...(history?.stakingPoolsCalled ?? [])]
    .filter(([hash, poolId]) => !knownHashes.has(hash) && !storedPools.includes(poolId))
    .map(([, poolId]) => poolId);
  const candidatePools = [...new Set([...(stored?.pendingCandidatePools ?? []), ...newPools])];

  const listingNeeded =
    !stateDriven ||
    firstSync ||
    !storedFingerprint ||
    historyFailed ||
    stored?.poolListingPending === true ||
    (history?.isFullPage === true && hasUnseenOperation) ||
    newPools.length > 0;

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

  const resources: NearResources = {
    ...nearResources,
    ...nextHistoryState({
      fingerprint,
      storedFingerprint,
      recheckSince,
      recheckFingerprint,
      historyFailed,
      unexplainedChange: stateDriven && fingerprintChanged && !hasUnseenOperation,
      now: Date.now(),
    }),
    ...nextConfirmState({
      confirmPending,
      historyFailed,
      stateDriven,
      hasUnseenOperation,
    }),
    ...(poolListingFailed && { poolListingPending: true }),
    // Their staking call is already stored, so no later history read names them again.
    ...(failedCandidates.length > 0 && { pendingCandidatePools: failedCandidates }),
  };

  const operations = mergeOps(oldOperations, history?.operations ?? []);

  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    nearResources: resources,
  };

  return { ...shape, operations };
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

export const sync = makeSync({ getAccountShape, postSync });
