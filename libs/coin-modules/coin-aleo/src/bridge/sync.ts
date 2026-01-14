import BigNumber from "bignumber.js";
import invariant from "invariant";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import {
  makeSync,
  mergeOps,
  type GetAccountShape,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getBalance, lastBlock, listOperations } from "../logic";
import type { AleoAccount } from "../types";

export const getAccountShape: GetAccountShape<AleoAccount> = async infos => {
  const { initialAccount, address, derivationMode, currency } = infos;

  if (initialAccount) {
    invariant(initialAccount.aleoResources.viewKey, "aleo: initialAccount must have a viewKey");
  }

  const [latestBlock, balances] = await Promise.all([
    lastBlock(currency),
    getBalance(currency, address),
  ]);

  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const nativeBalance = balances.find(b => b.asset.type === "native")?.value ?? BigInt(0);
  const transparentBalance = new BigNumber(nativeBalance.toString());
  const privateBalance = null;
  const spendableBalance = transparentBalance.plus(privateBalance ?? 0);

  const blockHeight = latestBlock.height;
  const shouldSyncFromScratch = !initialAccount;
  const oldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];
  const latestOperation = oldOperations[0];
  const minHeight = shouldSyncFromScratch ? 0 : latestOperation?.blockHeight ?? 0;
  const latestAccountOperations = await listOperations({
    currency,
    address,
    ledgerAccountId,
    pagination: { minHeight },
    direction: shouldSyncFromScratch ? "next" : "prev",
    fetchAllPages: true,
  });

  const operations = shouldSyncFromScratch
    ? latestAccountOperations.publicOperations
    : mergeOps(oldOperations, latestAccountOperations.publicOperations);

  return {
    type: "Account",
    id: ledgerAccountId,
    balance: spendableBalance,
    spendableBalance: spendableBalance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
    aleoResources: {
      viewKey: initialAccount?.aleoResources.viewKey ?? "",
      transparentBalance,
      privateBalance,
    },
  };
};

export const sync = makeSync({
  getAccountShape,
});
