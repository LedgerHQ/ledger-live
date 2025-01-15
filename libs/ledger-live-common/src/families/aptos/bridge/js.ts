import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getSerializedAddressParameters } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../synchronisation";
import getTransactionStatus from "../getTransactionStatus";
import prepareTransaction from "../prepareTransaction";
import createTransaction from "../createTransaction";
import estimateMaxSpendable from "../estimateMaxSpendable";
import signOperation from "../signOperation";
import broadcast from "../broadcast";

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

const receive = makeAccountBridgeReceive();

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  getSerializedAddressParameters,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
