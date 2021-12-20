import type { Account, Operation } from "../../types";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeScanAccounts, makeSync } from "../../bridge/jsHelpers";
import { fetchAccount, fetchOperations } from "./api";
import { buildSubAccounts } from "./tokens";

const getAccountShape: GetAccountShape = async (info, syncConfig) => {
  const { address, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const { blockHeight, balance, spendableBalance, assets } = await fetchAccount(
    address
  );

  // TODO: ??? How could we optimize this to avoid fetching all data on every
  // request? Could we save allOperations on the Account object?
  const allOperations = (await fetchOperations(accountId, address)) || [];

  const nativeOperations: Operation[] = [];
  const assetOperations: Operation[] = [];

  allOperations.forEach((op) => {
    if (op?.extra?.assetCode && op?.extra?.assetIssuer) {
      assetOperations.push(op);
    } else {
      nativeOperations.push(op);
    }
  });

  const subAccounts =
    buildSubAccounts({
      currency,
      accountId,
      assets,
      syncConfig,
      operations: assetOperations,
    }) || [];

  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: nativeOperations.length,
    blockHeight,
    subAccounts,
  };
  return { ...shape, operations: nativeOperations };
};

const postSync = (initial: Account, parent: Account) => {
  return parent;
};

export const sync = makeSync(getAccountShape, postSync);
export const scanAccounts = makeScanAccounts(getAccountShape);
