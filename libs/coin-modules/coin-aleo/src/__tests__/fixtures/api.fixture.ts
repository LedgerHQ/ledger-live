import { PROGRAM_ID } from "../../constants";
import type {
  AleoPrivateRecord,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
} from "../../types/api";

export const getMockedTransaction = (
  overrides?: Partial<AleoPublicTransaction>,
): AleoPublicTransaction => ({
  transaction_id: "at17l6zf5eykvvj45q9nwem2g06k2zujjtv929e2atff7j097lefuxqack93a",
  transition_id: "au1lz0t6x6nl45zryv9hhtmhuz9llkut2vxv2ajkellams68r2e9ygs5dhrhs",
  transaction_status: "Accepted",
  block_number: 100,
  block_timestamp: "1709079312",
  function_id: "transfer_public",
  amount: 10000000,
  sender_address: "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr",
  recipient_address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
  program_id: PROGRAM_ID.CREDITS,
  ...overrides,
});

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
  status: "Accepted",
  ...overrides,
});

export const getMockedTransactionDetails = (
  overrides?: Partial<AleoPublicTransactionDetailsResponse>,
): AleoPublicTransactionDetailsResponse => ({
  type: "execute",
  id: "at17l6zf5eykvvj45q9nwem2g06k2zujjtv929e2atff7j097lefuxqack93a",
  execution: {
    transitions: [],
  },
  global_state_root: "sr1mock",
  proof: "proof1mock",
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
  status: "accepted",
  ...overrides,
});
