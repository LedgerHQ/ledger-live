import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../../constants";
import type { AleoTransactionIntent, Transaction, TransactionRaw } from "../../types";
import { mockUnspentRecord1, mockUnspentRecord2 } from "./account.fixture";

export const getMockedTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    family: "aleo",
    amount: new BigNumber(0),
    recipient: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    fees: new BigNumber(0),
    useAllAmount: false,
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    ...overrides,
  } as Transaction;
};

export const getMockedTransactionRaw = (overrides?: Partial<TransactionRaw>): TransactionRaw => {
  return {
    family: "aleo",
    amount: "0",
    recipient: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    fees: "0",
    useAllAmount: false,
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    ...overrides,
  } as TransactionRaw;
};

const baseTxIntentFields = {
  intentType: "transaction",
  asset: { type: "native" },
  sender: "aleo1sender",
  recipient: "aleo1recipient",
} as const satisfies Partial<AleoTransactionIntent>;

export const mockTxIntentTransferPublic: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 100n,
  type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
};

export const mockTxIntentTransferPrivate: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 200n,
  type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  data: {
    type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    record: mockUnspentRecord1.decryptedData,
  },
};

export const mockTxIntentSelfTransferToPrivate: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 300n,
  type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
};

export const mockTxIntentSelfTransferToPublic: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 400n,
  type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  data: {
    type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    record: mockUnspentRecord1.decryptedData,
  },
};

export const mockTxIntentFeePublic: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 500n,
  type: "fee_public",
  data: {
    type: "fee_public",
    executionId: "exec123",
    priorityFee: 5000,
  },
};

export const mockTxIntentFeePrivate: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 600n,
  type: "fee_private",
  data: {
    type: "fee_private",
    executionId: "exec456",
    priorityFee: 6000,
    record: mockUnspentRecord2.decryptedData,
  },
};
