import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { isCoinModuleRegistered } from "../coin-modules/registry";

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

const isZcash = (currency: CryptoCurrency): boolean => currency.id === "zcash";

/** Bridge family for `currency`: `zcash` when shielded, otherwise `currency.family`. */
export function resolveFamily(currency: CryptoCurrency): string {
  return isZcash(currency) && isZcashShieldedEnabled() ? "zcash" : currency.family;
}

/**
 * Bridge family whose raw<->live assign hooks carry `currency`'s persisted account data, in
 * both directions. For a real (non-`mock:`) account id this is always `currency.family`
 * ("bitcoin" for Zcash): coin-bitcoin's real bridge round-trips `privateInfo` unconditionally
 * via its Zcash chain-adapter's own `assignFromAccountRaw`/`assignToAccountRaw`
 * (`coin-bitcoin/src/chain-adapters/zcash/index.ts`), flag-independent by design, so nothing
 * is lost by staying on it -- and staying on it means a real Zcash account never eager-loads
 * the standalone `@ledgerhq/coin-zcash` module (and its DMK signer) merely by being
 * deserialized.
 *
 * A `mock:` account id is the one case that needs `zcash`: `getAccountBridgeByFamily` special-
 * cases mock ids to the mock bridge of whatever family it's given regardless of `MOCK`, and
 * coin-bitcoin's mock bridge (`families/bitcoin/bridge/mock.ts`) declares no assign hooks at
 * all -- so routing a mock Zcash account through `bitcoin` would silently drop both
 * `privateInfo` and the transparent `bitcoinResources`. Routing it to `zcash` instead reaches
 * the standalone module's mock bridge, which does define them.
 *
 * Both `toAccountRaw` and `fromAccountRaw` must use this rather than `resolveFamily`, whose
 * answer is gated on the flag: accounts are deserialized at app startup, before the host app
 * has mirrored the flag, so a flag-gated router reads `false` there regardless.
 *
 * A mock id on a host that registers a reduced set of coin modules (wallet-cli registers
 * bitcoin, evm and solana only) has no `zcash` family to route to either, so it falls back to
 * `currency.family` too -- but that fallback does *not* carry the same guarantee a real
 * account id gets from staying on `currency.family`: `getAccountBridgeByFamily` still treats it
 * as a mock id and resolves coin-bitcoin's *mock* bridge, which (as above) declares no assign
 * hooks at all. So this combination only avoids throwing `CurrencyNotSupported`; it does not
 * preserve `privateInfo` or `bitcoinResources`. No real host is known to combine mock ids with
 * a reduced registry (mock mode is a dev/test path that registers every coin module), so this
 * is a defensive fallback rather than a supported data-preserving path.
 */
export function resolveSerializationFamily(currency: CryptoCurrency, accountId: string): string {
  if (!isZcash(currency)) return currency.family;
  const { type } = decodeAccountId(accountId);
  return type === "mock" && isCoinModuleRegistered("zcash") ? "zcash" : currency.family;
}
