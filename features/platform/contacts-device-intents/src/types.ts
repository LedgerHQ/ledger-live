export type ContactIdentifier = string;
export type ChainId = string | number;
export type BlockchainFamily = string;
export type GroupHandle = string;
export type Proof = string;

/**
 * Shared job states that do not carry intent-specific result payloads.
 * Subject to change with DIE wiring; Input/Result contracts stay stable.
 */
export type JobStateBase =
  | { type: "pending" }
  | { type: "awaiting-device-confirmation" }
  | { type: "failed"; error: Error };
