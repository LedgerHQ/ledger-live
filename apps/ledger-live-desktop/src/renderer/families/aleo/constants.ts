export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
  BOND_PUBLIC = "MODAL_ALEO_BOND_PUBLIC",
  MANAGE = "MODAL_ALEO_MANAGE",
  UNBOND = "MODAL_ALEO_UNBOND",
  CLAIM_UNBOND = "MODAL_ALEO_CLAIM_UNBOND",
}

// FIXME: move from there
/** Interval (ms) at which the live block height is polled to keep the unstaking countdown fresh. */
export const LIVE_BLOCK_HEIGHT_POLL_MS = 10_000;
