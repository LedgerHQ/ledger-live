// Which module serves a Zcash account: the standalone @ledgerhq/coin-zcash, or
// coin-bitcoin's Zcash chain-adapter.
//
// The host app resolves the `zcashShielded` feature flag itself -- remote config,
// env override and the developer drawer's override folded in -- and mirrors it
// here, the way `setSuiGraphqlEnabled` / `setCosmosLdmkEnabled` are wired: a coin
// module cannot read React feature flags. The mirror lives in live-common rather
// than in the coin module because `bridge/impl.ts` reads it, and shared bridge
// code may not import coin-specific packages at runtime (enforced by
// `coin-modules/no-coin-eager-imports.test.ts`).
//
// Defaults to `false` so an unconfigured environment stays on the adapter.

let shieldedEnabled = false;

/** Mirror the host app's resolved `zcashShielded` feature flag (see above). */
export const setZcashShieldedEnabled = (enabled: boolean): void => {
  shieldedEnabled = enabled;
};

/** Whether Zcash accounts are served by @ledgerhq/coin-zcash. */
export const isZcashShieldedEnabled = (): boolean => shieldedEnabled;
