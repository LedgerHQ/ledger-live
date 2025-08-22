import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccount, getOperations } from "./api";
import { NearAccount } from "./types";

export const getAccountShape: GetAccountShape<NearAccount> = async (info, syncConfig) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const { onBalancesUpdate } = syncConfig || {};
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { blockHeight, balance, spendableBalance, nearResources } = await getAccount(address);
  
  // Emit balance update for optimistic UI updates (Step 1 of balance freshness strategy)
  if (onBalancesUpdate && balance) {
    onBalancesUpdate([{ id: accountId, balance }]);
  }

  const newOperations = await getOperations(accountId, address);
  const operations = mergeOps(oldOperations, newOperations);

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
