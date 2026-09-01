// The CLI's composition root for the account-data layer.
//
// No React, no Redux store: the layer's core is framework-free, so the entity reducer is driven
// directly over a local variable and the scheduler is used through its imperative `fetch`.

import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import {
  accountBalancesSlice,
  initialAccountBalancesState,
  type AccountBalance,
  type AccountBalancesState,
} from "@domain/entity-account-balance";
import {
  createAccountDataScheduler,
  createAccountDataSourceRegistry,
  createDefaultAccountDataSources,
  type AccountDataHost,
  type AccountDataScheduler,
  type AccountRef,
  type AssetBalanceRow,
} from "@features/platform-account-data";
import { AccountIdSchema } from "@shared/schema-primitives";
import type { AccountDescriptor } from "./models";
import { walletCliDebug } from "../shared/log";

/**
 * Families this CLI reads granularly.
 *
 * A deliberate **narrowing** of the wallet's own gate, which enables six families
 * (`getEnabledGenericCoinFrameworkFamilies`). Kept at `evm` because that is the only one this CLI's
 * `balances` output has been validated against: the adapter it replaced was hardcoded to
 * `createLocalEvmApi`, so no other family ever took this path here.
 *
 * Widening is a one-line change plus a `balances` before/after per family — the difference to watch
 * is token resolution (`getTokenFromAsset` vs the sync's sub-accounts), not the native amount.
 */
const GRANULAR_FAMILIES: ReadonlySet<string> = new Set(["evm"]);

/** Build the ref the account-data layer works with from a session account descriptor. */
export function accountRefOf(descriptor: AccountDescriptor): AccountRef {
  const { xpubOrAddress } = decodeAccountId(descriptor.id);
  return {
    accountId: AccountIdSchema.parse(descriptor.id),
    currencyId: descriptor.currencyId,
    address: descriptor.freshAddress || xpubOrAddress,
    derivationMode: descriptor.derivationMode,
  };
}

/**
 * The balance table, driven by the entity reducer with no store around it.
 *
 * `accountBalancesSlice.reducer` is the whole contract — `configureStore`, middleware and
 * `react-redux` are Redux conveniences the CLI has no use for.
 */
function createBalanceTable() {
  let state: AccountBalancesState = initialAccountBalancesState;
  return {
    dispatch: (action: { type: string }) => {
      state = accountBalancesSlice.reducer(state, action);
    },
    rowsOf: (accountId: string): AccountBalance[] => {
      const id = AccountIdSchema.parse(accountId);
      const own = state[id];
      const subs = Object.values(state).filter(row => row.parentId === id);
      return own ? [own, ...subs] : subs;
    },
  };
}

// Both adapters are loaded through a memoised dynamic `import()`, as `WalletAdapter` already does:
// `live-common/bridge/index` costs ~328ms and the local EVM api ~105ms, and a `balances` run must not
// pay for the one it does not use. Rejections evict the cache so a transient failure can be retried.
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

export type AccountDataRuntime = {
  scheduler: AccountDataScheduler;
  /** Rows the scheduler wrote for this account: its own balance first, then its token accounts. */
  rowsOf: (accountId: string) => AccountBalance[];
};

/**
 * The two compatibility adapters, as loaders.
 *
 * Injected rather than imported inside the sources so a test can substitute them without
 * `mock.module`: the command tests run the CLI **in process** (`src/test/helpers/cli-runner.ts`), and
 * a module mock on a shared module bleeds across test files.
 */
export type AccountDataAdapters = {
  loadCoinFramework: () => Promise<{
    getBalanceRows: (descriptor: AccountDescriptor) => Promise<AssetBalanceRow[]>;
  }>;
  loadBridge: () => Promise<{
    getBalanceRows: (descriptor: AccountDescriptor) => Promise<AccountBalance[]>;
  }>;
};

const defaultAdapters: AccountDataAdapters = {
  loadCoinFramework,
  loadBridge,
};

/**
 * One runtime per command invocation: a CLI process serves a single request, so there is nothing to
 * share and nothing to keep warm between calls.
 */
export function createAccountDataRuntime({
  descriptorById,
  adapters = defaultAdapters,
}: {
  descriptorById: (accountId: string) => AccountDescriptor | undefined;
  adapters?: AccountDataAdapters;
}): AccountDataRuntime {
  const table = createBalanceTable();
  const descriptorFor = (accountId: string): AccountDescriptor => {
    const descriptor = descriptorById(accountId);
    if (!descriptor) throw new Error(`unknown account ${accountId}`);
    return descriptor;
  };

  const host: AccountDataHost = {
    granularFamilies: () => GRANULAR_FAMILIES,
    // `findCryptoCurrencyById`, not `getCryptoCurrencyById`: the latter throws, which would turn an
    // unknown currency into a crash inside a capability check instead of an unservable slice.
    familyOf: currencyId => findCryptoCurrencyById(currencyId)?.family,
    readAssetBalances: async ref =>
      (await adapters.loadCoinFramework()).getBalanceRows(descriptorFor(ref.accountId)),
    syncAccountBalances: async ref =>
      (await adapters.loadBridge()).getBalanceRows(descriptorFor(ref.accountId)),
  };

  const registry = createAccountDataSourceRegistry(createDefaultAccountDataSources(host));

  const scheduler = createAccountDataScheduler({
    registry,
    dispatch: table.dispatch,
    onError: (error, { ref, slice }) =>
      walletCliDebug(`account-data: ${slice} failed for ${ref.accountId}: ${String(error)}`),
  });

  return { scheduler, rowsOf: table.rowsOf };
}
