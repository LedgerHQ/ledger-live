// @flow
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import type {
  AccountBridge,
  CryptoCurrency,
  CurrencyBridge,
} from "../../../types";
import type { Transaction } from "../types";

import { scanAccounts, sync } from "../js-synchronization";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";

const preload = async () => {};

const hydrate = () => {};

const receive = makeAccountBridgeReceive();

const updateTransaction = (t, patch) => ({ ...t, ...patch });

// eslint-disable-next-line no-unused-vars
export const getPreloadStrategy = (currency: CryptoCurrency) => ({});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
