import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  type GetAccountShape,
  makeSync,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { KaspaAccount } from "../types/bridge";
import { BigNumber } from "bignumber.js";

export const getAccountShape: GetAccountShape<KaspaAccount> = async (info, syncConfig) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  // Needed for incremental synchronisation
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // get the current account balance state depending your api implementation
  const { blockHeight, balance, additionalBalance, nonce } = {
    blockHeight: 42,
    balance: 1234.0,
    additionalBalance: 0,
    nonce: 0,
  };

  // Merge new operations with the previously synced ones
  const newOperations = initialAccount?.operations || [];
  const operations = mergeOps(oldOperations, newOperations);

  return {
    id: accountId,
    xpub: address,
    blockHeight: 42,
    balance: BigNumber(9887),
    spendableBalance: BigNumber(42),
    operations,
    operationsCount: 0,
    later: "maybe",
  };
};

export const sync = makeSync({ getAccountShape });
