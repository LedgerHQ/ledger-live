import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronisation";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { createTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
const receive = makeAccountBridgeReceive();
const currencyBridge: CurrencyBridge = {
  preload: async () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
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
