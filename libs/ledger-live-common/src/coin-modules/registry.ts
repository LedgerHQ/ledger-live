import { CurrencyNotSupported } from "@ledgerhq/errors";
import type {
  AccountModule,
  AlpacaSigner,
  CoinModuleLoader,
  DeviceTransactionConfigFn,
  FamilySetup,
  GetStuckAccountAndOperationFn,
  IsEditableOperationFn,
  IsStuckOperationFn,
  MockAccountModule,
  MockBridgeModule,
  PlatformAdapterModule,
  TransactionModule,
  ValidateAddressFn,
  WalletApiAdapterModule,
} from "./types";
import type { Account } from "@ledgerhq/types-live";

const loaders = new Map<string, CoinModuleLoader>();

// Dynamic imports in NodeNext/CJS mode may wrap the value under `.default` once or twice.
// At runtime (ESM), the value arrives directly or single-wrapped; this handles all cases.
function unwrapModuleDefault<T>(m: T | { default: T | { default: T } }): T {
  if (typeof m !== "object" || m === null || !("default" in (m as object))) return m as T;
  const inner = (m as { default: T | { default: T } }).default;
  if (typeof inner !== "object" || inner === null || !("default" in (inner as object))) {
    return inner as T;
  }
  return (inner as { default: T }).default;
}

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

export const loadDeviceTxConfigForFamily = async (
  family: string,
): Promise<DeviceTransactionConfigFn | undefined> => {
  const m = await loaders.get(family)?.loadDeviceTxConfig?.();
  return m !== undefined ? unwrapModuleDefault(m) : undefined;
};

export const loadWalletApiAdapterForFamily = async (
  family: string,
): Promise<WalletApiAdapterModule | undefined> => {
  const m = await loaders.get(family)?.loadWalletApiAdapter?.();
  return m !== undefined ? unwrapModuleDefault(m) : undefined;
};

export const loadPlatformAdapterForFamily = async (
  family: string,
): Promise<PlatformAdapterModule | undefined> => {
  const m = await loaders.get(family)?.loadPlatformAdapter?.();
  return m !== undefined ? unwrapModuleDefault(m) : undefined;
};

export const loadAccountModuleForFamily = async (
  family: string,
): Promise<AccountModule | undefined> => {
  const m = await loaders.get(family)?.loadAccount?.();
  return m !== undefined ? unwrapModuleDefault(m) : undefined;
};

export const loadMockBridgeForFamily = (family: string): MockBridgeModule | undefined =>
  loaders.get(family)?.loadMockBridge?.();

export const loadMockAccountForFamily = (family: string): MockAccountModule | undefined =>
  loaders.get(family)?.loadMockAccount?.();

export const loadIsAccountEmptyForFamily = (
  family: string,
): ((account: Account) => boolean) | undefined => loaders.get(family)?.loadIsAccountEmpty?.();

export const loadGetVotesCountForFamily = (
  family: string,
): ((account: Account) => number) | undefined => loaders.get(family)?.loadGetVotesCount?.();

export const loadClearAccountForFamily = (
  family: string,
): ((account: Account) => void) | undefined => loaders.get(family)?.loadClearAccount?.();

export const loadValidateAddressForFamily = (family: string): ValidateAddressFn | undefined =>
  loaders.get(family)?.loadValidateAddress?.();

export const loadSignerForFamily = (family: string): AlpacaSigner | undefined =>
  loaders.get(family)?.loadSigner?.();

export const loadIsEditableOperationForFamily = (
  family: string,
): IsEditableOperationFn | undefined => loaders.get(family)?.loadIsEditableOperation?.();

export const loadIsStuckOperationForFamily = (
  family: string,
): IsStuckOperationFn | undefined => loaders.get(family)?.loadIsStuckOperation?.();

export const loadGetStuckAccountAndOperationForFamily = (
  family: string,
): GetStuckAccountAndOperationFn | undefined =>
  loaders.get(family)?.loadGetStuckAccountAndOperation?.();
