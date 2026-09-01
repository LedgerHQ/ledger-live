import { NEVER, fromEvent, lastValueFrom, reduce, takeUntil } from "rxjs";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountBalanceRows } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import { isGenericCoinFrameworkFamily } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import {
  accountBalanceSelector,
  subAccountBalancesSelector,
  toAccountBalances,
  type AccountBalance,
} from "@domain/entity-account-balance";
import {
  createAccountDataScheduler,
  createAccountDataSourceRegistry,
  createCoinModuleApiSource,
  createLegacyBridgeSource,
  type AccountRef,
  type AccountSlice,
  type AssetBalanceRow,
} from "@features/platform-account-data";
import { AccountIdSchema } from "@shared/schema-primitives";
import { store } from "../store";
import { bridgeCache, inferAccount } from "./syncAccount";

const BALANCE_ONLY: ReadonlySet<AccountSlice> = new Set<AccountSlice>(["balance"]);
const NOTHING: ReadonlySet<AccountSlice> = new Set();

/**
 * Accounts a page has already shaped — from a Ledger Sync descriptor, say.
 *
 * The legacy fallback needs a real `Account` to sync, and `inferAccount` can only guess one from an
 * id (index 0, derived fresh address). When a caller already holds the properly shaped account, it
 * hands it over here so the fallback syncs the right derivation path rather than a lookalike.
 */
const shapedAccounts = new Map<string, Account>();

export function rememberShapedAccount(account: Account): void {
  shapedAccounts.set(account.id, account);
}

/** Build the ref the account-data layer works with from an account this app already holds. */
export function accountRefOf(account: AccountLike, parent?: Account): AccountRef {
  const main = account.type === "TokenAccount" ? parent : (account as Account);
  const { xpubOrAddress } = decodeAccountId(main?.id ?? account.id);
  return {
    accountId: AccountIdSchema.parse(account.id),
    currencyId:
      account.type === "TokenAccount"
        ? account.token.parentCurrencyId
        : (account as Account).currency.id,
    address: main?.freshAddress || xpubOrAddress,
    derivationMode: main?.derivationMode ?? "",
    ...(account.type === "TokenAccount" && parent
      ? { parentId: AccountIdSchema.parse(parent.id) }
      : {}),
  };
}

/** The balance rows currently in the store for an account: its own first, then its token accounts. */
export function accountBalanceRowsOf(accountId: string): AccountBalance[] {
  const state = store.getState();
  const id = AccountIdSchema.parse(accountId);
  const own = accountBalanceSelector(state, { accountId: id });
  const subs = subAccountBalancesSelector(state, { accountId: id });
  return own ? [own, ...subs] : [...subs];
}

/**
 * The granular half of the hybrid: one `getBalance` call straight to the chain.
 *
 * `isGenericCoinFrameworkFamily` is the wallet-side list this architecture is meant to delete. It
 * stays here, in one place behind the port, so replacing it with a capability the coin module
 * declares itself is a change to this function and nothing else.
 */
function coinModuleApiPort() {
  return {
    capabilities: (ref: AccountRef): ReadonlySet<AccountSlice> => {
      const currency = findCryptoCurrencyById(ref.currencyId);
      if (!currency || !isGenericCoinFrameworkFamily(currency.family)) return NOTHING;
      return BALANCE_ONLY;
    },

    getBalances: (ref: AccountRef): Promise<AssetBalanceRow[]> =>
      getAccountBalanceRows({
        accountId: ref.accountId,
        currencyId: ref.currencyId,
        address: ref.address,
      }),
  };
}

/** The compatibility half: today's full `AccountBridge.sync()`, projected onto balance rows. */
function legacyBridgePort() {
  return {
    supports: (ref: AccountRef) => findCryptoCurrencyById(ref.currencyId) !== undefined,

    sync: async (ref: AccountRef, signal?: AbortSignal) => {
      const account = shapedAccounts.get(ref.accountId) ?? inferAccount(ref.accountId);
      const bridge = await getAccountBridge(account);
      await bridgeCache.prepareCurrency(account.currency);
      const synced = await lastValueFrom(
        bridge.sync(account, { paginationConfig: {}, blacklistedTokenIds: [] }).pipe(
          takeUntil(signal ? fromEvent(signal, "abort") : NEVER),
          reduce<(account: Account) => Account, Account>((acc, updater) => updater(acc), account),
        ),
      );
      return { balances: toAccountBalances(synced) };
    },
  };
}

/**
 * The app-wide scheduler. Created at module scope because this app's store is too.
 *
 * Registering both sources is what makes the routing observable in the devtool: a family with a
 * granular coin module gets its balance from one chain call, and every other family falls back to
 * the full sync it needs anyway — with `sourceId` on the status telling you which one answered.
 */
export const accountDataScheduler = createAccountDataScheduler({
  registry: createAccountDataSourceRegistry([
    createCoinModuleApiSource(coinModuleApiPort()),
    createLegacyBridgeSource(legacyBridgePort()),
  ]),
  dispatch: store.dispatch,
  onError: (error, { ref, reason }) =>
    console.warn(`account-data: ${ref.accountId} (${reason})`, error),
});
