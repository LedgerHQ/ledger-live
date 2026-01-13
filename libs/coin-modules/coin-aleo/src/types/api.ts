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

export interface AleoPublicTransactions {
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

// FIXME: temp details type
export interface AleoPublicTransactionDetails {
  type: string;
  id: string;
  execution: {};
  global_state_root: string;
  proof: string;
  fee: {};
  fee_value: number;
  block_height: number;
  block_hash: string;
  block_timestamp: string;
  status: string;
}
