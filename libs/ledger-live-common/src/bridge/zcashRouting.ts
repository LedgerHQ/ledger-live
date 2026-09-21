import type { CryptoCurrency } from "@domain/entity-currency-crypto";

// Which module serves a Zcash account: the standalone @ledgerhq/coin-zcash, or
// coin-bitcoin's Zcash chain-adapter.
//
// The host app resolves the `zcashShielded` feature flag itself -- remote config,
// env override and the developer drawer's override folded in -- and mirrors it
// here, the way `setSuiTransport` / `setCosmosLdmkEnabled` are wired: a coin
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

/** Bridge family for `currency`: `zcash` when shielded, otherwise `currency.family`. */
export function resolveFamily(currency: CryptoCurrency): string {
  return currency.id === "zcash" && isZcashShieldedEnabled() ? "zcash" : currency.family;
}

/**
 * Bridge family whose raw<->live assign hooks carry `currency`'s persisted account data,
 * in both directions. Always `zcash` for Zcash, whatever the flag says, for two reasons:
 * coin-zcash's hooks round-trip coin-bitcoin's transparent shape as well as the shielded
 * `privateInfo` coin-bitcoin knows nothing about, so they are the safe endpoint in either
 * routing state; and accounts are deserialized at app startup, before the host app has
 * mirrored the flag here, so a flag-gated answer would read `false` and silently drop
 * `privateInfo`.
 *
 * Both `toAccountRaw` and `fromAccountRaw` must use this rather than `resolveFamily`:
 * routing a save through coin-bitcoin drops what the load restored -- and with `MOCK=true`
 * it drops the transparent `bitcoinResources` too, since coin-bitcoin's mock bridge
 * declares no assign hooks at all.
 */
export function resolveSerializationFamily(currency: CryptoCurrency): string {
  return currency.id === "zcash" ? "zcash" : currency.family;
}
