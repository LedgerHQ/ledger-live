import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { isCoinModuleRegistered } from "../coin-modules/registry";

// Every Zcash account is served by the standalone @ledgerhq/coin-zcash. The
// `zcashShielded` feature flag only decides whether that module runs its
// shielded engine or stays transparent-only (no native addon: React Native, or
// the desktop app with the flag off).
//
// The host app resolves the flag itself -- remote config, env override and the
// developer drawer's override folded in -- and mirrors it here, the way
// `setSuiTransport` / `setCosmosLdmkEnabled` are wired: a coin module cannot
// read React feature flags. The mirror lives in live-common rather than in the
// coin module because shared bridge code may not import coin-specific packages
// at runtime (enforced by `coin-modules/no-coin-eager-imports.test.ts`), which
// is also why the Zcash currency ids are listed here rather than imported.
//
// Defaults to `false`, so an unconfigured host (the mobile app) is transparent-only.

let shieldedEnabled = false;

/** Mirror the host app's resolved `zcashShielded` feature flag (see above). */
export const setZcashShieldedEnabled = (enabled: boolean): void => {
  shieldedEnabled = enabled;
};

/** Whether @ledgerhq/coin-zcash runs its shielded engine. */
export const isZcashShieldedEnabled = (): boolean => shieldedEnabled;

const ZCASH_CURRENCY_IDS = new Set(["zcash", "zcash_testnet"]);

/** Whether `currencyId` is one of the Zcash currencies @ledgerhq/coin-zcash serves. */
export const isZcashCurrencyId = (currencyId: string): boolean =>
  ZCASH_CURRENCY_IDS.has(currencyId);

/**
 * `zcash` for a Zcash currency, else `currency.family`. A host that registers a
 * reduced set of coin modules without `zcash` (wallet-cli) keeps `currency.family`,
 * so the lookup does not throw `CurrencyNotSupported` there.
 */
const zcashFamilyOr = (currency: CryptoCurrency): string =>
  ZCASH_CURRENCY_IDS.has(currency.id) && isCoinModuleRegistered("zcash")
    ? "zcash"
    : currency.family;

/** Bridge family for `currency`. */
export function resolveFamily(currency: CryptoCurrency): string {
  return zcashFamilyOr(currency);
}

/**
 * Bridge family whose raw<->live assign hooks carry `currency`'s persisted account data, in
 * both directions. coin-zcash reads and writes the account shape coin-bitcoin persisted
 * (`families/zcash/serialization.test.ts`), so accounts saved before Zcash moved to coin-zcash
 * load unchanged.
 */
export function resolveSerializationFamily(currency: CryptoCurrency, _accountId: string): string {
  return zcashFamilyOr(currency);
}
