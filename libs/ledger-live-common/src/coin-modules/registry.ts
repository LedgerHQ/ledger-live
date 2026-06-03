import { CurrencyNotSupported } from "@ledgerhq/errors";
import type { CoinModuleLoader, MockAccountModule } from "./types";
import type { AccountBridgeExtensions } from "@ledgerhq/types-live";

const loaders = new Map<string, CoinModuleLoader>();

function getLoader(family: string): CoinModuleLoader {
  const loader = loaders.get(family);
  if (!loader) throw new CurrencyNotSupported(`No coin module registered for family "${family}"`);
  return loader;
}

export function makeLoaderCache<T>(fn: (family: string) => Promise<T>): (family: string) => Promise<T>;
export function makeLoaderCache<T>(fn: (family: string) => Promise<T> | undefined): (family: string) => Promise<T> | undefined;
export function makeLoaderCache<T>(fn: (family: string) => Promise<T> | undefined) {
  const cache = new Map<string, Promise<T>>();
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
}

export function getRegisteredFamilies(): string[] {
  return [...loaders.keys()];
}

export const loadSetupForFamily = makeLoaderCache((family) =>
  getLoader(family).loadSetup()
);

export const loadTransactionForFamily = makeLoaderCache((family) =>
  getLoader(family).loadTransaction()
);

export const loadDeviceTxConfigForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadDeviceTxConfig?.()
);

export const loadWalletApiAdapterForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadWalletApiAdapter?.()
);

export const loadPlatformAdapterForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadPlatformAdapter?.()
);

export const loadAccountModuleForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadAccount?.()
);

export const loadMockBridgeForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadMockBridge?.()
);

const resolvedMockAccounts = new Map<string, MockAccountModule>();

export const loadMockAccountForFamily = makeLoaderCache((family) => {
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

export const loadValidateAddressForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadValidateAddress?.()
);

export const loadSignerForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadSigner?.()
);

const cachedLoadBridgeExtensions = makeLoaderCache((family) =>
  loaders.get(family)?.loadBridgeExtensions?.()
);

export const loadBridgeExtensionsForFamily = async (
  family: string,
): Promise<AccountBridgeExtensions> => (await cachedLoadBridgeExtensions(family)) ?? {};
