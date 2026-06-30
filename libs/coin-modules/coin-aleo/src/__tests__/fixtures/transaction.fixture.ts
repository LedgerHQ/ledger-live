import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../../constants";
import type { AleoTransactionIntent, Transaction, TransactionRaw } from "../../types";
import {
  mockUnspentRecord1,
  mockUnspentRecord2,
  mockUnspentTokenRecord1,
  mockUnspentTokenRecord2,
} from "./account.fixture";
import { MOCK_TOKEN_PROGRAM_ID } from "./currency.fixture";

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
  recipient: "aleo172yejeypnffsdft3nrlpwnu964sn83p7ga6dm5zj7ucmqfqjk5rq3pmx6f",
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
    records: [mockUnspentRecord1.decryptedData],
  },
};

export const mockTxIntentTransferPrivate2: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 200n,
  type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
  data: {
    type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    records: [mockUnspentRecord1.decryptedData, mockUnspentRecord2.decryptedData],
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
    records: [mockUnspentRecord1.decryptedData],
  },
};

export const mockTxIntentSelfTransferToPublic2: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 400n,
  type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  data: {
    type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    records: [mockUnspentRecord1.decryptedData, mockUnspentRecord2.decryptedData],
  },
};

export const mockTxIntentFeePublic: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 500n,
  type: "fee_public",
  data: {
    type: "fee_public",
    executionId:
      "7287422539927885800585937944314327552710698933416219800491628782750554575326field",
    priorityFee: 5000n,
  },
};

export const mockTxIntentFeePrivate: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 600n,
  type: "fee_private",
  data: {
    type: "fee_private",
    executionId:
      "7287422539927885800585937944314327552710698933416219800491628782750554575326field",
    priorityFee: 6000n,
    record: mockUnspentRecord2.decryptedData,
  },
};

export const mockTxIntentTransferTokenPublic: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 100n,
  type: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
  data: {
    type: TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
    programId: MOCK_TOKEN_PROGRAM_ID,
  },
};

export const mockTxIntentConvertTokenPublicToPrivate: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 300n,
  type: TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
  data: {
    type: TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
    programId: MOCK_TOKEN_PROGRAM_ID,
  },
};

export const mockTxIntentTransferTokenPrivate: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 200n,
  type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
  data: {
    type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
    programId: MOCK_TOKEN_PROGRAM_ID,
    records: [mockUnspentTokenRecord1.decryptedData],
  },
};

export const mockTxIntentTransferTokenPrivate2: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 200n,
  type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
  data: {
    type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
    programId: MOCK_TOKEN_PROGRAM_ID,
    records: [mockUnspentTokenRecord1.decryptedData, mockUnspentTokenRecord2.decryptedData],
  },
};

export const mockTxIntentConvertTokenPrivateToPublic: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 400n,
  type: TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
  data: {
    type: TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
    programId: MOCK_TOKEN_PROGRAM_ID,
    records: [mockUnspentTokenRecord1.decryptedData],
  },
};

export const mockTxIntentConvertTokenPrivateToPublic2: AleoTransactionIntent = {
  ...baseTxIntentFields,
  amount: 400n,
  type: TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
  data: {
    type: TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
    programId: MOCK_TOKEN_PROGRAM_ID,
    records: [mockUnspentTokenRecord1.decryptedData, mockUnspentTokenRecord2.decryptedData],
  },
};
