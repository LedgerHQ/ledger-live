import type { GetAccountShape } from "../../bridge/jsHelpers";
import { BigNumber } from "bignumber.js";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { encodeAccountId } from "../../account";
import eip55 from "eip55";
import { emptyHistoryCache } from "../../account";

import { getAccount, getLastBlock, getOperations, getTokenOperations } from "./api";
import { getTokenById } from "@ledgerhq/cryptoassets/tokens";

const getAccountShape: GetAccountShape = async info => {
  const { initialAccount, currency, derivationMode } = info;
  let { address } = info;
  address = eip55.encode(address);

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
  const { number: blockHeight } = await getLastBlock();

  // Merge new operations with the previously synced ones
  const newOperations = await getOperations(accountId, address, startAt);

  //Get last token operations
  const vthoAccountId = accountId + "+" + encodeURIComponent("vechain/vtho");
  const VTHOoperations = await getTokenOperations(
    vthoAccountId,
    address,
    "0x0000000000000000000000000000456e65726779",
    1,
  );

  const operations = mergeOps(oldOperations, newOperations);

  //Account creation date set to now if there are no operation or at the first operation on the account
  let minDate = -1;
  if (operations.length != 0) {
    const operationsDates = operations.map(c => c.date.getTime());
    operationsDates.concat(VTHOoperations.map(c => c.date.getTime()));
    minDate = Math.min(...operationsDates);
  }

  const shape = {
    id: accountId,
    balance: new BigNumber(balance),
    creationDate: minDate != -1 ? new Date(minDate) : new Date(),
    spendableBalance: new BigNumber(balance),
    operationsCount: operations.length,
    operations: operations,
    blockHeight,
    feesCurrency: getTokenById("vechain/vtho"),
    subAccounts: [
      {
        type: "TokenAccount" as const,
        id: vthoAccountId,
        parentId: accountId,
        token: getTokenById("vechain/vtho"),
        balance: new BigNumber(energy),
        spendableBalance: new BigNumber(energy),
        creationDate: minDate != -1 ? new Date(minDate) : new Date(),
        operationsCount: VTHOoperations.length,
        operations: VTHOoperations,
        blockHeight,
        pendingOperations:
          (initialAccount?.subAccounts && initialAccount.subAccounts[0]?.pendingOperations) || [],
        starred: (initialAccount?.subAccounts && initialAccount.subAccounts[0]?.starred) || false,
        balanceHistoryCache:
          (initialAccount?.subAccounts && initialAccount.subAccounts[0]?.balanceHistoryCache) ||
          emptyHistoryCache,
        swapHistory: [],
      },
    ],
  };

  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
