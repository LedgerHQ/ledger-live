/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";

export function createBitcoinTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: {
      strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
      excludeUTXOs: [],
    },
    ...overrides,
  } as Transaction;
}

export function createTransactionStatus(overrides?: Partial<TransactionStatus>): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
    ...overrides,
  } as TransactionStatus;
}

export function isAccount(account: unknown): account is Account {
  return (
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    (account as Account).type === "Account"
  );
}
