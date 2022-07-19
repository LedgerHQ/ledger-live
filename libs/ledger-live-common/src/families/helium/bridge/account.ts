import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { AccountBridge } from "../../../types";
import broadcast from "../js-broadcast";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import {
  createTransaction,
  prepareTransaction,
  updateTransaction,
} from "../js-transaction";
import { Transaction } from "../types";
import { getAccountShape } from "../utils";

const sync = makeSync({ getAccountShape });

const receive = makeAccountBridgeReceive();

export const accountBridge: AccountBridge<Transaction> = {
  sync,
  createTransaction,
  updateTransaction,
  prepareTransaction,
  getTransactionStatus,
  signOperation,
  broadcast,
  estimateMaxSpendable,
  receive,
};
