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

export const loadSetupForFamily = (family: string): FamilySetup =>
  getLoader(family).loadSetup();

export const loadTransactionForFamily = (family: string): TransactionModule =>
  getLoader(family).loadTransaction();

export const hasDeviceTxConfigForFamily = (family: string): boolean =>
  !!loaders.get(family)?.loadDeviceTxConfig;

export const loadDeviceTxConfigForFamily = (
  family: string,
): DeviceTransactionConfigFn => getLoader(family).loadDeviceTxConfig!();

export const loadWalletApiAdapterForFamily = (
  family: string,
): WalletApiAdapterModule => getLoader(family).loadWalletApiAdapter!();

export const loadPlatformAdapterForFamily = (
  family: string,
): PlatformAdapterModule => getLoader(family).loadPlatformAdapter!();

export const loadAccountModuleForFamily = (family: string): AccountModule =>
  getLoader(family).loadAccount!();

export const loadMockBridgeForFamily = (family: string): MockBridgeModule | undefined => {
  const loader = loaders.get(family);
  return loader?.loadMockBridge?.();
};

export const loadMockAccountForFamily = (family: string): MockAccountModule | undefined => {
  const loader = loaders.get(family);
  return loader?.loadMockAccount?.();
};

