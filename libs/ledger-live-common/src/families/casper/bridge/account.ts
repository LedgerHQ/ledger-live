import type { AccountBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import type { CasperAccount, Transaction, TransactionStatus } from "../types";
import { getTransactionStatus } from "../getTransactionStatus";
import { getAccountShape } from "./bridgeHelpers/accountShape";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { signOperation } from "../signOperation";
import { broadcast } from "../broadcast";

const receive = makeAccountBridgeReceive();
const sync = makeSync({ getAccountShape });

const accountBridge: AccountBridge<Transaction, CasperAccount, TransactionStatus> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
  getSerializedAddressParameters,
};

export { accountBridge };
