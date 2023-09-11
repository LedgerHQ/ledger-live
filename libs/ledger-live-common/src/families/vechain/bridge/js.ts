import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

import { sync, scanAccounts } from "../js-synchronisation";
import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { createTransaction, updateTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { estimateMaxSpendable } from "./js-estimateMaxSpendable";

const receive: AccountBridge<Transaction>["receive"] = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: async () => Promise.resolve({}),
  hydrate: (): void => {},
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
