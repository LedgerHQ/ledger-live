// import { Account, AccountBridge } from "@ledgerhq/types-live";
// import {
//   defaultUpdateTransaction,
//   makeAccountBridgeReceive,
//   makeSync,
// } from "@ledgerhq/coin-framework/bridge/jsHelpers";
// import { getTransactionStatus } from "./getTransactionStatus";
// import { estimateMaxSpendable } from "./estimateMaxSpendable";
// import { prepareTransaction } from "./prepareTransaction";
// import { Transaction, TransactionStatus } from "./types";
// import { createTransaction } from "./createTransaction";
// import { buildSignOperation } from "./signOperation";
// import { getAccountShape } from "./utils/utils";
// import { broadcast } from "./broadcast";

// const receive = makeAccountBridgeReceive();
// const sync = makeSync({ getAccountShape });

// export const accountBridge: AccountBridge<Transaction, Account, TransactionStatus> = {
//   createTransaction,
//   updateTransaction: defaultUpdateTransaction,
//   prepareTransaction,
//   getTransactionStatus,
//   estimateMaxSpendable,
//   sync,
//   receive,
//   broadcast,
//   buildSignOperation,
// };
