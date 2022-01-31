import type { AccountBridge, CurrencyBridge } from "../../../types";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronisation";
import signOperation from "../js-signOperation";
import getTransactionStatus from "../js-getTransactionStatus";
import broadcast from "../js-broadcast";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import prepareTransaction from "../js-prepareTransaction";
import createTransaction from "../js-createTransaction";

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const receive = makeAccountBridgeReceive();

const preload = async () => Promise.resolve({});
const hydrate = (): void => {};

const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
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
