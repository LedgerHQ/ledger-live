export enum AleoCustomModal {
  SELF_TRANSFER = "MODAL_ALEO_SELF_TRANSFER",
  BOND_PUBLIC = "MODAL_ALEO_BOND_PUBLIC",
  MANAGE = "MODAL_ALEO_MANAGE",
  UNBOND = "MODAL_ALEO_UNBOND",
  CLAIM_UNBOND = "MODAL_ALEO_CLAIM_UNBOND",
}

export const LIVE_BLOCK_HEIGHT_POLL_MS = 10_000;

/**
 * Reaching the unbonding height is visible to the live block-height poll long before it is
 * visible to `account.blockHeight`, which only moves on a sync. Everything that decides
 * whether funds are claimable — the status icon, the claim amount, and
 * `getTransactionStatus` — reads the synced height, so the crossing has to be turned into a
 * sync request rather than into an enabled CTA.
 *
 * Without this the row would sit stale until the 8-minute background tick
 * (`SYNC_ALL_INTERVAL`); nothing is pending at that point, so the 10-second
 * `SYNC_PENDING_INTERVAL` loop does not cover it.
 */
export const UNBONDING_SYNC_RETRY_MS = 10_000;

/** Bounds the retry loop; the first sync normally settles it. */
export const MAX_UNBONDING_SYNC_ATTEMPTS = 3;

/**
 * Must exceed the `SyncSkipUnderPriority priority={100}` that the staking flow bodies mount,
 * or the request is dropped while any of those modals is open (see `createStakingFlowBody`).
 */
export const UNBONDING_SYNC_PRIORITY = 200;

/**
 * Figment runs a different validator address on each network, and both are named
 * "Figment" in the committee validator-metadata. A single constant silently
 * pre-selects an address absent from the other network's committee, which renders
 * as "nothing is selected" rather than as an error.
 */
export const DEFAULT_ALEO_VALIDATOR: Record<"mainnet" | "testnet", string> = {
  mainnet: "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t",
  testnet: "aleo1l7avejc23yv6e8nx4udjwz89dw6mg95dzsp936hf77yuhnjywv9syl0ywc",
};
