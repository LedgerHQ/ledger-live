import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronisation";
import { getPreloadStrategy, preload, hydrate } from "../preload";
import signOperation from "../js-signOperation";
import getTransactionStatus from "../js-getTransactionStatus";
import broadcast from "../js-broadcast";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import prepareTransaction from "../js-prepareTransaction";
import createTransaction from "../js-createTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";

const updateTransaction = (t, patch) => ({ ...t, ...patch });

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
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
  assignFromAccountRaw,
  assignToAccountRaw,
};
export default {
  currencyBridge,
  accountBridge,
};
