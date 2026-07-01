export const PRIVATE_BALANCE_PLACEHOLDER = "***";

export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
  BOND_PUBLIC = "MODAL_ALEO_BOND_PUBLIC",
  MANAGE = "MODAL_ALEO_MANAGE",
  UNBOND = "MODAL_ALEO_UNBOND",
  CLAIM_UNBOND = "MODAL_ALEO_CLAIM_UNBOND",
}

export const MANDATORY_SYNC_POLLING_DELAY = 3000;

/** Minimum time (ms) between progress state updates in the hook to avoid flooding React renders. */
export const PROGRESS_THROTTLE_INTERVAL_MS = 500;
