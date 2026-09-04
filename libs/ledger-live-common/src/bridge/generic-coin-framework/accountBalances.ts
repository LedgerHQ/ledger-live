import { NEVER, fromEvent, lastValueFrom, race, throwError, type Observable } from "rxjs";
import { mergeMap, reduce } from "rxjs/operators";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import {
  AccountBalanceSchema,
  AmountStrSchema,
  type AccountBalance,
} from "@domain/entity-account-balance";
import { toAccountBalances } from "../../legacy-mapping/accountBalance";
import {
  decodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { AccountIdSchema, DateTimeIsoSchema, type AccountId } from "@shared/schema-primitives";
import { getCoinModuleApi } from "./api/index";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";

/**
 * An amount reported by a coin module, projected onto the entity's encoding.
 *
 * `locked` is the non-spendable part — minimum balance, rent reserve, locked stake — so the
 * subtraction that produces `spendableBalance` happens here, once, next to the module that reported
 * both numbers. Clamped at zero: a module over-reporting `locked` must not produce a negative
 * balance, which the entity schema rejects outright.
 */
const toBalanceRow = ({
  accountId,
  assetId,
  value,
  locked,
  parentId,
  at,
}: {
  accountId: AccountId;
  assetId: AccountBalance["assetId"];
  value: bigint;
  locked: bigint | undefined;
  parentId?: AccountId;
  at: string;
}): AccountBalance => {
  const balance = AmountStrSchema.parse(value.toString());
  const spendable = locked === undefined ? value : value - locked;
  return AccountBalanceSchema.parse({
    accountId,
    assetId,
    balance,
    spendableBalance: AmountStrSchema.parse((spendable < 0n ? 0n : spendable).toString()),
    ...(parentId ? { parentId } : {}),
    at: DateTimeIsoSchema.parse(at),
  });
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
}): Promise<AccountBalance[]> {
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

  const native = balances.filter(balance => balance.asset.type === "native");
  const tokens = balances.filter(balance => balance.asset.type !== "native");

  const blacklisted = new Set(blacklistedTokenIds);
  const at = new Date().toISOString();
  // Resolved in parallel, as `buildSubAccounts` already does: awaiting one token at a time turns an
  // account holding a dozen assets into a dozen sequential CAL lookups.
  const tokenRows = await Promise.all(
    tokens.map(async ({ asset, value, locked }): Promise<AccountBalance | null> => {
      // A token asset becomes a row only once the family can name the token behind it: a token
      // account's id is derived from the token, so an unresolvable asset has nowhere to go.
      const token = await bridgeApi.getTokenFromAsset?.(asset);
      if (!token || blacklisted.has(token.id)) return null;
      return toBalanceRow({
        accountId: AccountIdSchema.parse(encodeTokenAccountId(accountId, token)),
        assetId: TokenCurrencyIdSchema.parse(token.id),
        value,
        locked,
        parentId,
        at,
      });
    }),
  );

  return [
    ...native.map(({ value, locked }) =>
      toBalanceRow({
        accountId: parentId,
        assetId: CryptoCurrencyIdSchema.parse(currency.id),
        value,
        locked,
        at,
      }),
    ),
    ...tokenRows.filter((row): row is AccountBalance => row !== null),
  ];
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
  parentId?: string;
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
 * resolves against its parent: pass the parent object for its fresh address and derivation mode, or
 * the ref falls back to the xpub encoded in the parent id. Either way the ref carries `parentId`,
 * which is what tells a source this is a token account.
 */
export function accountRefOf(account: AccountForRef, parent?: AccountForRef): AccountRefLike {
  const main = account.type === "TokenAccount" ? parent : account;
  const tokenParentId =
    account.type === "TokenAccount" ? (parent?.id ?? account.parentId) : undefined;
  // A token account id carries a `+token` suffix that `decodeAccountId` rejects, so fall back to the
  // parent's id rather than the account's own when no parent object was passed.
  const { xpubOrAddress } = decodeAccountId(main?.id ?? tokenParentId ?? account.id);
  const currencyId =
    account.type === "TokenAccount"
      ? (account.token?.parentCurrencyId ?? main?.currency?.id ?? "")
      : (account.currency?.id ?? "");

  return {
    accountId: AccountIdSchema.parse(account.id),
    currencyId,
    address: main?.freshAddress || xpubOrAddress,
    derivationMode: main?.derivationMode ?? "",
    // Always set for a token account, from the account itself when no parent was passed. A token ref
    // without it would look like a main-account ref, and the sources gate on `parentId` — so it
    // would key an account-wide balance replacement under a token id.
    ...(tokenParentId === undefined ? {} : { parentId: AccountIdSchema.parse(tokenParentId) }),
  };
}

/**
 * Run a full `AccountBridge.sync()` and keep only what the balance table needs.
 *
 * The compatibility path, shared by every host so the abort semantics are right in one place:
 * `takeUntil` upstream of `reduce` would *complete* the stream, making `reduce` emit its seed — the
 * **un-synced** account — which the caller would then store as a fresh balance. Aborting has to
 * reject, so the caller records an error rather than stale data stamped as current.
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
