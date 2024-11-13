export type XrplOperation = {
  meta: {
    AffectedNodes: {
      ModifiedNode: {
        FinalFields: {
          Account: string;
          Balance: string;
          Flags: number;
          OwnerCount: number;
          Sequence: number;
        };
        LedgerEntryType: string;
        LedgerIndex: string;
        PreviousFields: {
          Balance: string;
        };
        PreviousTxnID: string;
        PreviousTxnLgrSeq: number;
      };
    }[];
    TransactionIndex: number;
    TransactionResult: string;
    delivered_amount: string;
  };
  tx: {
    Account: string;
    Amount: string;
    DeliverMax: string;
    Destination: string;
    DestinationTag?: number;
    Fee: string;
    Flags: number;
    LastLedgerSequence: number;
    // cf. https://xrpl.org/docs/references/protocol/transactions/common-fields#memos-field
    Memos?: {
      Memo: {
        MemoData?: string;
        MemoFormat?: string;
        MemoType?: string;
      };
    }[];
    Sequence: number;
    SigningPubKey: string;
    TransactionType: string;
    TxnSignature: string;
    date: number;
    hash: string;
    inLedger: number;
    ledger_index: number;
  };
  validated: boolean;
};

export type ResponseStatus =
  | { status: string; error?: never }
  | {
      status?: never;
      error: string;
    };
export function isResponseStatus(obj: object): obj is ResponseStatus {
  return "status" in obj || "error" in obj;
}

export type NewAccount = "NewAccount";
export type AccountInfoResponse = {
  account_data: {
    Account: string;
    Balance: string;
    Flags: number;
    LedgerEntryType: string;
    OwnerCount: number;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    Sequence: number;
    index: string;
  };
  account_flags: {
    allowTrustLineClawback: boolean;
    defaultRipple: boolean;
    depositAuth: boolean;
    disableMasterKey: boolean;
    disallowIncomingCheck: boolean;
    disallowIncomingNFTokenOffer: boolean;
    disallowIncomingPayChan: boolean;
    disallowIncomingTrustline: boolean;
    disallowIncomingXRP: boolean;
    globalFreeze: boolean;
    noFreeze: boolean;
    passwordSpent: boolean;
    requireAuthorization: boolean;
    requireDestinationTag: boolean;
  };
  ledger_hash: string;
  ledger_index: number;
  validated: boolean;
} & ResponseStatus;

export type SubmitReponse = {
  accepted: boolean;
  account_sequence_available: number;
  account_sequence_next: number;
  applied: boolean;
  broadcast: boolean;
  engine_result: string;
  engine_result_code: 0;
  engine_result_message: string;
  kept: boolean;
  open_ledger_cost: string;
  queued: false;
  status: string;
  tx_blob: string;
  tx_json: {
    Account: string;
    Amount: string;
    Destination: string;
    Fee: string;
    Flags: number;
    LastLedgerSequence: number;
    Sequence: number;
    SigningPubKey: string;
    TransactionType: string;
    TxnSignature: string;
    hash: string;
  };
  validated_ledger_index: number;
};

export type ServerInfoResponse = {
  info: {
    build_version: string;
    complete_ledgers: string;
    hostid: string;
    initial_sync_duration_us: string;
    io_latency_ms: number;
    jq_trans_overflow: string;
    last_close: {
      converge_time_s: number;
      proposers: number;
    };
    load_factor: number;
    network_id: number;
    peer_disconnects: string;
    peer_disconnects_resources: string;
    peers: number;
    ports: { port: string; protocol: ["ws" | "http" | "peer"] }[];
    pubkey_node: string;
    server_state: string;
    server_state_duration_us: string;
    state_accounting: Record<
      "connected" | "disconnected" | "full" | "syncing" | "tracking",
      {
        duration_us: string;
        transitions: string;
      }
    >;
    time: string;
    uptime: number;
    validated_ledger: {
      age: number;
      base_fee_xrp: number;
      hash: string;
      reserve_base_xrp: number;
      reserve_inc_xrp: number;
      seq: number;
    };
    validation_quorum: number;
  };
} & ResponseStatus;

export type AccountTxResponse = {
  account: string;
  ledger_index_max: number;
  ledger_index_min: number;
  limit: number;
  transactions: XrplOperation[];
  validated: boolean;
} & ResponseStatus;

export type LedgerResponse = {
  ledger: {
    account_hash: string;
    close_flags: number;
    close_time: number;
    close_time_human: string;
    close_time_iso: string;
    close_time_resolution: number;
    closed: boolean;
    ledger_hash: string;
    ledger_index: string;
    parent_close_time: number;
    parent_hash: string;
    total_coins: string;
    transaction_hash: string;
  };
  ledger_hash: string;
  ledger_index: number;
  validated: boolean;
} & ResponseStatus;

export type ErrorResponse = {
  account: string;
  error: string;
  error_code: number;
  error_message: string;
  ledger_hash: string;
  ledger_index: number;
  request: {
    account: string;
    command: string;
    ledger_index: string;
  };
  status: string;
  validated: boolean;
};
export function isErrorResponse(obj: object): obj is ErrorResponse {
  return "status" in obj && obj.status === "error" && "error" in obj;
}
