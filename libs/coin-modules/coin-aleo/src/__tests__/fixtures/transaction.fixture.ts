import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../../constants";
import type {
  Transaction,
  TransactionRaw,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
} from "../../types";

export const getMockedTransactionDetails = (
  transactionId?: string,
  overrides?: Partial<AleoPublicTransactionDetailsResponse>,
): AleoPublicTransactionDetailsResponse => ({
  type: "execute",
  id: transactionId || "at1abc123def456",
  execution: {
    transitions: [
      {
        id: "au1xyz789",
        scm: "cm1abc",
        tcm: "cm1def",
        tpk: "tpk1ghi",
        inputs: [
          {
            id: "input1",
            type: "public",
            value: "100000000u64",
          },
        ],
        outputs: [
          {
            id: "output1",
            type: "future",
            value: "future_value",
          },
        ],
        program: "credits.aleo",
        function: "transfer_public",
      },
    ],
  },
  global_state_root: "sr1global123",
  proof: "proof1xyz",
  fee: {
    transition: {
      id: "au1fee789",
      scm: "cm1fee",
      tcm: "cm1fee2",
      tpk: "tpk1fee",
      inputs: [],
      outputs: [],
      program: "credits.aleo",
      function: "fee_public",
    },
  },
  fee_value: 5000000,
  block_height: 123456,
  block_hash: "ab1block123",
  block_timestamp: "1704110400",
  status: "Accepted",
  ...overrides,
});

export const getMockedSimpleTransactionDetails = (
  transactionId: string,
  overrides?: Partial<AleoPublicTransactionDetailsResponse>,
): AleoPublicTransactionDetailsResponse => ({
  type: "execute",
  id: transactionId,
  execution: { transitions: [] },
  global_state_root: "sr1",
  proof: "proof1",
  fee: {
    transition: {
      id: "au1fee",
      scm: "cm1",
      tcm: "cm2",
      tpk: "tpk1",
      inputs: [],
      outputs: [],
      program: "credits.aleo",
      function: "fee_public",
    },
  },
  fee_value: 1000000,
  block_height: 789,
  block_hash: "ab1",
  block_timestamp: "1706788800",
  status: "Accepted",
  ...overrides,
});

export const getMockedPublicTransaction = (
  overrides?: Partial<AleoPublicTransaction>,
): AleoPublicTransaction => ({
  transaction_id: "at1tx1",
  transition_id: "au1trans1",
  transaction_status: "Accepted",
  block_number: 123456,
  block_hash: "ab1block123",
  block_timestamp: "1704110400",
  function_id: "transfer_public",
  amount: 100000000,
  fee: 5000000,
  sender_address: "aleo1test123address456",
  recipient_address: "aleo1recipient123",
  program_id: "credits.aleo",
  ...overrides,
});

export const getMockedAccountPublicTransactions = (
  address: string,
  overrides?: Partial<AleoPublicTransactionsResponse>,
): AleoPublicTransactionsResponse => ({
  address,
  transactions: [
    {
      transaction_id: "at1tx1",
      transition_id: "au1trans1",
      transaction_status: "Accepted",
      block_number: 123456,
      block_hash: "ab1block123",
      block_timestamp: "1704110400",
      function_id: "transfer_public",
      amount: 100000000,
      fee: 5000000,
      sender_address: address,
      recipient_address: "aleo1recipient123",
      program_id: "credits.aleo",
    },
    {
      transaction_id: "at1tx2",
      transition_id: "au1trans2",
      transaction_status: "Accepted",
      block_number: 123457,
      block_hash: "ab1block124",
      block_timestamp: "1704114000",
      function_id: "transfer_public",
      amount: 50000000,
      fee: 5000000,
      sender_address: "aleo1sender456",
      recipient_address: address,
      program_id: "credits.aleo",
    },
  ],
  next_cursor: {
    block_number: 123457,
    transition_id: "au1trans2",
  },
  ...overrides,
});

export const getMockedTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    family: "aleo",
    amount: new BigNumber(0),
    recipient: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    fees: new BigNumber(0),
    useAllAmount: false,
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    ...overrides,
  };
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
  };
};
