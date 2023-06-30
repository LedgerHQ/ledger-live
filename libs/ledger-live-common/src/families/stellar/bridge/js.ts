import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { scanAccounts, sync } from "../js-synchronization";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const preload = async (): Promise<any> => {};

const hydrate = (): void => {};

const receive = makeAccountBridgeReceive();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getPreloadStrategy = (currency: CryptoCurrency): any => ({});

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<Transaction> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  prepareTransaction,
  estimateMaxSpendable,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default {
  currencyBridge,
  accountBridge,
};
