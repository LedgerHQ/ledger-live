// FIXME: fix call to makeAccountBridgeReceive (dependency injection?)

import { makeAccountBridgeReceive } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { AlgorandTransaction } from "../types";
import { sync, scanAccounts } from "../js-synchronization";
import {
  createTransaction,
  prepareTransaction,
} from "../js-prepareTransaction";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import { getTransactionStatus } from "../js-getTransactionStatus";
import { buildSignOperation } from "../js-signOperation";
import { broadcast } from "../js-broadcast";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { initAccount } from "../initAccount";
import type { Transaction } from "../types";

const receive = makeAccountBridgeReceive();

const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({
  ...t,
  ...patch,
});

const preload = async () => Promise.resolve({});

const hydrate = () => {};

const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
  scanAccounts,
};

const accountBridge: AccountBridge<AlgorandTransaction> = {
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  sync,
  receive,
  assignToAccountRaw,
  assignFromAccountRaw,
  initAccount,
  signOperation,
  broadcast,
  estimateMaxSpendable,
};

export default {
  currencyBridge,
  accountBridge,
};
