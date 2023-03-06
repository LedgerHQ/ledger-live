import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronisation";
import signOperation from "../js-signOperation";
import { getTransactionStatus } from "../js-getTransactionStatus";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import { broadcast } from "../js-broadcast";

import {
  createTransaction,
  updateTransaction,
  prepareTransaction,
} from "../js-transaction";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  preload: async () => {
    return {};
  },
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

export default { currencyBridge, accountBridge };
