import { fromEvent, lastValueFrom, NEVER, reduce, takeUntil } from "rxjs";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountBalanceRows } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";
import { isGenericCoinFrameworkFamily } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { toAccountBalances } from "@domain/entity-account-balance";
import {
  createAccountDataScheduler,
  createAccountDataSourceRegistry,
  createCoinModuleApiSource,
  createLegacyBridgeSource,
  type AccountDataScheduler,
  type AccountRef,
  type AccountSlice,
  type AssetBalanceRow,
} from "@features/platform-account-data";
import { AccountIdSchema } from "@shared/schema-primitives";
import { mirrorLegacyAccountBalances } from "./account-balances-mirror";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { ReduxStore } from "~/state-manager/configureStore";

const BALANCE_ONLY: ReadonlySet<AccountSlice> = new Set<AccountSlice>(["balance"]);
const NOTHING: ReadonlySet<AccountSlice> = new Set();

/** Build the ref the account-data layer works with from a legacy account. */
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

/**
 * The granular half of the hybrid: one `getBalance` call straight to the chain.
 *
 * Capabilities come from `isGenericCoinFrameworkFamily`, which is the wallet-side list this
 * architecture is meant to delete. It stays here, in one place behind the port, precisely so that
 * replacing it with a capability the coin module declares itself (`loadAccountDataCapabilities`) is a
 * change to this function and nothing else.
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

/**
 * The compatibility half: today's full `AccountBridge.sync()`, projected onto balance rows.
 *
 * It reads the account out of the legacy store rather than rebuilding one, so a family that has no
 * granular API keeps behaving exactly as it does now. Deliberately *not* writing the synced account
 * back into the `accounts` reducer: `BridgeSync` owns that store, and a second writer would race it.
 * The balance table is this source's only output until the remaining slices exist.
 */
function legacyBridgePort(store: ReduxStore) {
  return {
    supports: (ref: AccountRef) => findCryptoCurrencyById(ref.currencyId) !== undefined,

    sync: async (ref: AccountRef, signal?: AbortSignal) => {
      const state = store.getState();
      // Always a main account: `createLegacyBridgeSource` refuses a token-account ref, because this
      // source projects the parent's whole balance set and a token id must never key it.
      const account = accountSelector(state, { accountId: ref.accountId });
      if (!account) throw new Error(`account ${ref.accountId} is not in the store`);

      await prepareCurrency(account.currency);
      const bridge = await getAccountBridge(account);
      // A full sync is the expensive path, so honoring the abort matters here more than anywhere:
      // `takeUntil` unsubscribes the bridge observable, which is what actually stops the requests.
      const synced = await lastValueFrom(
        bridge
          .sync(account, {
            paginationConfig: {},
            blacklistedTokenIds: blacklistedTokenIdsSelector(state),
          })
          .pipe(
            takeUntil(signal ? fromEvent(signal, "abort") : NEVER),
            reduce<(account: Account) => Account, Account>((acc, updater) => updater(acc), account),
          ),
      );
      return { balances: toAccountBalances(synced) };
    },
  };
}

let scheduler: AccountDataScheduler | null = null;

/**
 * Wire the account-data layer for this app: register both halves of the hybrid, start mirroring the
 * legacy account store, and keep the scheduler for `<AccountDataProvider>` to pick up.
 *
 * The sources are built here, not in `@features/platform-account-data`, because that layer may not
 * import `libs/` — which is also what keeps the bridge and the coin modules swappable behind the
 * port. Same shape as `setupCryptoAssetsStore`: the app composition root owns the wiring, the
 * package owns the contract.
 */
export function setupAccountData(store: ReduxStore): AccountDataScheduler {
  const registry = createAccountDataSourceRegistry([
    createCoinModuleApiSource(coinModuleApiPort()),
    createLegacyBridgeSource(legacyBridgePort(store)),
  ]);
  mirrorLegacyAccountBalances(store);
  scheduler = createAccountDataScheduler({ registry, dispatch: store.dispatch });
  return scheduler;
}

/** The scheduler `setupAccountData` built, or `null` before boot has reached it. */
export function getAccountDataScheduler(): AccountDataScheduler | null {
  return scheduler;
}
