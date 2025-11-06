import { BigNumber } from "bignumber.js";

import eip55 from "eip55";
import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";

import { getAccount, getLastBlockHeight, getOperations, getTokenOperations } from "../network";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import { isAccountEmpty } from "./helpers";
import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";

export const getAccountShape: GetAccountShape<Account> = async info => {
  const { initialAccount, currency, derivationMode } = info;
  const address = eip55.encode(info.address);

  const oldOperations = initialAccount?.operations || [];
  const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 1;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // get the current account balance state depending your api implementation
  const { balance, energy } = await getAccount(address);

  // get the current block height
  const blockHeight = await getLastBlockHeight();

  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, startAt);

  //Get last token operations
  const vthoToken = await getCryptoAssetsStore().findTokenById("vechain/vip180/vtho");
  if (!vthoToken) throw new Error("VTHO token not found");
  const vthoAccountId = encodeTokenAccountId(accountId, vthoToken);
  const vthoOperations = await getTokenOperations(vthoAccountId, address, VTHO_ADDRESS, 1); // from parameter must be 1 otherwise the response is empty

  const operations = mergeOps(oldOperations, newOperations);

  //Account creation date set to now if there are no operation or at the first operation on the account
  let minDate = -1;
  if (operations.length !== 0) {
    const operationsDates = operations.map(c => c.date.getTime());
    operationsDates.concat(vthoOperations.map(c => c.date.getTime()));
    minDate = Math.min(...operationsDates);
  }

  if (!vthoToken) {
    throw new Error('token with id "vechain/vip180/vtho" not found');
  }

  const shape = {
    id: accountId,
    balance: new BigNumber(balance),
    creationDate: minDate !== -1 ? new Date(minDate) : new Date(),
    spendableBalance: new BigNumber(balance),
    operationsCount: operations.length,
    operations,
    blockHeight,
    feesCurrency: vthoToken,
    subAccounts: [
      {
        type: "TokenAccount" as const,
        id: vthoAccountId,
        parentId: accountId,
        token: vthoToken,
        balance: new BigNumber(energy),
        spendableBalance: new BigNumber(energy),
        creationDate: minDate !== -1 ? new Date(minDate) : new Date(),
        operationsCount: vthoOperations.length,
        operations: vthoOperations,
        blockHeight,
        pendingOperations:
          (initialAccount?.subAccounts && initialAccount.subAccounts[0]?.pendingOperations) || [],
        balanceHistoryCache:
          (initialAccount?.subAccounts && initialAccount.subAccounts[0]?.balanceHistoryCache) ||
          emptyHistoryCache,
        swapHistory: [],
      },
    ],
  };

  return {
    ...shape,
    used: !isAccountEmpty(shape),
  };
};
