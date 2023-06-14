import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

import { sync, scanAccounts } from "../js-synchronisation";
import { AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { createTransaction, updateTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import BigNumber from "bignumber.js";
import { calculateMaxFeesToken } from "../utils/calculateTransactionInfo";

const receive: AccountBridge<Transaction>["receive"] = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: async (): Promise<Record<string, any>> => {
    return {};
  },
  hydrate: (): void => {},
};

const estimateMaxSpendable = async (inputs: {
  account: AccountLike;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { account, transaction } = inputs;

  if (account.type === "Account") {
    return account.balance;
  }
  if (transaction) {
    const maxTokenFees = await calculateMaxFeesToken();
    const spendable = account.balance.minus(maxTokenFees);
    if (spendable.gt(0)) return account.balance.minus(maxTokenFees);
    return new BigNumber(0);
  } else {
    return account.balance;
  }
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
