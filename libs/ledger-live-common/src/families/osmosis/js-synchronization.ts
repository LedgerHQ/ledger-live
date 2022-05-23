import { encodeAccountId } from "../../account";
import {
  makeSync,
  makeScanAccounts,
  GetAccountShape,
  mergeOps,
} from "../../bridge/jsHelpers";
import { getAccount, getOperations } from "./api";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { blockHeight, balance } = await getAccount(address);

  let operations = oldOperations;

  // For indexer efficiency reasons, only fetch new operations starting from the datetime
  // of the last operation previously fetched
  let lastOperationDate: Date | null = null;
  if (operations.length > 0) {
    operations.forEach((o) => {
      if (o.date != null) {
        if (lastOperationDate !== null) {
          if (o.date.valueOf() > lastOperationDate.valueOf()) {
            lastOperationDate = o.date;
          }
        } else {
          lastOperationDate = o.date;
        }
      }
    });
  }

  const newOperations = await getOperations(
    accountId,
    address,
    lastOperationDate
  );

  // Merge new operations with the previously synced ones
  operations = mergeOps(operations, newOperations);

  const shape = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
  };
  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
