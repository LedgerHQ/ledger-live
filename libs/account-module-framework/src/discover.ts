import type { Context } from "@ledgerhq/coin-module-framework/config";
import { accountDerivationPath } from "./accountId";
import { createMemoryHistoryStore, readHistory } from "./history";
import { drain } from "./read";
import { createMemoryStateStore } from "./state";
import type {
  AccountData,
  AccountDescriptor,
  AccountModuleApi,
  AccountTypes,
  HistoryStore,
  JsonValue,
  StateStore,
} from "./types";

export type DiscoveredAccount<T extends AccountTypes = AccountTypes> = AccountData<T["state"]> & {
  /** No operation and no balance: the scan stops at the first empty account. */
  empty: boolean;
};

export type DiscoveryRequest<State extends JsonValue = JsonValue> = {
  currencyId: string;
  derivationMode: string;
  /** Root of the account paths, e.g. "84'/0'". */
  derivationScheme: string;
  /** The account key read on the device for an account path (xpub, or address). */
  getAccountKey: (derivationPath: string) => Promise<string>;
  /** Where the history of a discovered account goes; in memory by default. */
  createHistory?: (descriptor: AccountDescriptor) => HistoryStore;
  /** Where the state of a discovered account goes; in memory by default. */
  createState?: (descriptor: AccountDescriptor) => StateStore<State>;
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
    createState = () => createMemoryStateStore(),
    startIndex = 0,
    maxAccounts = Number.POSITIVE_INFINITY,
    signal,
  }: DiscoveryRequest<T["state"]>,
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
    const account: AccountData<T["state"]> = {
      descriptor,
      state: createState(descriptor),
      history: createHistory(descriptor),
    };
    await drain(module.sync(context, account, signal ? { signal } : {}));
    const [operations, balances] = await Promise.all([
      readHistory(account.history),
      module.getBalances(context, account),
    ]);
    const empty = operations.length === 0 && balances.value.every(balance => balance.value === 0n);
    yield { ...account, empty };
    if (empty) return;
  }
}
