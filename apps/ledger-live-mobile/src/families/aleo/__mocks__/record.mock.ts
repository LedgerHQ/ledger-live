import type { AleoUnspentRecord } from "@ledgerhq/live-common/families/aleo/types";

export const makeRecord = (microcredits: number | string): AleoUnspentRecord => ({
  microcredits: String(microcredits),
  block_height: 0,
  block_timestamp: 0,
  commitment: "",
  function_name: "",
  output_index: 0,
  owner: "",
  program_name: "",
  record_ciphertext: "",
  record_name: "",
  sender: "",
  spent: false,
  tag: "",
  transaction_id: "",
  transition_id: "",
  transaction_index: 0,
  transition_index: 0,
  decryptedData: {
    owner: "",
    data: {},
    nonce: "",
    version: 0,
  },
});
