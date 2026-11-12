import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { makeSync, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
import type { Operation } from "@ledgerhq/types-live";
import {
  accountStateFingerprint,
  fetchAccountDetails,
  fetchAccountKeyNonce,
  getAccount,
  getOperations,
} from "./network";
import { getCoinConfig } from "./config";
import { NearAccount } from "./types";

// One page of history (the indexer's default size) is all the legacy sync reads.
const HISTORY_PAGE_SIZE = 25;

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
  const previous = initialAccount?.nearResources;
  const knownValidatorIds = previous?.stakingPositions.map(({ validatorId }) => validatorId);

  // The node account state changes with every transaction that touches the account, so an
  // unchanged state means the indexer has no new operation to return.
  const [details, keyNonce] = await Promise.all([
    fetchAccountDetails(config, address),
    fetchAccountKeyNonce(config, address),
  ]);
  const fingerprint = accountStateFingerprint(details, keyNonce);
  const hasPendingOperations = (initialAccount?.pendingOperations?.length ?? 0) > 0;
  const historyMayHaveChanged =
    !previous || previous.accountStateFingerprint !== fingerprint || hasPendingOperations;

  let newOperations: Operation[] = [];
  let historyFetched = false;
  if (historyMayHaveChanged) {
    try {
      newOperations = await getOperations(config, accountId, address);
      historyFetched = true;
    } catch (error) {
      // A first sync must never show an empty history as if it were true.
      if (!previous) throw error;
      log("Near", "history fetch failed, keeping the stored operations", error);
    }
  }

  const isNew = (op: Operation) => !oldOperations.some(({ hash }) => hash === op.hash);
  const unseen = newOperations.filter(isNew);
  // List the account's staking pools only when one may have been added since the last sync: a
  // staking call is signed by the account itself, so it shows in its own history whichever wallet
  // sent it. A full page of unseen operations may hide older ones, so it lists too.
  const discover =
    !previous ||
    previous.accountStateFingerprint === undefined ||
    (historyMayHaveChanged && !historyFetched) ||
    unseen.length >= HISTORY_PAGE_SIZE ||
    unseen.some(({ extra }) => {
      const pool = (extra as { stakingPool?: string } | undefined)?.stakingPool;
      return pool !== undefined && !knownValidatorIds?.includes(pool);
    });

  const { blockHeight, balance, spendableBalance, nearResources } = await getAccount(
    config,
    address,
    { details, knownValidatorIds, discover },
  );

  const operations = mergeOps(oldOperations, newOperations);
  // Keep the previous state, so the next sync reads the history again, after a failed fetch, and
  // once when the state changed but the indexer returned nothing new (it may not have indexed the
  // transaction yet). The second time, the change is accepted as one without an operation.
  const changedWithoutOperation =
    historyFetched &&
    previous !== undefined &&
    !hasPendingOperations &&
    unseen.length === 0 &&
    previous.accountStateFingerprint !== fingerprint;
  const recheck = changedWithoutOperation && !previous?.historyRecheckPending;
  nearResources.accountStateFingerprint =
    historyFetched && !recheck ? fingerprint : previous?.accountStateFingerprint;
  if (recheck) nearResources.historyRecheckPending = true;

  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    nearResources,
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
