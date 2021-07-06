//@flow
import type { Account } from "../../types";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { getAccount, getOperations } from "./api";

const getAccountShape: GetAccountShape = async (info) => {
  const { id, address, initialAccount, currency } = info;
  const oldOperations = initialAccount?.operations || [];
  const {
    blockHeight,
    balance,
    bondedBalance,
    redelegatingBalance,
    unbondingBalance,
    commissions,
  } = await getAccount(address, currency.id);

  // Merge new operations with the previously synced ones
  let startAt = 0;
  let maxIteration = 20;
  let operations = oldOperations;
  let newOperations = await getOperations(id, address, startAt++, currency.id);
  do {
    operations = mergeOps(operations, newOperations);
    newOperations = await getOperations(id, address, startAt++, currency.id);
  } while (--maxIteration && newOperations.length != 0);

  const shape = {
    id,
    balance,
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    cryptoOrgResources: {
      bondedBalance,
      redelegatingBalance,
      unbondingBalance,
      commissions,
    },
  };

  return { ...shape, operations };
};

const postSync = (initial: Account, parent: Account) => parent;

export const scanAccounts = makeScanAccounts(getAccountShape);

export const sync = makeSync(getAccountShape, postSync);
