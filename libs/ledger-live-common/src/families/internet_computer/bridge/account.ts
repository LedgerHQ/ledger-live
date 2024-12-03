import { Account, AccountBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { prepareTransaction } from "../prepareTransaction";
import { Transaction, TransactionStatus } from "../types";
import { getAccountShape } from "./bridgeHelpers/account";
import { createTransaction } from "../createTransaction";
import { signOperation } from "../signOperation";
import { broadcast } from "../broadcast";

const sync = makeSync({ getAccountShape });
const receive = makeAccountBridgeReceive();

export const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
  sync,
  updateTransaction,
  createTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  receive,
  signOperation,
  broadcast,
  getSerializedAddressParameters,
};
