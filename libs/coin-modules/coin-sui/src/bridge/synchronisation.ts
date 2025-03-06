import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  makeSync,
  mergeOps,
  type GetAccountShape,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccount, getOperations } from "../network";
import { SuiAccount } from "../types";
import { OperationType, type Operation } from "@ledgerhq/types-live";

export const getAccountShape: GetAccountShape<SuiAccount> = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const { blockHeight, nonce, balance } = await getAccount(address);

  // Merge new operations with the previously synced ones
  let operations: Operation[] = [];
  try {
    // Needed for incremental synchronisation
    const startAtIn = latestHash(oldOperations, "IN");
    const startAtOut = latestHash(oldOperations, "OUT");
    const newOperations = await getOperations(accountId, address, startAtIn, startAtOut);
    operations = mergeOps(oldOperations, newOperations);
  } catch (e) {
    // if we could NOT sync with existing transaction - we start from the beggining, rewritting transaction history
    operations = await getOperations(accountId, address);
  }

  const shape = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    suiResources: {
      nonce,
    },
  };
  return { ...shape, operations };
};

export const sync = makeSync({ getAccountShape });

function latestHash(operations: Operation[], type: OperationType) {
  return operations.find(el => type === el.type)?.blockHash ?? null;
}
