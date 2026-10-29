/**
 * `seedIdentifier` value marking an account whose operations are demo data.
 * The sync loop skips these: a sync would replace the invented operations with
 * what the chain really has (usually nothing).
 */
export const DEMO_HISTORY_SEED = "demo-history";

/** The accounts the sync loop should run on: demo-history ones would lose their operations. */
export const syncableAccounts = <T extends { seedIdentifier: string }>(accounts: T[]): T[] =>
  accounts.filter(account => account.seedIdentifier !== DEMO_HISTORY_SEED);
