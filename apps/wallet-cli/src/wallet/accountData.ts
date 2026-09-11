import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBalance } from "@domain/entity-account-balance";
import { compareAccountOperations, type AccountOperation } from "@domain/entity-account-operations";
import {
  readAccountBalances,
  readAccountOperations,
  type AccountBalanceSource,
  type AccountOperationsSource,
  type AccountRef,
} from "@features/platform-account-data";
import { AccountIdSchema } from "@domain/entity-account";
import type { AccountDescriptor } from "./models";

const GRANULAR_FAMILIES: ReadonlySet<string> = new Set(["evm"]);

export function accountRefOf(descriptor: AccountDescriptor): AccountRef {
  const { xpubOrAddress } = decodeAccountId(descriptor.id);
  return {
    accountId: AccountIdSchema.parse(descriptor.id),
    currencyId: descriptor.currencyId,
    address: descriptor.freshAddress || xpubOrAddress,
    derivationMode: descriptor.derivationMode,
  };
}

function lazy<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () =>
    (pending ??= load().catch(error => {
      pending = null;
      throw error;
    }));
}

const loadCoinFramework = lazy(() =>
  import("./compatibility/coinframework").then(
    ({ CoinFrameworkAdapter }) => new CoinFrameworkAdapter(),
  ),
);
const loadBridge = lazy(() =>
  import("./compatibility/bridge").then(({ BridgeAdapter }) => new BridgeAdapter()),
);

export type AccountDataAdapters = {
  loadCoinFramework: () => Promise<{
    getBalanceRows: (descriptor: AccountDescriptor) => Promise<AccountBalance[]>;
  }>;
  loadBridge: () => Promise<{
    getBalanceRows: (descriptor: AccountDescriptor) => Promise<AccountBalance[]>;
    getOperationRows: (descriptor: AccountDescriptor) => Promise<AccountOperation[]>;
  }>;
};

const defaultAdapters: AccountDataAdapters = { loadCoinFramework, loadBridge };

export function accountBalanceSources(
  descriptor: AccountDescriptor,
  adapters: AccountDataAdapters = defaultAdapters,
): AccountBalanceSource[] {
  const family = findCryptoCurrencyById(descriptor.currencyId)?.family;

  return [
    {
      id: "granular",
      priority: 10,
      supports: () => family !== undefined && GRANULAR_FAMILIES.has(family),
      getBalances: async () => (await adapters.loadCoinFramework()).getBalanceRows(descriptor),
    },
    {
      id: "full-sync",
      priority: 0,
      supports: () => family !== undefined,
      getBalances: async () => (await adapters.loadBridge()).getBalanceRows(descriptor),
    },
  ];
}

export async function readDescriptorBalances(
  descriptor: AccountDescriptor,
  adapters?: AccountDataAdapters,
): Promise<AccountBalance[]> {
  const ref = accountRefOf(descriptor);
  const { balances } = await readAccountBalances(ref, accountBalanceSources(descriptor, adapters));
  const own = balances.filter(row => row.accountId === ref.accountId);
  const subs = balances.filter(row => row.parentId === ref.accountId);
  return [...own, ...subs];
}

export function accountOperationsSources(
  descriptor: AccountDescriptor,
  adapters: AccountDataAdapters = defaultAdapters,
): AccountOperationsSource[] {
  const family = findCryptoCurrencyById(descriptor.currencyId)?.family;

  return [
    {
      id: "full-sync",
      priority: 0,
      paginated: false,
      supports: () => family !== undefined,
      getOperations: async () => {
        const operations = await (await adapters.loadBridge()).getOperationRows(descriptor);
        return { operations, complete: true, total: operations.length };
      },
    },
  ];
}

export async function readDescriptorOperations(
  descriptor: AccountDescriptor,
  adapters?: AccountDataAdapters,
): Promise<AccountOperation[]> {
  const { operations } = await readAccountOperations(
    accountRefOf(descriptor),
    accountOperationsSources(descriptor, adapters),
  );
  return [...operations].sort(compareAccountOperations);
}
