import type { Account } from "../../types";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccountDetails } from "./api";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const {
    blockHeight,
    balance,
    spendableBalance,
    operations: newOperations,
  } = await getAccountDetails(address, accountId);
  const operations = mergeOps(oldOperations, newOperations);
  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
  };
  return { ...shape, operations };
};

const postSync = (_initial: Account, parent: Account) => {
  return parent;
};

export const scanAccounts = makeScanAccounts(getAccountShape);
export const sync = makeSync(getAccountShape, postSync);
