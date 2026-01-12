import BigNumber from "bignumber.js";
import invariant from "invariant";
import { type GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { Operation } from "@ledgerhq/types-live";
import { getBalance } from "../logic";
import type { AleoAccount } from "../types";

export const getAccountShape: GetAccountShape<AleoAccount> = async infos => {
  const { initialAccount, address, derivationMode, currency } = infos;
  let viewKey: string | undefined;

  if (initialAccount) {
    viewKey = decodeAccountId(initialAccount.id).customData;
    invariant(viewKey, `aleo: viewKey is missing in initialAccount ${initialAccount.id}`);
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

  const balances = await getBalance(currency, address);
  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());
  const privateBalance = null;
  const spendableBalance = transparentBalance.plus(privateBalance ?? 0);

  const blockHeight = 0;
  const operations: Operation[] = [];

  return {
    type: "Account",
    id: accountId,
    balance: spendableBalance,
    spendableBalance: spendableBalance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
    aleoResources: {
      transparentBalance,
      privateBalance,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
});
