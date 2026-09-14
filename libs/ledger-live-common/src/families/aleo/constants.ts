// Encapsulate for LLD and LLM
export * from "@ledgerhq/coin-aleo/constants";

// UI only constants (desktop & mobile related)

export const PRIVATE_BALANCE_PLACEHOLDER = "***";
export const MANDATORY_SYNC_POLLING_DELAY = 3000;

/** Minimum time (ms) between progress state updates in the hook to avoid flooding React renders. */
export const PROGRESS_THROTTLE_INTERVAL_MS = 500;

/**
 * Reaching the unbonding height is visible to the live block-height poll long before it is
 * visible to `account.blockHeight`, which only moves on a sync. Everything that decides
 * whether funds are claimable reads the synced height, so the crossing has to be turned into
 * a sync request rather than into an enabled CTA.
 */
export const UNBONDING_SYNC_RETRY_MS = 10_000;

/** Bounds the retry loop; the first sync normally settles it. */
export const MAX_UNBONDING_SYNC_ATTEMPTS = 3;

/** How often the unbonding countdown asks the node for the chain tip. */
export const LIVE_BLOCK_HEIGHT_POLL_MS = 10_000;

/**
 * Must exceed the `SyncSkipUnderPriority priority={100}` that the Desktop staking flow bodies
 * mount, or the request is dropped while any of those modals is open.
 */
export const UNBONDING_SYNC_PRIORITY = 200;
