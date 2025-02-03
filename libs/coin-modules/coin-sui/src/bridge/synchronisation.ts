import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  makeSync,
  mergeOps,
  type GetAccountShape,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccount, getOperations } from "../network";
import { SuiAccount } from "../types";

export const getAccountShape: GetAccountShape<SuiAccount> = async info => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  // Needed for incremental synchronisation
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // get the current account balance state depending your api implementation
  const { blockHeight, balance, additionalBalance, nonce } = await getAccount(address);

  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, startAt);
  const operations = mergeOps(oldOperations, newOperations);

  const shape = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operationsCount: operations.length,
    blockHeight,
    suiResources: {
      nonce,
      additionalBalance,
    },
  };

  return { ...shape, operations };
};

export const sync = makeSync({ getAccountShape });
