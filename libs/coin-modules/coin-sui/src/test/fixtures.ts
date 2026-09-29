/**
 * Live mainnet accounts for the integ suites. They are third-party addresses, so their state can
 * change at any time. When a precondition below stops holding, replace the address here.
 */

/**
 * Holds `StakedSui` in active validators' pools (9 stakes in 9 pools, oldest from epoch 0), so
 * `delegate` and `estimatedReward` resolve. Its last transaction must stay within the GraphQL
 * arm's ~90-day history retention, or the sync-migration `operationsCount` check reads 0 there.
 * Not a validator: stake reads list the objects an address owns, and a validator's own address
 * holds none unless its operator self-stakes.
 */
export const STAKE_DELEGATOR = "0x571bad7fd728af0fb5589888e8124214467ae3ba7947cff39dea9d0638e5979a";

/** Holds USDC and enough SUI for dry-run gas. Turns over a 50-item history page in ~7s. */
export const ACTIVE_ACCOUNT = "0x0feb54a725aa357ff2f5bc6bb023c05b310285bd861275a30521f339a434ebb3";

/**
 * Steady, high-volume history: several pages deep on both transports, and a 50-item page spans
 * ~20min, so two back-to-back "newest page" calls still overlap.
 */
export const STEADY_ACCOUNT = "0x6cae00a08b04f6a4ca7157628ccf60f40078616deab20d2b626bd1de7c8a16c9";
