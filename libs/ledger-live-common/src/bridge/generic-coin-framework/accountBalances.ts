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
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import {
  AccountIdSchema,
  TokenAccountIdSchema,
  type AccountId,
  type AnyAccountId,
} from "@domain/entity-account";
import { getCoinModuleApi } from "./api/index";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { extractBalance } from "./utils";

const toBalanceRow = ({
  accountId,
  assetId,
  value,
  locked,
  parentId,
  at,
}: {
  accountId: AnyAccountId;
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

  const native = extractBalance(balances, "native");
  const tokens = balances.filter(balance => balance.asset.type !== "native");

  const blacklisted = new Set(blacklistedTokenIds);
  const at = new Date().toISOString();
  const tokenRows = await Promise.all(
    tokens.map(async ({ asset, value, locked }): Promise<AccountBalance | null> => {
      const token = await bridgeApi.getTokenFromAsset?.(asset);
      if (!token || blacklisted.has(token.id)) return null;
      return toBalanceRow({
        accountId: TokenAccountIdSchema.parse(encodeTokenAccountId(accountId, token)),
        assetId: TokenCurrencyIdSchema.parse(token.id),
        value,
        locked,
        parentId,
        at,
      });
    }),
  );

  return [
    toBalanceRow({
      accountId: parentId,
      assetId: CryptoCurrencyIdSchema.parse(currency.id),
      value: native.value,
      locked: native.locked,
      at,
    }),
    ...tokenRows.filter((row): row is AccountBalance => row !== null),
  ];
}

export type AccountForRef = {
  id: string;
  freshAddress?: string;
  derivationMode?: string;
  currency: { id: string };
};

export type AccountRefLike = {
  accountId: AccountId;
  currencyId: string;
  address: string;
  derivationMode: string;
};

export function accountRefOf(account: AccountForRef): AccountRefLike {
  const { xpubOrAddress } = decodeAccountId(account.id);
  return {
    accountId: AccountIdSchema.parse(account.id),
    currencyId: account.currency.id,
    address: account.freshAddress || xpubOrAddress,
    derivationMode: account.derivationMode ?? "",
  };
}

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

  return toAccountBalances(await lastValueFrom(race(synced$, aborted$)));
}
