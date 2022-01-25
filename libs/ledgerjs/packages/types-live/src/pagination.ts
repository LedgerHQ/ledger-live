/**
 * A pagination config holds the user's pagination state
 * this is a state that usually should leave during the app lifecycle, but is not persisted
 * it drives the number of operations to poll in accounts
 * when a user paginate more, the number should accordingly be incremented
 * The UI should manage scrolling ahead of time (e.g. if 30 ops is displayed and UI have pages of 20 ops, the UI can already request to poll 70 ops so it have 2 pages in advance)
 * The UI must always do max() to keep the increasing the counter and not going back to lower value: that optim the sync to not recompute things too much
 */
export type PaginationConfig = {
  // operations to pull for each account
  operationsPerAccountId?: Record<string, number>;
  // if define and there is no specific account in operationsPerAccountId,
  // this will be the operations count used
  operations?: number;
};
export type SyncConfig = {
  paginationConfig: PaginationConfig;
  // allows to disable the synchronization part – typically to only paginate more
  withoutSynchronize?: boolean;
  blacklistedTokenIds?: string[];
};
