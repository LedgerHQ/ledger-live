// The `zcashShielded` feature flag decides whether @ledgerhq/coin-zcash runs its shielded
// engine or stays transparent-only (no native addon: React Native, or the desktop app with
// the flag off). Every Zcash currency belongs to the `zcash` family, served by coin-zcash.
//
// The host app resolves the flag itself -- remote config, env override and the developer
// drawer's override folded in -- and mirrors it here, the way `setSuiTransport` /
// `setCosmosLdmkEnabled` are wired: a coin module cannot read React feature flags. The
// mirror lives in live-common rather than in the coin module because shared bridge code may
// not import coin-specific packages at runtime (enforced by
// `coin-modules/no-coin-eager-imports.test.ts`).
//
// Defaults to `false`, so an unconfigured host (the mobile app) is transparent-only.

let shieldedEnabled = false;

/** Mirror the host app's resolved `zcashShielded` feature flag (see above). */
export const setZcashShieldedEnabled = (enabled: boolean): void => {
  shieldedEnabled = enabled;
};

/** Whether @ledgerhq/coin-zcash runs its shielded engine. */
export const isZcashShieldedEnabled = (): boolean => shieldedEnabled;
