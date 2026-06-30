import { CurrencyNotSupported } from "@ledgerhq/errors";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { CryptoCurrency, CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { CoinModuleLoader, MockAccountModule } from "./types";
import type { AccountBridgeExtensions } from "@ledgerhq/types-live";

const loaders = new Map<string, CoinModuleLoader>();

// Clear callbacks for every cache created by makeLoaderCache, so the registry
// can be fully reset for test isolation (see resetCoinModulesForTests).
const loaderCaches: Array<() => void> = [];

// Caches derived from the registered loaders' supportedCoins, invalidated on registry change.
let supportedIds: Set<CryptoCurrencyId> | null = null;
let supportedCurrencies: CryptoCurrency[] | null = null;

function getSupportedIds(): Set<CryptoCurrencyId> {
  if (!supportedIds) {
    const ids = new Set<CryptoCurrencyId>();
    for (const loader of loaders.values()) {
      for (const id of loader.supportedCoins) ids.add(getCryptoCurrencyById(id).id);
    }
    supportedIds = ids;
  }
  return supportedIds;
}

function invalidateSupportedCaches() {
  supportedIds = null;
  supportedCurrencies = null;
}

function getLoader(family: string): CoinModuleLoader {
  const loader = loaders.get(family);
  if (!loader) throw new CurrencyNotSupported(`No coin module registered for family "${family}"`);
  return loader;
}

export function makeLoaderCache<T>(
  fn: (family: string) => Promise<T>,
): (family: string) => Promise<T>;
export function makeLoaderCache<T>(
  fn: (family: string) => Promise<T> | undefined,
): (family: string) => Promise<T> | undefined;
export function makeLoaderCache<T>(fn: (family: string) => Promise<T> | undefined) {
  const cache = new Map<string, Promise<T>>();
  loaderCaches.push(() => cache.clear());
  return (family: string): Promise<T> | undefined => {
    const hit = cache.get(family);
    if (hit !== undefined) return hit;
    const p = fn(family);
    if (p !== undefined) {
      cache.set(family, p);
      // Evict on rejection so a transient failure (HMR race, network blip
      // on a CDN-served chunk, …) can be retried on the next call instead
      // of poisoning the cache for the rest of the session.
      p.catch(() => {
        if (cache.get(family) === p) cache.delete(family);
      });
    }
    return p;
  };
}

export function registerCoinModules(modules: CoinModuleLoader[]): void {
  for (const mod of modules) loaders.set(mod.family, mod);
  invalidateSupportedCaches();
}

export function getRegisteredFamilies(): string[] {
  return [...loaders.keys()];
}

export function isCoinModuleRegistered(family: string): boolean {
  return loaders.has(family);
}

export function isCurrencySupported(currency: CryptoCurrency): boolean {
  return getSupportedIds().has(currency.id);
}

export function listSupportedCurrencies(): CryptoCurrency[] {
  if (!supportedCurrencies) {
    supportedCurrencies = [...getSupportedIds()].map(id => getCryptoCurrencyById(id));
  }
  return supportedCurrencies.slice(); // copy: callers must not mutate the shared cache
}

/** Test-only: clear the registry so a test can register exactly the loaders it needs. */
export function resetCoinModulesForTests(): void {
  loaders.clear();
  supportedIds = null;
  supportedCurrencies = null;
  resolvedMockAccounts.clear();
  for (const clear of loaderCaches) clear();
}

export const loadSetupForFamily = makeLoaderCache(family => getLoader(family).loadSetup());

export const loadTransactionForFamily = makeLoaderCache(family =>
  getLoader(family).loadTransaction(),
);

export const loadDeviceTxConfigForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadDeviceTxConfig?.(),
);

export const loadWalletApiAdapterForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadWalletApiAdapter?.(),
);

export const loadPlatformAdapterForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadPlatformAdapter?.(),
);

export const loadAccountModuleForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadAccount?.(),
);

export const loadMockBridgeForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadMockBridge?.(),
);

const resolvedMockAccounts = new Map<string, MockAccountModule>();

export const loadMockAccountForFamily = makeLoaderCache(family => {
  // Preserve makeLoaderCache contract: return undefined synchronously when
  // there's no loader or no loadMockAccount, so the function still returns
  // undefined (not Promise<undefined>) for unknown families.
  const p = loaders.get(family)?.loadMockAccount?.();
  if (!p) return undefined;
  return p.then(mod => {
    if (mod) resolvedMockAccounts.set(family, mod);
    return mod;
  });
});

/**
 * @deprecated Legacy sync read of an already-resolved mock account module.
 * Returns undefined if the module hasn't been awaited yet via
 * loadMockAccountForFamily. Used by `genAccount` (live-common/mock/account)
 * which stays synchronous because of its many sync call sites. Callers that
 * need family-specific resources pre-filled (e.g. cosmos delegations for the
 * e2e mock) MUST `await loadMockAccountForFamily(family)` beforehand so the
 * module is resolved in the registry cache and visible to this sync lookup.
 *
 * Prefer `loadMockAccountForFamily` (async) in new code.
 */
export function getLoadedMockAccountForFamily(family: string): MockAccountModule | undefined {
  return resolvedMockAccounts.get(family);
}

export const loadValidateAddressForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadValidateAddress?.(),
);

export const loadSignerForFamily = makeLoaderCache(family => loaders.get(family)?.loadSigner?.());

export const loadBridgeApiForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadBridgeApi?.(),
);

export const loadAccountRawAssignForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadAccountRawAssign?.(),
);

export const loadLocalApiForFamily = makeLoaderCache(family =>
  loaders.get(family)?.loadLocalApi?.(),
);

const cachedLoadBridgeExtensions = makeLoaderCache(family =>
  loaders.get(family)?.loadBridgeExtensions?.(),
);

export const loadBridgeExtensionsForFamily = async (
  family: string,
): Promise<AccountBridgeExtensions> => (await cachedLoadBridgeExtensions(family)) ?? {};
