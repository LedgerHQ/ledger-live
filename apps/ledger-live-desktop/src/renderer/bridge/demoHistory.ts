/**
 * `seedIdentifier` value marking an account whose operations are demo data.
 * The sync loop skips these: a sync would replace the invented operations with
 * what the chain really has (usually nothing).
 */
export const DEMO_HISTORY_SEED = "demo-history";
