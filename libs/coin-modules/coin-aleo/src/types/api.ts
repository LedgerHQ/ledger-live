export type AleoTransactionType = "public" | "private";

export type AleoCommitteeMember = [
  stakeMicrocredits: number,
  isOpen: boolean,
  commissionPercent: number,
];

export interface AleoCommitteeResponse {
  id?: string;
  starting_round?: number;
  members: Record<string, AleoCommitteeMember>;
  total_stake?: number;
}

/** Address -> display name. Not every committee member is listed. */
export type AleoValidatorMetadataResponse = Record<string, string>;

/**
 * Total circulating supply, a bare JSON scalar. Unlike every other amount in this
 * API it is denominated in **credits**, not microcredits.
 */
export type AleoTotalSupplyResponse = number | string;

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
    }
  | {
      id: string;
      type: "record_with_dynamic_id";
      tag: string;
      dynamic_id: string;
    }
  | {
      id: string;
      type: "external_record" | "record_dynamic";
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
  amount_u128?: string;
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

/**
 * A bound in the explorer's per-transition stream.
 *
 * Omitting `transitionId` makes the bound whole-block exclusive instead — useful to open a window
 * (`minHeight - 1` ascending, `maxBlockHeight + 1` descending), but never to resume a page: the rest
 * of the named block would be skipped.
 */
export type AleoTransitionCursor = {
  blockNumber: number;
  transitionId?: string;
};

/** A cursor that names an exact row, so paging can resume without skipping the rest of its block. */
export type AleoExactTransitionCursor = Required<AleoTransitionCursor>;

export interface AleoPublicTransactionsResponse {
  address: string;
  transactions: AleoPublicTransaction[];
  prev_cursor?: {
    block_number: number;
    transition_id: string;
  };
  // Presence does not prove more rows follow; only its absence proves the stream is exhausted.
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
  sync_start_height: number;
  synced_up_to: number | null;
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

export interface AleoTokenDetails {
  token_id: string;
  token_id_datatype: string | null;
  token_standard: string | null;
  symbol: string;
  display: string;
  program_name: string;
  decimals: number;
  total_supply: string | null;
  verified: boolean;
  token_icon_url: string;
  price: string | null;
  price_change_percentage_24h: string;
  fully_diluted_value: null;
  total_market_cap: string | null;
  volume_24h: string | null;
}

export interface AleoGetTokensResponse {
  data: AleoTokenDetails[];
  pagination: {
    limit: number;
    offset: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
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
    };
  };
  broadcast_result?: {
    status: string;
    status_code?: number;
    message?: string;
  };
}
