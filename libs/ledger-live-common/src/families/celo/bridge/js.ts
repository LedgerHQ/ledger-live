import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { getPreloadStrategy, preload, hydrate } from "../preload";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { sync, scanAccounts } from "../synchronisation";
import { signOperation } from "../signOperation";
import type { CeloAccount, Transaction, TransactionStatus } from "../types";
import { broadcast } from "../broadcast";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

const receive = makeAccountBridgeReceive();

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};
const accountBridge: AccountBridge<Transaction, CeloAccount, TransactionStatus> = {
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
  fromOperationExtraRaw,
  toOperationExtraRaw,
  getSerializedAddressParameters,
};
export default {
  currencyBridge,
  accountBridge,
};
