import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

import { sync, scanAccounts } from "../js-synchronisation";
import getTransactionStatus from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import createTransaction from "../js-createTransaction";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

const updateTransaction = (
  t: Transaction,
  patch: Partial<Transaction>
): Transaction => ({
  ...t,
  ...patch,
});

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
