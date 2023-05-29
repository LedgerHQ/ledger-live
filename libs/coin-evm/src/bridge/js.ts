import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
// FIXME
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { signOperation } from "../signOperation";
import { scanAccounts, sync } from "../synchronization";
import type { Transaction as EvmTransaction } from "../types";

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
