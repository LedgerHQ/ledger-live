import type { Transaction } from "../types";
import { scanAccounts, sync } from "../js-synchronisation";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import {
  createTransaction,
  prepareTransaction,
  updateTransaction,
} from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";

const receive = makeAccountBridgeReceive();

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

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: async () => ({}),
  hydrate: () => {},
};

export default { currencyBridge, accountBridge };
