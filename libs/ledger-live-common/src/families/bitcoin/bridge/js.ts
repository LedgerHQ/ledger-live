import type { Transaction } from "../types";
import { sync, scanAccounts } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { calculateFees } from "./../cache";
import { perCoinLogic } from "../logic";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";

const receive = makeAccountBridgeReceive({
  injectGetAddressParams: (account) => {
    const perCoin = perCoinLogic[account.currency.id];

    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  },
});

const updateTransaction = (t, patch): any => {
  const updatedT = { ...t, ...patch };

  // We accept case-insensitive addresses as input from user,
  // but segwit addresses need to be converted to lowercase to be valid
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }

  return updatedT;
};

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: () => Promise.resolve({}),
  hydrate: () => {},
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  prepareTransaction,
  updateTransaction,
  getTransactionStatus,
  receive,
  sync,
  signOperation,
  broadcast: async ({ account, signedOperation }) => {
    calculateFees.reset();
    return broadcast({
      account,
      signedOperation,
    });
  },
  assignFromAccountRaw,
  assignToAccountRaw,
};

export default {
  currencyBridge,
  accountBridge,
};
