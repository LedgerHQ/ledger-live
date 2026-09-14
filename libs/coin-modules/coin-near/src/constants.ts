export const FALLBACK_STORAGE_AMOUNT_PER_BYTE = "10000000000000000000";
/**
 * The protocol's minimum gas price, used until `preload()` reports the live one.
 *
 * The generic-coin-framework bridge has no preload step, so on that route the cache keeps its
 * initial value for the whole session. Seeding this with zero made every fee estimate collapse to
 * zero, which let `canStake` offer staking to accounts that cannot cover it. The chain floors the
 * gas price here and it rarely moves off the floor, so it is a safe basis for a "can you afford
 * this?" heuristic — actual transaction pricing still uses the live value via `estimateFees`.
 */
export const FALLBACK_GAS_PRICE = "100000000";
export const NEW_ACCOUNT_SIZE = 182;
export const MIN_ACCOUNT_BALANCE_BUFFER = "50000000000000000000000";
export const STAKING_GAS_BASE = "25000000000000";
export const FIGMENT_NEAR_VALIDATOR_ADDRESS = "ledgerbyfigment.poolv1.near";
export const FRACTIONAL_DIGITS = 5;
/** How many staking pools to surface; the indexer orders them by stake, so this is the top N. */
export const VALIDATORS_COUNT = 200;
export const YOCTO_THRESHOLD_VARIATION = "10";
export const NEAR_DUMMY_ADDRESS =
  "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";
