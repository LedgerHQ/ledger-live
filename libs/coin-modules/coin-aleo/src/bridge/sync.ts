import BigNumber from "bignumber.js";
import invariant from "invariant";
import { type GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { Account, Operation } from "@ledgerhq/types-live";

export const getAccountShape: GetAccountShape<Account> = async infos => {
  const { initialAccount, address, derivationMode, currency } = infos;
  let viewKey: string | undefined;

  if (initialAccount) {
    viewKey = decodeAccountId(initialAccount.id).customData;
    invariant(viewKey, `aleo: viewKey is missing in ${address} initialAccount`);
  }

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
    ...(viewKey && {
      customData: viewKey,
    }),
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
