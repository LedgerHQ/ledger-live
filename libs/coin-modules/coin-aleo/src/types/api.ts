interface AleoTransition {
  id: string;
  scm: string;
  tcm: string;
  tpk: string;
  inputs: Array<{
    id: string;
    type: "public" | "private";
    value: string;
  }>;
  outputs: Array<{
    id: string;
    type: string;
    value: string;
  }>;
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
  block_timestamp: string;
  function_id: string;
  amount: number;
  sender_address: string;
  recipient_address: string;
  program_id: string;
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

export interface AleoPublicTransactionDetailsResponse {
  type: string;
  id: string;
  execution: {
    transitions: AleoTransition[];
  };
  global_state_root: string;
  proof: string;
  fee: { transition: AleoTransition };
  fee_value: number;
  block_height: number;
  block_hash: string;
  block_timestamp: string;
  status: string;
}

export interface AleoRegisterAccountResponse {
  consumer: { id: string };
  created_at: number;
  id: string;
  key: string;
}

export interface AleoAccountJWTResponse {
  exp: number;
}

export interface AleoJWT {
  token: string;
  exp: number;
}

export interface AleoRegisterForRecordsResponse {
  uuid: string;
}

export interface AleoDecryptedTransactionValueResponse {
  owner: string;
  data: {
    microcredits: string;
  };
  nonce: string;
  version: number;
}

export interface AleoRecordScannerStatusResponse {
  synced: boolean;
  percentage: number;
}
