import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import type { Transaction as EvmTransaction } from "../types";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { sync, scanAccounts } from "../synchronization";
import { signOperation } from "../signOperation";
import { hydrate, preload } from "../preload";
import { broadcast } from "../broadcast";

const receive = makeAccountBridgeReceive();

const updateTransaction: AccountBridge<EvmTransaction>["updateTransaction"] = (
  transaction,
  patch
) => {
  return { ...transaction, ...patch } as EvmTransaction;
};

const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<EvmTransaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  receive,
  signOperation,
  broadcast,
  estimateMaxSpendable,
};

export default {
  currencyBridge,
  accountBridge,
};
