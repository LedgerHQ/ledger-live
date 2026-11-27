// Copied from @ledgerhq/agent-intent-sdk (agent-intent-sdk#68-#70): import from the SDK once it is released (NTTVS-1198).

export const AGENT_INTENT_STATUSES = [
  "created",
  "crafted",
  "signed",
  "broadcast",
  "success",
  "failed",
  "rejected",
  "cancelled",
  "expired",
] as const;

export type AgentIntentStatus = (typeof AGENT_INTENT_STATUSES)[number];

export function isActionableIntentStatus(status: AgentIntentStatus | (string & {})): boolean {
  return status === "created" || status === "crafted";
}

export const AGENT_NAME_MAX_LENGTH = 80;
export const AGENT_DESCRIPTION_MAX_LENGTH = 280;

export const AGENT_INTENT_PAGE_SIZES = [1, 5, 10, 50, 100] as const;

export const AGENT_INTENT_ERROR_TYPES = [
  "ambiguous_trustchain",
  "broadcast_rejected",
  "duplicate_event",
  "illegal_transition",
  "malformed_intent",
  "invalid_craft_parameters",
  "nonce_reused",
  "not_a_member",
  "pubkey_mismatch",
  "signature_invalid",
  "signature_malformed",
  "stale_revision",
  "token_expired",
  "token_invalid",
  "unexpected_caller",
  "unknown",
  "wrong_client_type",
] as const;

export type AgentIntentAsset = { type: string; assetReference?: string; assetOwner?: string };

export type AgentIntentSendOperation = {
  type: "send";
  network: string;
  sender: string;
  recipient: string;
  amount: string;
  asset: AgentIntentAsset;
  feeStrategy?: string;
  memo?: string;
  description?: string;
};

export type AgentIntentSwapOperation = {
  type: "swap";
  network: string;
  sender: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  toAmount: string;
  provider: string;
  description?: string;
};

export type AgentIntentUnknownOperation = { type: string; [field: string]: unknown };

export type AgentIntentOperation =
  | AgentIntentSendOperation
  | AgentIntentSwapOperation
  | AgentIntentUnknownOperation;

export type AgentIntentContext = { transactionId?: string };

export type AgentIntentRecord = {
  id: string;
  agentPubkey: string;
  status: AgentIntentStatus | (string & {});
  intent: AgentIntentOperation;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  context?: AgentIntentContext;
};

export type AgentIntentStats = { total: number; approved: number; rejected: number };

export type AgentIntentCraft = {
  rawTransaction: string;
  revision: number;
  details?: Record<string, unknown>;
};

export type AgentIntentSignatureReceipt = { transactionId: string };

export type AgentProfileFields = {
  name: string;
  description: string;
  source: string;
  iconRef?: string;
};

export type AgentProfileUpdate = Partial<AgentProfileFields>;

export type AgentProfileRecord = {
  agentPubkey: string;
  profile: AgentProfileFields;
  createdAt: string;
  updatedAt: string;
};
