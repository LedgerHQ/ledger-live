import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { sync, scanAccounts } from "../synchronisation";
import { signOperation } from "../signOperation";
import type { Transaction } from "../types";
import { broadcast } from "../broadcast";

const currencyBridge: CurrencyBridge = {
  preload: async () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

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
  assignFromAccountRaw,
  assignToAccountRaw,
  getSerializedAddressParameters,
};
export default {
  currencyBridge,
  accountBridge,
};
