import type { CurrencyBridge, AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction, TransactionStatus, TronAccount } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { prepareTransaction } from "../prepareTransaction";
import { getAccountShape, sync } from "../synchronization";
import { createTransaction } from "../createTransaction";
import { signOperation } from "../signOperation";
import { hydrate, preload } from "../preload";
import { broadcast } from "../broadcast";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

const scanAccounts = makeScanAccounts<TronAccount>({ getAccountShape });
const currencyBridge: CurrencyBridge = {
  preload,
  hydrate,
  scanAccounts,
};

const receive = makeAccountBridgeReceive();
const accountBridge: AccountBridge<Transaction, TronAccount, TransactionStatus> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  signOperation,
  broadcast,
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};

export default {
  currencyBridge,
  accountBridge,
};
