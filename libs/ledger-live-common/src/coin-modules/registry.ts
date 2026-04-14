import { CurrencyNotSupported } from "@ledgerhq/errors";
import type {
  AccountModule,
  CoinModuleLoader,
  DeviceTransactionConfigFn,
  FamilySetup,
  MockAccountModule,
  MockBridgeModule,
  PlatformAdapterModule,
  TransactionModule,
  WalletApiAdapterModule,
} from "./types";

const loaders = new Map<string, CoinModuleLoader>();

function getLoader(family: string): CoinModuleLoader {
  const loader = loaders.get(family);
  if (!loader) throw new CurrencyNotSupported(`No coin module registered for family "${family}"`);
  return loader;
}

export function registerCoinModules(modules: CoinModuleLoader[]): void {
  for (const mod of modules) loaders.set(mod.family, mod);
}

export function getRegisteredFamilies(): string[] {
  return [...loaders.keys()];
}

/**
 * Loads the family setup (message signer, etc.) for the given coin family.
 *
 * @remarks
 * This function is currently synchronous but will become `async` in a future
 * migration step (part of the async loader series — LIVE-28411).
 * Callers should already `await` this call so that no further changes are
 * needed once the function signature is updated.
 */
export const loadSetupForFamily = (family: string): FamilySetup =>
  getLoader(family).loadSetup();

export const loadTransactionForFamily = (family: string): TransactionModule =>
  getLoader(family).loadTransaction();

export const loadDeviceTxConfigForFamily = (
  family: string,
): DeviceTransactionConfigFn | undefined => loaders.get(family)?.loadDeviceTxConfig?.();

/**
 * Loads the Wallet API adapter module for the given coin family.
 *
 * @remarks
 * This function is currently synchronous but will become `async` in a future
 * migration step (part of the async loader series — LIVE-28411).
 * Callers should already `await` this call so that no further changes are
 * needed once the function signature is updated.
 */
export const loadWalletApiAdapterForFamily = (
  family: string,
): WalletApiAdapterModule | undefined => loaders.get(family)?.loadWalletApiAdapter?.();

/**
 * Loads the platform adapter module for the given coin family.
 *
 * @remarks
 * This function is currently synchronous but will become `async` in a future
 * migration step (part of the async loader series — LIVE-28411).
 * Callers should already `await` this call so that no further changes are
 * needed once the function signature is updated.
 */
export const loadPlatformAdapterForFamily = (
  family: string,
): PlatformAdapterModule | undefined => loaders.get(family)?.loadPlatformAdapter?.();

export const loadAccountModuleForFamily = (family: string): AccountModule | undefined =>
  loaders.get(family)?.loadAccount?.();

export const loadMockBridgeForFamily = (family: string): MockBridgeModule | undefined =>
  loaders.get(family)?.loadMockBridge?.();

export const loadMockAccountForFamily = (family: string): MockAccountModule | undefined =>
  loaders.get(family)?.loadMockAccount?.();
