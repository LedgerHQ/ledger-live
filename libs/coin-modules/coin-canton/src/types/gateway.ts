/**
 * Types for Canton Gateway API
 * Based on OpenAPI 3.1.0 specification
 * @see https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/gateway.yaml
 */

/*
 * Parties
 */

export type TopologyTransactionData = {
  serialized: string;
  hash: string;
  transaction: object; // TopologyTransaction JSON form
};

export type TopologyTransactions = {
  namespace_transaction: TopologyTransactionData;
  party_to_key_transaction: TopologyTransactionData;
  party_to_participant_transaction: TopologyTransactionData;
  combined_hash: string;
};

export type OnboardingPrepareResponse = {
  party_id: string;
  party_name: string;
  public_key_fingerprint: string;
  transactions: TopologyTransactions;
  challenge_nonce: string;
  challenge_deadline: number;
};

export type OnboardingPrepareRequest = {
  public_key: string;
  public_key_type: "ECDSA_P256" | "ECDSA_P384" | "ED25519";
};

/**
 * Party matches Party schema from OpenAPI but with threshold as optional.
 * GET endpoints may omit threshold in some responses, so making it optional
 * allows handling both old and new API responses without type errors.
 */
export type Party = {
  party_id: string;
  public_key: string;
  threshold?: number;
  participants?: string[];
};

export type OnboardingSubmitRequest = {
  prepare_request: OnboardingPrepareRequest;
  prepare_response: OnboardingPrepareResponse;
  signature: string;
  application_signature?: string;
};

export type OnboardingSubmitResponse = {
  party: Party;
};

export type OnboardingSubmitError409 = {
  partyId: string;
  status: 409;
  type: "PARTY_ALREADY_EXISTS";
  message: string;
};

/*
 * State
 */

export type InstrumentBalance = {
  admin_id: string;
  instrument_id: string;
  amount: string;
  locked: boolean;
  utxo_count: number;
};

export type GetBalanceResponse =
  | {
      at_round: number;
      balances: InstrumentBalance[];
    }
  // temporary backwards compatibility
  | InstrumentBalance[];

export type OperationStatusView = "Failed" | "Success";

export type OperationTypeView =
  | "Initialize"
  | "Interaction"
  | "Receive"
  | "Send"
  | "Staking"
  | "Unknown";

export type OperationType =
  | "pre-approval"
  | "tap"
  | "transfer"
  | "transfer-proposal"
  | "transfer-rejected"
  | "transfer-withdrawn";

export type BlockView = {
  height: number;
  time: string; // ISO 8601 date-time
  hash?: string;
};

export type AssetView =
  | {
      type: "native";
      instrumentAdmin: string;
      instrumentId: string;
    }
  | {
      type: "template";
      packageId: string;
      moduleName: string;
      entityName: string;
      issuer?: string;
    }
  | {
      type: "token";
      instrumentAdmin: string;
      instrumentId: string;
      issuer?: string;
    };

export type FeesView = {
  value: string;
  asset: AssetView;
  details: Record<string, unknown>;
};

export type TransferView = {
  address: string;
  type: OperationTypeView;
  value: string;
  details: Record<string, unknown>;
  asset: string;
};

export type OperationView = {
  uid: string;
  transaction_hash: string;
  transaction_timestamp: string; // ISO 8601 date-time
  status: OperationStatusView;
  type: OperationTypeView;
  senders?: string[];
  recipients?: string[];
  transfers?: TransferView[];
  block: BlockView;
  fee: FeesView;
  asset?: AssetView;
  details: Record<string, unknown> & {
    operationType?: OperationType;
    metadata?: {
      reason?: string;
    };
  };
};

export type TransferProposal = {
  contract_id: string;
  sender: string;
  receiver: string;
  amount: string;
  instrument_admin: string;
  instrument_id: string;
  memo?: string;
  expires_at_micros: number;
  update_id: string;
};

export type GetTransferPreApprovalResponse = {
  contract_id: string;
  receiver: string;
  provider: string;
  valid_from: string; // ISO 8601 date-time
  last_renewed_at: string; // ISO 8601 date-time
  expires_at: string; // ISO 8601 date-time
};

/*
 * Transaction
 */

export type TransferStep =
  | { type: "multi-step" }
  | { type: "single-step" }
  | { type: "not-applicable" };

export type PrepareTransferResponse = {
  serialized: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any; // The transaction in JSON form
  hash: string;
  step: TransferStep;
};

export type PrepareTransferRequest = {
  type: "token-transfer-request";
  recipient: string;
  amount: string;
  instrument_id: string;
  execute_before_secs: number;
  instrument_admin?: string;
  reason?: string;
  picking_strategy?:
    | "biggest-first"
    | "biggest-first-minimal"
    | "smallest-first"
    | "smallest-first-minimal";
};

export type PrepareTransferInstructionRequest =
  | {
      type: "accept-transfer-instruction";
      contract_id: string;
      reason?: string;
    }
  | {
      type: "reject-transfer-instruction";
      contract_id: string;
      reason?: string;
    }
  | {
      type: "withdraw-transfer-instruction";
      contract_id: string;
      reason?: string;
    };

export type SubmitTransactionRequest = {
  serialized: string;
  signature: string;
};

export type SubmitTransactionResponse = {
  submission_id: string;
  update_id: string;
};

export type TapRequest = {
  partyId: string;
  amount?: number;
};

export type PrepareTapResponse = {
  serialized: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any; // The transaction in JSON form
  hash: string;
  step: TransferStep;
};

export type SubmitTapRequestRequest = {
  partyId: string;
  serialized: string;
  signature: string;
};

export type SubmitTapRequestResponse = {
  submission_id: string;
  update_id: string;
};

export enum TransactionType {
  TAP_REQUEST = "tap-request",
  TRANSFER_PRE_APPROVAL_PROPOSAL = "transfer-pre-approval-proposal",
}

/*
 * Events
 */

export type Timestamp = {
  seconds: number;
  nanos: number;
};

export type BaseEvent = {
  type: string;
  contract_id: string;
  details: string;
};

export type CreatedEvent = BaseEvent & {
  template_id: {
    package_id: string;
    module_name: string;
    entity_name: string;
  };
  signatories: string[];
  observers: string[];
  details: {
    createArguments: { fields: unknown[] };
  };
};

export type ExercisedEvent = BaseEvent & {
  template_id: {
    package_id: string;
    module_name: string;
    entity_name: string;
  };
  choice: string;
  consuming: boolean;
  acting_parties: string[];
};

export type Event = BaseEvent | CreatedEvent | ExercisedEvent;

export type TxInfo = {
  update_id: string;
  command_id: string;
  workflow_id: string;
  effective_at: Timestamp;
  offset: number;
  synchronizer_id: string;
  record_time: Timestamp;
  events: Record<string, Event>[];
  trace_context: string;
};
