import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getValidators, type AleoValidator } from "../logic";

// Keep the platform's preload cadence aligned with the getValidators LRU TTL so
// preload does real work (a fresh fetch) rather than being throttled longer than
// the cache it warms.
export const PRELOAD_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

// The renderer reads validators through getValidators() (LRU-cached, keyed by
// currency.id). preload simply warms that cache at bridge init so the first
// validator-picker mount / BOND_PUBLIC status recompute is served from memory
// instead of paying a cold network round-trip. The returned array is what the
// platform persists and later hands back to hydrate().
export const preload = async (currency: CryptoCurrency): Promise<AleoValidator[]> => {
  try {
    return await getValidators(currency);
  } catch (error) {
    // Validators are non-critical for account sync; never let a fetch failure
    // block preload. A subsequent getValidators() call (e.g. on modal open)
    // retries on its own.
    log("aleo/preload", "failed to fetch validators", { error });
    return [];
  }
};

// Untrusted: hydrate receives data that was serialized to disk in a previous
// session, so validate every field before seeding the cache (see the
// CurrencyBridge contract).
function isValidPersistedValidator(value: unknown): value is AleoValidator {
  if (typeof value !== "object" || value === null) return false;
  const { address, name, stake, isOpen, commission } = value as Record<string, unknown>;
  return (
    typeof address === "string" &&
    (name === undefined || typeof name === "string") &&
    typeof stake === "number" &&
    typeof isOpen === "boolean" &&
    typeof commission === "number"
  );
}

export const hydrate = (data: unknown, currency: CryptoCurrency): void => {
  if (!Array.isArray(data) || !data.every(isValidPersistedValidator)) return;

  // Seed the LRU so a fresh session serves persisted validators immediately;
  // preload's network refresh replaces this once it resolves.
  getValidators.hydrate(currency.id, data);
  log("aleo/preload", "hydrated " + data.length + " aleo validators");
};
