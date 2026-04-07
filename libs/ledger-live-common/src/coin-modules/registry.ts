import { CurrencyNotSupported } from "@ledgerhq/errors";
import { setSupportedCurrencies } from "@ledgerhq/ledger-wallet-framework/currencies/support";
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
  // Bridge to ledger-wallet-framework: keep isCurrencySupported() in sync with registered families
  // TODO: in future, we will have to drop libs/ledger-wallet-framework/src/currencies/support.ts, the supported state can be infered by what's available in the registry.
  setSupportedCurrencies([...loaders.values()].flatMap(m => m.currencyIds));
}

export function getRegisteredFamilies(): string[] {
  return [...loaders.keys()];
}

export const loadSetupForFamily = async (family: string): Promise<FamilySetup> =>
  getLoader(family).loadSetup();

export const loadTransactionForFamily = async (family: string): Promise<TransactionModule> =>
  getLoader(family).loadTransaction();

export const loadDeviceTxConfigForFamily = async (
  family: string,
): Promise<DeviceTransactionConfigFn | undefined> => loaders.get(family)?.loadDeviceTxConfig?.();

export const loadWalletApiAdapterForFamily = async (
  family: string,
): Promise<WalletApiAdapterModule | undefined> => loaders.get(family)?.loadWalletApiAdapter?.();

export const loadPlatformAdapterForFamily = async (
  family: string,
): Promise<PlatformAdapterModule | undefined> => loaders.get(family)?.loadPlatformAdapter?.();

export const loadAccountModuleForFamily = async (
  family: string,
): Promise<AccountModule | undefined> => loaders.get(family)?.loadAccount?.();

export const loadMockBridgeForFamily = async (
  family: string,
): Promise<MockBridgeModule | undefined> => loaders.get(family)?.loadMockBridge?.();

export const loadMockAccountForFamily = async (
  family: string,
): Promise<MockAccountModule | undefined> => loaders.get(family)?.loadMockAccount?.();
