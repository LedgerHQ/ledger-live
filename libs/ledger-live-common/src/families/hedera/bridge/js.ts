import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { scanAccounts, sync } from "../js-synchronisation";
import receive from "../js-receive";
import {
  createTransaction,
  updateTransaction,
  prepareTransaction,
} from "../js-transaction";

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
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

export default {
  currencyBridge,
  accountBridge,
};
