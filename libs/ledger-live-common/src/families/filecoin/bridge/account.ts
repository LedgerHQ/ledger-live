import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { Transaction, TransactionStatus } from "../types";
import { createTransaction } from "../createTransaction";
import { signOperation } from "../signOperation";
import { getAccountShape } from "./utils/utils";
import { broadcast } from "../broadcast";

const receive = makeAccountBridgeReceive();
const sync = makeSync({ getAccountShape });

export const accountBridge: AccountBridge<Transaction, TransactionStatus> = {
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  sync,
  receive,
  broadcast,
  signOperation,
};
