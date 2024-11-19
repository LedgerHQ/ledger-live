import { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { getTransactionStatus } from "../getTransactionStatus";
import type { Transaction, TransactionStatus } from "../types";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { sync, scanAccounts } from "../synchronisation";
import { signOperation } from "../signOperation";
import { broadcast } from "../broadcast";

const receive: AccountBridge<Transaction>["receive"] = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  scanAccounts,
  preload: async () => Promise.resolve({}),
  hydrate: (): void => {},
};

const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
