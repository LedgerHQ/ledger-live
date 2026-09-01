import { NEVER, fromEvent, lastValueFrom, race, throwError, type Observable } from "rxjs";
import { mergeMap, reduce } from "rxjs/operators";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { toAccountBalances, type AccountBalance } from "@domain/entity-account-balance";
import {
  decodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { AccountIdSchema, type AccountId } from "@shared/schema-primitives";
import { getCoinModuleApi } from "./api/index";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";

/**
 * One asset held at an account's address.
 *
 * Keyed by account id rather than by asset: the encoding of a token account id belongs to the
 * account layer, so callers never have to learn it. Structurally identical to
 * `AssetBalanceRow` in `@features/platform-account-data`, which this feeds — declared here rather
 * than imported, because `libs/` must not depend on `features/`.
 */
export type AssetBalanceRow = {
  accountId: AccountId;
  assetId:
    | ReturnType<typeof CryptoCurrencyIdSchema.parse>
    | ReturnType<typeof TokenCurrencyIdSchema.parse>;
  /** Total held, decimal-encoded, in the asset's smallest unit. */
  value: string;
  /** Non-spendable part of `value` — minimum balance, rent reserve, locked stake. */
  locked?: string;
  /** Set for a token account; absent for the account's native balance. */
  parentId?: AccountId;
};

/**
 * Read **every** asset balance an address holds — native and tokens — in one `getBalance` call.
 *
 * This is the granular half of `genericGetAccountShape`, on its own and stopping there: no
 * `lastBlock`, no `listOperations`, no balance-history derivation, no `Account` assembled. It is what
 * lets a caller that only needs a balance pay for only a balance.
 *
 * Family-agnostic by construction: the coin module comes from the registry
 * (`getCoinModuleApi` → `loadLocalApiForFamily`), so a family gains a granular balance read by
 * implementing `CoinModuleApi` — no change here. Callers decide *whether* to use it; that policy
 * lives in the wallet (see `@features/platform-account-data`'s capability declaration), not in this
 * function.
 *
 * @param kind `"local"` for the in-process coin module, anything else for the coin-service backend.
 */
export async function getAccountBalanceRows({
  accountId,
  currencyId,
  address,
  kind = "local",
  blacklistedTokenIds = [],
}: {
  accountId: string;
  currencyId: string;
  address: string;
  kind?: string;
  /**
   * Tokens the user has hidden. Filtered here so this path agrees with the legacy one, whose
   * `buildSubAccounts` already drops them — otherwise a hidden token would reappear as soon as a
   * granular read replaced the account's row set.
   */
  blacklistedTokenIds?: readonly string[];
}): Promise<AssetBalanceRow[]> {
  const currency = getCryptoCurrencyById(currencyId);
  const parentId = AccountIdSchema.parse(accountId);
  const [api, bridgeApi] = await Promise.all([
    getCoinModuleApi(currency.id, kind),
    getBridgeApi(currency, currency.family),
  ]);

  const balances = await api.getBalance(
    buildContext(currency.id),
    address,
    bridgeApi.balanceOptions,
  );

  const rows: AssetBalanceRow[] = [];
  for (const { asset, value, locked } of balances) {
    if (asset.type === "native") {
      rows.push({
        accountId: parentId,
        assetId: CryptoCurrencyIdSchema.parse(currency.id),
        value: value.toString(),
        ...(locked === undefined ? {} : { locked: locked.toString() }),
      });
      continue;
    }
    // A token asset becomes a row only once the family can name the token behind it: a token
    // account's id is derived from the token, so an unresolvable asset has nowhere to go.
    const token = await bridgeApi.getTokenFromAsset?.(asset);
    if (!token || blacklistedTokenIds.includes(token.id)) continue;
    rows.push({
      accountId: AccountIdSchema.parse(encodeTokenAccountId(accountId, token)),
      assetId: TokenCurrencyIdSchema.parse(token.id),
      value: value.toString(),
      ...(locked === undefined ? {} : { locked: locked.toString() }),
      parentId,
    });
  }
  return rows;
}

/**
 * Minimal view of an account this function needs — satisfied as-is by `Account` and `TokenAccount`
 * from `@ledgerhq/types-live`, so callers pass whatever they already hold.
 */
export type AccountForRef = {
  type: string;
  id: string;
  freshAddress?: string;
  derivationMode?: string;
  currency?: { id: string };
  token?: { parentCurrencyId: string };
};

/** The account-data layer's `AccountRef` shape, declared here so `libs/` need not import `features/`. */
export type AccountRefLike = {
  accountId: AccountId;
  currencyId: string;
  address: string;
  derivationMode: string;
  parentId?: AccountId;
};

/**
 * Build the ref the account-data layer works with from an account the app already holds.
 *
 * Identical in every host, so it lives here rather than in each composition root. A token account
 * resolves against its parent's address and currency — pass the parent, or the ref falls back to the
 * xpub encoded in the id and carries no `parentId`.
 */
export function accountRefOf(account: AccountForRef, parent?: AccountForRef): AccountRefLike {
  const main = account.type === "TokenAccount" ? parent : account;
  const { xpubOrAddress } = decodeAccountId(main?.id ?? account.id);
  const currencyId =
    account.type === "TokenAccount"
      ? (account.token?.parentCurrencyId ?? main?.currency?.id ?? "")
      : (account.currency?.id ?? "");

  return {
    accountId: AccountIdSchema.parse(account.id),
    currencyId,
    address: main?.freshAddress || xpubOrAddress,
    derivationMode: main?.derivationMode ?? "",
    ...(account.type === "TokenAccount" && parent
      ? { parentId: AccountIdSchema.parse(parent.id) }
      : {}),
  };
}

/**
 * Run a full `AccountBridge.sync()` and keep only what the balance table needs.
 *
 * The compatibility path, shared by every host so the abort semantics are right in one place:
 * `takeUntil` upstream of `reduce` would *complete* the stream, making `reduce` emit its seed — the
 * **un-synced** account — which the caller would then store as a fresh balance. Aborting has to
 * reject, so the scheduler records an error rather than stale data stamped as current.
 */
export async function syncAccountBalanceRows({
  account,
  bridge,
  blacklistedTokenIds = [],
  signal,
}: {
  account: Account;
  bridge: Pick<AccountBridge<TransactionCommon>, "sync">;
  blacklistedTokenIds?: string[];
  signal?: AbortSignal;
}): Promise<AccountBalance[]> {
  if (signal?.aborted) throw new DOMException("aborted before the sync started", "AbortError");

  const synced$ = bridge
    .sync(account, { paginationConfig: {}, blacklistedTokenIds })
    .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account));

  const aborted$: Observable<Account> = signal
    ? fromEvent(signal, "abort").pipe(
        mergeMap(() => throwError(() => new DOMException("sync aborted", "AbortError"))),
      )
    : NEVER;

  // `race` resolves on whichever settles first: the reduced account, or the abort's error.
  return toAccountBalances(await lastValueFrom(race(synced$, aborted$)));
}
