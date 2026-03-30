/**
 * Types for the Canton Gateway HTTP API (OpenAPI 3.1).
 *
 * (published Redoc: https://canton-gateway.api.live.ledger.com/docs/openapi/redoc/gateway.yaml).
 *
 * Path templates use `{node_preset_id}` and `{party_id}` as in OpenAPI; clients substitute
 * the configured node id and party id respectively.
 */

/*
 * Parties
 */

/** Nested in {@link OnboardingPrepareResponse}; mirrors topology transaction fields from onboarding prepare. */
export type TopologyTransactionData = {
  serialized: string;
  hash: string;
  transaction: unknown;
};

/** `OnboardingPrepareResponse.transactions` (`TopologyTransactions` in OpenAPI). */
export type TopologyTransactions = {
  namespace_transaction: TopologyTransactionData;
  party_to_key_transaction: TopologyTransactionData;
  party_to_participant_transaction: TopologyTransactionData;
  combined_hash: string;
};

/** `POST /v1/node/{node_preset_id}/onboarding/prepare` — response 200 (`OnboardingPrepareResponse`). */
export type OnboardingPrepareResponse = {
  party_id: string;
  party_name: string;
  public_key_fingerprint: string;
  transactions: TopologyTransactions;
  challenge_nonce: string;
  challenge_deadline: number;
};

/** `POST /v1/node/{node_preset_id}/onboarding/prepare` — request body (`OnboardingPrepareRequest`). */
export type OnboardingPrepareRequest = {
  public_key: string;
  public_key_type: "ed25519";
};

/**
 * `GET /v1/node/{node_preset_id}/party/{identifier}?by=...` — response 200 (`Party`).
 * Slightly relaxed vs OpenAPI: `threshold` is optional because some responses omit it.
 */
export type Party = {
  party_id: string;
  public_key: string;
  participants?: string[];
  threshold?: number;
};

/** `POST /v1/node/{node_preset_id}/onboarding/submit` — request body (`OnboardingSubmitRequest`). */
export type OnboardingSubmitRequest = {
  prepare_request: OnboardingPrepareRequest;
  prepare_response: OnboardingPrepareResponse;
  signature: string;
  application_signature?: string;
};

/** `POST /v1/node/{node_preset_id}/onboarding/submit` — response 201 (`OnboardingSubmitResponse`). */
export type OnboardingSubmitResponse = {
  party: Party;
};

/** Client-side convenience shape for party-already-exists style conflicts during onboarding (not a named OpenAPI schema). */
export type OnboardingSubmitError409 = {
  partyId: string;
  status: 409;
  type: "PARTY_ALREADY_EXISTS";
  message: string;
};

/*
 * State
 */

/** Element of `GetBalanceResponse.balances`; maps to OpenAPI `Balance`. */
export type InstrumentBalance = {
  admin_id: string;
  instrument_id: string;
  amount: string;
  locked: boolean;
  utxo_count: number;
};

/** `GET /v1/node/{node_preset_id}/party/{party_id}/balance` — response 200 (`GetBalanceResponse`). */
export type GetBalanceResponse =
  | {
      at_round: number;
      balances?: InstrumentBalance[];
    }
  // temporary backwards compatibility
  | InstrumentBalance[];

/** `OperationView.status` — OpenAPI `OperationView`. */
export type OperationStatusView = "Failed" | "Success";

/** `OperationView.type` (high-level operation category). */
export type OperationTypeView =
  | "Initialize"
  | "Interaction"
  | "Receive"
  | "Send"
  | "Staking"
  | "Unknown";

/** `OperationView.details.operationType` (Canton-specific subtype). */
export type OperationType =
  | "pre-approval"
  | "tap"
  | "transfer"
  | "transfer-proposal"
  | "transfer-rejected"
  | "transfer-withdrawn";

/** `OperationView.block`. */
export type BlockView = {
  height: number;
  time: string; // ISO 8601 date-time
  hash?: string;
};

/** `OperationView.asset` / `FeesView.asset`. */
export type AssetView =
  | {
      type: "native";
      instrumentAdmin: string;
      instrumentId: string;
      issuer?: string;
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

/** `OperationView.fee`. */
export type FeesView = {
  value: string;
  asset: AssetView;
  details: unknown;
};

/** `OperationView.transfers` item. */
export type TransferView = {
  address: string;
  type: OperationTypeView;
  value: string;
  details: unknown;
  asset: string;
};

/** `GET /v1/node/{node_preset_id}/party/{party_id}/operations` — each element of `GetOperationsResponse.operations`. */
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
  details: {
    operationType?: OperationType;
    metadata?: {
      reason?: string;
    };
  };
};

/** `GET /v1/node/{node_preset_id}/party/{party_id}/transfer-proposals` — array item (`TransferProposal`). */
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

/** `GET /v1/node/{node_preset_id}/party/{party_id}/transfer-preapproval` — response 200 (`GetTransferPreapprovalResponse` in OpenAPI). */
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

/** `TokenTransferRequest.picking_strategy` on `POST .../transaction/prepare`. */
export type SendPickingStrategy =
  | "biggest-first"
  | "biggest-first-minimal"
  | "smallest-first"
  | "smallest-first-minimal";

/** `PrepareTransactionResponse.step`. */
export type TransferStep =
  | { type: "multi-step" }
  | { type: "single-step" }
  | { type: "not-applicable" };

/** `POST /v1/node/{node_preset_id}/party/{party_id}/transaction/prepare` — response 200 (`PrepareTransactionResponse`). */
export type PrepareTransferResponse = {
  serialized: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any; // The transaction in JSON form
  hash: string;
  step: TransferStep;
};

/**
 * `POST /v1/node/{node_preset_id}/party/{party_id}/transaction/prepare` — request body variant
 * `TokenTransferRequest` (`type: "token-transfer-request"`).
 */
export type PrepareTransferRequest = {
  type: "token-transfer-request";
  recipient: string;
  amount: string;
  instrument_id: string;
  execute_before_secs: number;
  instrument_admin?: string;
  reason?: string;
  picking_strategy?: SendPickingStrategy;
};

/**
 * `POST /v1/node/{node_preset_id}/party/{party_id}/transaction/prepare` — request body variants
 * `AcceptTransferInstruction` | `RejectTransferInstruction` | `WithdrawTransferInstruction`.
 */
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

/** `POST /v1/node/{node_preset_id}/party/{party_id}/transaction/submit` — request body (`SubmitTransactionRequest`). */
export type SubmitTransactionRequest = {
  serialized: string;
  signature: string;
};

/** `POST /v1/node/{node_preset_id}/party/{party_id}/transaction/submit` — response 200 (`SubmitTransactionResponse`). */
export type SubmitTransactionResponse = {
  submission_id: string;
  update_id: string;
};

/** App-layer input for building a tap prepare call; combined with {@link TransactionType.TAP_REQUEST} in the prepare body. */
export type TapRequest = {
  partyId: string;
  amount?: string;
};

/** Same schema as {@link PrepareTransferResponse} when prepare body uses `TapRequest` (`tap-request`). */
export type PrepareTapResponse = {
  serialized: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any; // The transaction in JSON form
  hash: string;
  step: TransferStep;
};

/** Same path as {@link SubmitTransactionRequest}; `partyId` is used only for URL construction on the client. */
export type SubmitTapRequestRequest = {
  partyId: string;
  serialized: string;
  signature: string;
};

/** Same as {@link SubmitTransactionResponse}. */
export type SubmitTapRequestResponse = {
  submission_id: string;
  update_id: string;
};

/** Discriminator `type` values for `PrepareTransactionRequest` on `POST .../transaction/prepare`. */
export enum TransactionType {
  TAP_REQUEST = "tap-request",
  TRANSFER_PRE_APPROVAL_PROPOSAL = "transfer-pre-approval-proposal",
}

/*
 * Events — nested under `CantonTransaction` / `CantonEvent` in OpenAPI; also returned inside
 * `PageView_T.items` from:
 * - `GET .../transactions/raw`, `GET .../transactions`
 * - `GET .../party/{party_id}/transactions/raw`, `GET .../party/{party_id}/transactions`
 */

/** OpenAPI `CantonTimestamp`. */
export type CantonTimestamp = {
  seconds: number;
  nanos: number;
};

/** OpenAPI `CantonIdentifier` (e.g. on created/exercised contract events). */
export type CantonIdentifier = {
  package_id: string;
  module_name: string;
  entity_name: string;
};

/** Simplified event shape; not the same as OpenAPI `Event` (LAMA normalized). Prefer {@link CantonEvent} for ledger payloads. */
export type BaseEvent = {
  type: string;
  contract_id: string;
  details: string;
};

/** OpenAPI `CantonEvent` variant `created` (`Created`). */
export type CreatedEvent = {
  type: "created";
  contract_id: string;
  template_id?: CantonIdentifier;
  signatories?: string[];
  observers?: string[];
  details: unknown;
};

/** OpenAPI `CantonEvent` variant `exercised` (`Exercised`). */
export type ExercisedEvent = {
  type: "exercised";
  contract_id: string;
  template_id?: CantonIdentifier;
  choice: string;
  consuming: boolean;
  acting_parties?: string[];
  details: unknown;
};

/** OpenAPI `CantonEvent` variant `archived` (`Archived`). */
export type ArchivedEvent = {
  type: "archived";
  contract_id: string;
  details: unknown;
};

/** OpenAPI `CantonEvent` (discriminated union of archived | created | exercised). */
export type CantonEvent = ArchivedEvent | CreatedEvent | ExercisedEvent;

/** Local union; OpenAPI defines `CantonEvent` and a separate LAMA `Event` model on normalized views. */
export type Event = BaseEvent | CreatedEvent | ExercisedEvent;

/** OpenAPI `CantonTransaction`; appears as `PageView_T.items[]` on transaction history endpoints. */
export type CantonTransaction = {
  update_id: string;
  command_id?: string;
  workflow_id?: string;
  effective_at?: CantonTimestamp;
  offset: number;
  synchronizer_id: string;
  record_time?: CantonTimestamp;
  events?: CantonEvent[];
  trace_context?: unknown;
};
