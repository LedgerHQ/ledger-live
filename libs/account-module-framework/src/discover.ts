import type { Context } from "@ledgerhq/coin-module-framework/config";
import { accountDerivationPath } from "./accountId";
import { createMemoryHistoryStore, readHistory } from "./history";
import type {
  AccountDescriptor,
  AccountModuleApi,
  AccountTypes,
  HistoryStore,
  Versioned,
} from "./types";

export type DiscoveredAccount<T extends AccountTypes = AccountTypes> = {
  descriptor: AccountDescriptor;
  state: Versioned<T["state"]> | undefined;
  history: HistoryStore;
  /** No operation and no balance: the scan stops at the first empty account. */
  empty: boolean;
};

export type DiscoveryRequest = {
  currencyId: string;
  derivationMode: string;
  /** Root of the account paths, e.g. "84'/0'". */
  derivationScheme: string;
  /** The account key read on the device for an account path (xpub, or address). */
  getAccountKey: (derivationPath: string) => Promise<string>;
  /** Where the history of a discovered account goes; in memory by default. */
  createHistory?: (descriptor: AccountDescriptor) => HistoryStore;
  startIndex?: number;
  maxAccounts?: number;
  signal?: AbortSignal;
};

/**
 * Discovers the accounts of a device for one derivation mode: account index after account index,
 * each one synced, up to and including the first empty one. Which empty account to show is the
 * client's policy.
 */
export async function* discoverAccounts<T extends AccountTypes>(
  module: AccountModuleApi<T>,
  context: Context<any>,
  {
    currencyId,
    derivationMode,
    derivationScheme,
    getAccountKey,
    createHistory = () => createMemoryHistoryStore(),
    startIndex = 0,
    maxAccounts = Number.POSITIVE_INFINITY,
    signal,
  }: DiscoveryRequest,
): AsyncIterable<DiscoveredAccount<T>> {
  for (let index = startIndex; index - startIndex < maxAccounts; index++) {
    signal?.throwIfAborted();
    const derivationPath = accountDerivationPath(derivationScheme, index);
    const descriptor: AccountDescriptor = {
      currencyId,
      derivationMode,
      index,
      key: await getAccountKey(derivationPath),
      derivationPath,
    };
    const history = createHistory(descriptor);
    let state: Versioned<T["state"]> | undefined;
    const options = signal ? { signal } : {};
    for await (const event of module.sync(context, { descriptor, state, history }, options)) {
      state = event.state;
    }
    const account = { descriptor, state, history };
    const [operations, balances] = await Promise.all([
      readHistory(history),
      module.getBalances(context, account),
    ]);
    const empty = operations.length === 0 && balances.every(balance => balance.value === 0n);
    yield { descriptor, state, history, empty };
    if (empty) return;
  }
}
