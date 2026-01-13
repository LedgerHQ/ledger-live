import BigNumber from "bignumber.js";
import { type GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { Account, Operation } from "@ledgerhq/types-live";

export const getAccountShape: GetAccountShape<Account> = async infos => {
  const { address, derivationMode, currency } = infos;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const balance = new BigNumber(0);
  const blockHeight = 0;
  const operations: Operation[] = [];

  return {
    type: "Account",
    id: accountId,
    balance,
    spendableBalance: balance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
  };
};

export const sync = makeSync({
  getAccountShape,
});
