import { type GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import type { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getBalance, lastBlock, listOperations } from "../logic";
import type { AleoAccount } from "../types";

export const getAccountShape: GetAccountShape<AleoAccount> = async infos => {
  const { address, derivationMode, currency } = infos;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const [latestBlock, balances] = await Promise.all([
    lastBlock(currency),
    getBalance(currency, address),
  ]);

  const operations: Operation[] = [];
  const blockHeight = latestBlock.height;

  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());

  const latestAccountPublicOperations = await listOperations({
    currency,
    address,
    ledgerAccountId,
    fetchAllPages: true,
    pagination: {
      minHeight: 0,
      order: "asc",
      ...(lastBlockHeight > 0 && { lastPagingToken: lastBlockHeight.toString() }),
    },
  });

  return {
    type: "Account",
    id: accountId,
    balance: transparentBalance,
    spendableBalance: transparentBalance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
    aleoResources: {
      transparentBalance,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
});
