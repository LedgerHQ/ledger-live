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
