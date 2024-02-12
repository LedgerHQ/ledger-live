import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccount, getOperations } from "./api";

const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const {
    blockHeight,
    balance,
    bondedBalance,
    redelegatingBalance,
    unbondingBalance,
    commissions,
  } = await getAccount(address, currency.id);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  // Merge new operations with the previously synced ones
  let startAt = 0;
  let maxIteration = 20;
  let operations = oldOperations;
  let newOperations = await getOperations(accountId, address, startAt++, currency.id);

  do {
    operations = mergeOps(operations, newOperations);
    newOperations = await getOperations(accountId, address, startAt++, currency.id);
  } while (--maxIteration && newOperations.length != 0);

  const shape = {
    id: accountId,
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

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
