export type AleoTransactionType = "public" | "private";

export type AleoTransitionValue =
  | {
      id: string;
      type: "public" | "private" | "future";
      value: string;
    }
  | {
      id: string;
      type: "record";
      tag: string;
    };

export interface AleoTransition {
  id: string;
  scm: string;
  tcm: string;
  tpk: string;
  inputs: AleoTransitionValue[];
  outputs: AleoTransitionValue[];
  program: string;
  function: string;
}

export interface AleoLatestBlockResponse {
  block_hash: string;
  previous_hash: string;
  header: {
    metadata: {
      height: number;
      timestamp: number;
    };
  };
}

export interface AleoPublicTransaction {
  transaction_id: string;
  transition_id: string;
  transaction_status: string;
  block_number: number;
  block_hash: string;
  block_timestamp: string;
  function_id: string;
  amount: number;
  sender_address: string;
  recipient_address: string;
  program_id: string;
  fee: number;
}

export interface AleoPublicTransactionDetailsResponse {
  type: string;
  id: string;
  execution: {
    transitions: AleoTransition[];
  };
  global_state_root: string;
  proof: string;
  fee: {
    transition: AleoTransition;
  };
  fee_value: number;
  block_height: number;
  block_hash: string;
  block_timestamp: string;
  status: string;
}

export interface AleoPublicTransactionsResponse {
  address: string;
  transactions: AleoPublicTransaction[];
  prev_cursor?: {
    block_number: number;
    transition_id: string;
  };
  next_cursor?: {
    block_number: number;
    transition_id: string;
  };
}

export interface AleoRegisterForRecordsResponse {
  uuid: string;
}

export interface AleoGetScannerPublicKeyResponse {
  key_id: string;
  public_key: string;
}

export interface AleoGetProvePublicKeyResponse {
  key_id: string;
  public_key: string;
}

export interface AleoRecordScannerStatusResponse {
  synced: boolean;
  percentage: number;
}

export interface AleoPrivateRecord {
  block_height: number;
  block_timestamp: number;
  commitment: string;
  function_name: string;
  output_index: number;
  owner: string;
  program_name: string;
  record_ciphertext: string;
  record_name: string;
  sender: string;
  spent: boolean;
  tag: string;
  transaction_id: string;
  transition_id: string;
  transaction_index: number;
  transition_index: number;
}

export interface AleoDecryptedCiphertextResponse {
  plaintext: string;
}

interface DelegatedProvingTransitionResponse {
  id: string;
  program: string;
  function: string;
  inputs: {
    type: string;
    id: string;
    value: string;
  }[];
  outputs: {
    type: string;
    id: string;
    value: string;
  }[];
  tpk: string;
  tcm: string;
  scm: string;
}

export interface DelegatedProvingResponse {
  transaction: {
    type: string;
    id: string;
    execution: {
      transitions: DelegatedProvingTransitionResponse[];
      global_state_root: string;
      proof: string;
      fee: {
        transition: DelegatedProvingTransitionResponse;
      };
      broadcast_result: string;
    };
  };
}

export interface AleoRecordInput {
  owner: string;
  data: Record<string, string>;
  nonce: string;
  version: number;
}

export interface AleoTransferIntentFee {
  max_base_fee: string;
  max_priority_fee: string;
  function_name: string;
}

export interface AleoCreateTransferIntentRequest {
  intent: {
    type: string;
    amount: string;
    to: string;
    record1: AleoRecordInput;
    record2?: AleoRecordInput;
  };
  view_key: string;
  fee: AleoTransferIntentFee;
}

export interface AleoTransferIntentResponse {
  is_root: boolean;
  network_id: number;
  program_id: string;
  function_name: string;
  inputs: string[];
  input_types: string[];
  record_commitments: string[];
  tlv: string;
}

export interface AleoCreateAuthorizationRequest {
  request: AleoTransferIntentResponse;
  signatures: string;
  view_key: string;
  tlv_version: number;
}

export interface AleoAuthorizationResponse {
  authorization: {
    requests: Record<string, unknown>[];
    transitions: Record<string, unknown>[];
  };
  execution_id: string;
}
