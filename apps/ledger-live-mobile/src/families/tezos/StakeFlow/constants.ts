// The just-broadcast delegation can lag on-chain; poll the account until it is reflected,
// otherwise the stake estimate keeps failing with MustDelegateBeforeStaking.
export const AWAIT_DELEGATION_SYNC_PRIORITY = 100;
export const AWAIT_DELEGATION_POLL_INTERVAL_MS = 5000;
export const MAX_AWAIT_DELEGATION_POLLS = 12;
