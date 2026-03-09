import BigNumber from "bignumber.js";
import { PROGRAM_ID } from "../../constants";
import {
  AleoPrivateRecord,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
  AleoPublicTransactionsResponse,
  EnrichedPrivateRecord,
} from "../../types";

export const getMockedTransaction = (
  overrides?: Partial<AleoPublicTransaction>,
): AleoPublicTransaction => ({
  transaction_id: "at17l6zf5eykvvj45q9nwem2g06k2zujjtv929e2atff7j097lefuxqack93a",
  transition_id: "au1lz0t6x6nl45zryv9hhtmhuz9llkut2vxv2ajkellams68r2e9ygs5dhrhs",
  transaction_status: "Accepted",
  block_number: 100,
  block_hash: "ab1mockhash",
  block_timestamp: "1709079312",
  function_id: "transfer_public",
  amount: 10000000,
  fee: 1000,
  sender_address: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  recipient_address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
  program_id: PROGRAM_ID.CREDITS,
  ...overrides,
});

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
      scm: "scm1",
      tcm: "tcm1",
      tpk: "tpk1",
      inputs: [
        {
          id: "input1",
          type: "public",
          value: "1000u64",
        },
      ],
      outputs: [],
      program: PROGRAM_ID.CREDITS,
      function: "fee_public",
    },
  },
  fee_value: 1000,
  block_height: 100,
  block_hash: "ab1mockhash",
  block_timestamp: "1709079312",
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

type EnrichedPrivateRecordOverrides = Omit<
  Partial<EnrichedPrivateRecord>,
  "rawRecord" | "details"
> & {
  rawRecord?: Partial<AleoPrivateRecord>;
  details?: Partial<AleoPublicTransactionDetailsResponse>;
};

export function getMockedEnrichedPrivateRecord(
  overrides?: EnrichedPrivateRecordOverrides,
): EnrichedPrivateRecord {
  const { rawRecord, details, ...rest } = overrides ?? {};
  return {
    rawRecord: getMockedRecord(rawRecord),
    details: getMockedTransactionDetails(undefined, details),
    sender: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
    recipient: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
    value: new BigNumber(1000000),
    ...rest,
  };
}

export const testnetViewKey = "AViewKey1tTb4WYnMFnDWjSgTSA5VkiyLKNZH1szDcMyEuzSu1zbk";

// this record has `microcredits: "800000u64.private"` in the decrypted data
export const testnetPrivateRecord: AleoPrivateRecord = {
  block_height: 14192647,
  block_timestamp: 1770127220,
  commitment: "5577911026701224136131721605774668283349812508334064746703596134075753528694field",
  function_name: "transfer_public_to_private",
  output_index: 0,
  owner: "4061324383530370528773115724536366126386700749943799382889243452721616108297field",
  program_name: "credits.aleo",
  record_ciphertext:
    "record1qvqsps6wqrka73247spvsvdlgwr8qhmn5f4uze4t8zutp4k8mwm3zdgtqyxx66trwfhkxun9v35hguerqqpqzqrpdge64jwzyz32aknuxc800uugfwv52pqse4dk4p32datlzpd8z95td5t0dhdm4dfhtq9w285uj2arltzky4u6hmdv2xpdnkv365l3qg9hn0g",
  record_name: "credits",
  sender: "aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f",
  spent: false,
  tag: "4138557248634429596246575371443174357174703200753459213664031563822892655489field",
  transaction_id: "at144lgzzq73r38hx4jvtecxteg8v32creg2pxpazs9n4xcduu5jsfqv43lx9    ",
  transition_id: "au1mxddgfe8yl0yadjrm6qaz6wqljtlqth885muwxvrzvpd9852cyqqxhxr76    ",
  transaction_index: 0,
  transition_index: 0,
};

export const getMockedRecord = (overrides?: Partial<AleoPrivateRecord>): AleoPrivateRecord => ({
  transaction_id: "tx123",
  block_height: 100,
  transition_index: 0,
  function_name: "transfer_public_to_private",
  sender: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  record_ciphertext: "record123",
  program_name: "credits.aleo",
  block_timestamp: 1704067200,
  commitment: "commitment123",
  output_index: 0,
  owner: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  record_name: "record123",
  spent: false,
  tag: "tag123",
  transition_id: "transition123",
  transaction_index: 0,
  ...overrides,
});
