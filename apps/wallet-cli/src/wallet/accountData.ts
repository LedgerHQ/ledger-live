// The CLI's composition root for the account-data layer.
//
// No React, no Redux store: `readAccountBalances` is a plain function, so the CLI calls it directly
// and never needs a store, a provider or a thunk.

import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBalance } from "@domain/entity-account-balance";
import type { AccountOperation } from "@domain/entity-account-operations";
import {
  readAccountBalances,
  readAccountOperations,
  type AccountBalanceSource,
  type AccountOperationsSource,
  type AccountRef,
} from "@features/platform-account-data";
import { AccountIdSchema } from "@shared/schema-primitives";
import type { AccountDescriptor } from "./models";

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

/**
 * The two compatibility adapters, as loaders.
 *
 * Injected rather than imported inside the sources so a test can substitute them without
 * `mock.module`: the command tests run the CLI **in process** (`src/test/helpers/cli-runner.ts`), and
 * a module mock on a shared module bleeds across test files.
 */
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

/** The sources this CLI can read a balance from, in the same shape the wallet apps register. */
export function accountBalanceSources(
  descriptor: AccountDescriptor,
  adapters: AccountDataAdapters = defaultAdapters,
): AccountBalanceSource[] {
  // `findCryptoCurrencyById`, not `getCryptoCurrencyById`: the latter throws, which would turn an
  // unknown currency into a crash inside a `supports` check rather than a source that declines.
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

/**
 * Read every balance of one account: its own first, then its token accounts.
 *
 * A CLI process serves a single request, so there is nothing to cache and nothing to keep warm —
 * hence no store and no freshness check, just the read.
 */
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

/**
 * The history sources this CLI can read from.
 *
 * Only the full sync, and that is not an omission. `listOperations` was disabled here for **every**
 * family after observing missing internal operations and unreliable pagination — the parity question
 * [LIVE-36923](https://ledgerhq.atlassian.net/browse/LIVE-36923) exists to answer. Routing the
 * command through the layer while keeping the source list at one entry is the point: the shape is
 * proven, the behaviour is unchanged, and a parity run is a second entry in this array.
 */
export function accountOperationsSources(
  descriptor: AccountDescriptor,
  adapters: AccountDataAdapters = defaultAdapters,
): AccountOperationsSource[] {
  const family = findCryptoCurrencyById(descriptor.currencyId)?.family;

  return [
    {
      id: "full-sync",
      priority: 0,
      // A bridge sync returns the whole history or nothing: there is no page to resume.
      paginated: false,
      supports: () => family !== undefined,
      getOperations: async () => {
        const operations = await (await adapters.loadBridge()).getOperationRows(descriptor);
        return { operations, complete: true, total: operations.length };
      },
    },
  ];
}

/** One account's history, newest first. A CLI process serves a single request — no cache, no cursor. */
export async function readDescriptorOperations(
  descriptor: AccountDescriptor,
  adapters?: AccountDataAdapters,
): Promise<AccountOperation[]> {
  const { operations } = await readAccountOperations(
    accountRefOf(descriptor),
    accountOperationsSources(descriptor, adapters),
  );
  return [...operations].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
}
