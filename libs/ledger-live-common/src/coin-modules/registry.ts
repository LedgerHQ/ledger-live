import { CurrencyNotSupported } from "@ledgerhq/errors";
import type { CoinModuleLoader } from "./types";
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
    if (p !== undefined) cache.set(family, p);
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

export const loadMockAccountForFamily = makeLoaderCache((family) =>
  loaders.get(family)?.loadMockAccount?.()
);

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
