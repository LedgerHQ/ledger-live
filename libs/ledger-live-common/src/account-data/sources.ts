import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountBalance } from "@domain/entity-account-balance";
import { getAccountBridge } from "../bridge";
import {
  getAccountBalanceRows,
  syncAccountBalanceRows,
  type AccountRefLike,
} from "../bridge/generic-coin-framework/accountBalances";
import { getEnabledGenericCoinFrameworkFamilies } from "../bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import {
  getAccountOperationPage,
  syncAccountOperations,
  type AccountOperationsPageLike,
} from "./operations";

/**
 * The shape `@features/platform-account-data` registers.
 *
 * Declared structurally rather than imported: `libs/` must not depend on `features/`. An app passes
 * what this returns straight to `registerAccountBalanceSources`, and the compiler checks the match
 * at that call site.
 */
export type AccountBalanceSourceLike = {
  readonly id: string;
  readonly priority: number;
  supports(ref: AccountRefLike): boolean;
  getBalances(ref: AccountRefLike, signal?: AbortSignal): Promise<AccountBalance[]>;
};

/** What genuinely differs between hosts: how they reach their account store and their bridge cache. */
export type AccountBalanceSourcesConfig = {
  /**
   * The account to full-sync. `undefined` makes the full-sync source reject the read with a clear
   * error rather than syncing a lookalike.
   */
  getAccount(accountId: string): Account | undefined;
  /** The host's bridge cache — `prepareCurrency` must have run before `bridge.sync`. */
  prepareCurrency(currency: CryptoCurrency): Promise<unknown>;
  /** Tokens the user has hidden, read at call time so a settings change needs no re-registration. */
  blacklistedTokenIds?(): string[];
  /**
   * Families whose coin module can serve a balance on its own. Defaults to the wallet's own gate.
   *
   * Read rather than copied, and resolved once here: three apps each writing their own list is
   * exactly how this repo ended up with three divergent "families with the new API" lists.
   */
  granularFamilies?(): Iterable<string>;
};

export const GRANULAR_SOURCE_ID = "granular";
export const FULL_SYNC_SOURCE_ID = "full-sync";

/**
 * The two sources every wallet host registers, wired from the little that differs between them.
 *
 * This is app *glue*, not a layer concept: the sources have to be built from live-common's coin
 * layer, `features/` may not import `libs/`, and three hand-written copies of the same twenty lines
 * is what this replaces. `@features/platform-account-data` still knows nothing about any of it — it
 * receives two objects that satisfy its contract.
 */
export function createAccountBalanceSources(
  config: AccountBalanceSourcesConfig,
): AccountBalanceSourceLike[] {
  const {
    getAccount,
    prepareCurrency,
    blacklistedTokenIds = () => [],
    granularFamilies = getEnabledGenericCoinFrameworkFamilies,
  } = config;

  // Resolved once: the set is static for the life of the app, and asking on every `supports` check
  // would put a lookup on the hot path of every portfolio row.
  const granular = new Set(granularFamilies());
  // `findCryptoCurrencyById`, not `getCryptoCurrencyById`: the latter throws, which would turn an
  // unknown currency into a crash inside a `supports` check rather than a source that declines.
  const familyOf = (currencyId: string) => findCryptoCurrencyById(currencyId)?.family;

  return [
    {
      id: GRANULAR_SOURCE_ID,
      priority: 10,
      // Token refs excluded here and below: one chain call returns every asset held at an *address*,
      // so a token row arrives with its parent's read. Serving a token ref would key an account-wide
      // replacement under a token id and wipe the parent's row set.
      supports: ref => {
        const family = familyOf(ref.currencyId);
        return !ref.parentId && family !== undefined && granular.has(family);
      },
      getBalances: ref =>
        getAccountBalanceRows({
          accountId: ref.accountId,
          currencyId: ref.currencyId,
          address: ref.address,
          blacklistedTokenIds: blacklistedTokenIds(),
        }),
    },
    {
      id: FULL_SYNC_SOURCE_ID,
      priority: 0,
      supports: ref => !ref.parentId && familyOf(ref.currencyId) !== undefined,
      /**
       * Today's full sync, behind the same contract — the guarantee that this layer is never worse
       * than what it replaces.
       *
       * Deliberately *not* writing the synced account back into the host's account store:
       * `BridgeSync` owns that store, and a second writer racing it is what this whole exploration
       * exists to avoid.
       */
      getBalances: async (ref, signal) => {
        const account = getAccount(ref.accountId);
        if (!account) throw new Error(`account ${ref.accountId} is not in the store`);
        await prepareCurrency(account.currency);
        return syncAccountBalanceRows({
          account,
          bridge: await getAccountBridge(account),
          blacklistedTokenIds: blacklistedTokenIds(),
          signal,
        });
      },
    },
  ];
}

/** The shape `@features/platform-account-data` registers for history reads. */
export type AccountOperationsSourceLike = {
  readonly id: string;
  readonly priority: number;
  readonly paginated: boolean;
  supports(ref: AccountRefLike): boolean;
  getOperations(
    ref: AccountRefLike,
    query: { cursor?: string; limit?: number },
    signal?: AbortSignal,
  ): Promise<AccountOperationsPageLike>;
};

export type AccountOperationsSourcesConfig = AccountBalanceSourcesConfig & {
  /**
   * Families whose coin module may serve the **history** granularly.
   *
   * Defaults to **none**, and that is the finding rather than an oversight: `listOperations` parity
   * with a bridge sync is unproven — wallet-cli disabled the granular path for every family after
   * observing missing internal operations and unreliable pagination. A balance is one number that is
   * either right or wrong; a history is a set, and a source that silently omits from it is worse
   * than one that is slow.
   *
   * So the two data have different gates, read from different places, and a family being granular
   * for `balance` says nothing about `operations`. See
   * [LIVE-36923](https://ledgerhq.atlassian.net/browse/LIVE-36923).
   */
  granularOperationFamilies?(): Iterable<string>;
};

/**
 * The two history sources a host registers.
 *
 * Same selection rule, same priorities, a separate list. What changes is `paginated`: the granular
 * source resumes from a cursor, the full-sync one cannot, and the layer has to know which it is
 * talking to before it hands a cursor over.
 */
export function createAccountOperationsSources(
  config: AccountOperationsSourcesConfig,
): AccountOperationsSourceLike[] {
  const {
    getAccount,
    prepareCurrency,
    blacklistedTokenIds = () => [],
    granularOperationFamilies = () => [],
  } = config;

  const granular = new Set(granularOperationFamilies());
  const familyOf = (currencyId: string) => findCryptoCurrencyById(currencyId)?.family;

  return [
    {
      id: GRANULAR_SOURCE_ID,
      priority: 10,
      paginated: true,
      supports: ref => {
        const family = familyOf(ref.currencyId);
        return !ref.parentId && family !== undefined && granular.has(family);
      },
      getOperations: (ref, query) =>
        getAccountOperationPage({
          accountId: ref.accountId,
          currencyId: ref.currencyId,
          address: ref.address,
          cursor: query.cursor,
          limit: query.limit,
        }),
    },
    {
      id: FULL_SYNC_SOURCE_ID,
      priority: 0,
      // The asymmetry the balance slice never surfaced: a bridge sync returns the whole history or
      // nothing, so there is no page to resume. "Load more" on a legacy family is not slow — it does
      // not exist, because the first read already returned everything.
      paginated: false,
      supports: ref => !ref.parentId && familyOf(ref.currencyId) !== undefined,
      getOperations: async (ref, _query, signal) => {
        const account = getAccount(ref.accountId);
        if (!account) throw new Error(`account ${ref.accountId} is not in the store`);
        await prepareCurrency(account.currency);
        return syncAccountOperations({
          account,
          bridge: await getAccountBridge(account),
          blacklistedTokenIds: blacklistedTokenIds(),
          signal,
        });
      },
    },
  ];
}
