import { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  makeAccountBridgeReceive,
  defaultUpdateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";

import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { Transaction, TransactionStatus } from "../types";
import { createTransaction } from "../createTransaction";
import { signOperation } from "../signOperation";
import { sync } from "../synchronization";
import { broadcast } from "../broadcast";

const receive = makeAccountBridgeReceive();

export const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  prepareTransaction,
  estimateMaxSpendable,
  signOperation,
  sync,
  receive,
  broadcast,
};
