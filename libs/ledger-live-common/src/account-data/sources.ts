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

export type AccountBalanceSourceLike = {
  readonly id: string;
  readonly priority: number;
  supports(ref: AccountRefLike): boolean;
  getBalances(ref: AccountRefLike, signal?: AbortSignal): Promise<AccountBalance[]>;
};

export type AccountBalanceSourcesConfig = {
  getAccount(accountId: string): Account | undefined;
  prepareCurrency(currency: CryptoCurrency): Promise<unknown>;
  blacklistedTokenIds?(): string[];
  granularFamilies?(): Iterable<string>;
};

export const GRANULAR_SOURCE_ID = "granular";
export const FULL_SYNC_SOURCE_ID = "full-sync";

export function createAccountBalanceSources(
  config: AccountBalanceSourcesConfig,
): AccountBalanceSourceLike[] {
  const {
    getAccount,
    prepareCurrency,
    blacklistedTokenIds = () => [],
    granularFamilies = getEnabledGenericCoinFrameworkFamilies,
  } = config;

  const granular = new Set(granularFamilies());
  const familyOf = (currencyId: string) => findCryptoCurrencyById(currencyId)?.family;

  return [
    {
      id: GRANULAR_SOURCE_ID,
      priority: 10,
      supports: ref => {
        const family = familyOf(ref.currencyId);
        return family !== undefined && granular.has(family);
      },
      getBalances: async (ref, signal) => {
        if (signal?.aborted)
          throw new DOMException("aborted before the read started", "AbortError");
        return getAccountBalanceRows({
          accountId: ref.accountId,
          currencyId: ref.currencyId,
          address: ref.address,
          blacklistedTokenIds: blacklistedTokenIds(),
        });
      },
    },
    {
      id: FULL_SYNC_SOURCE_ID,
      priority: 0,
      supports: ref => familyOf(ref.currencyId) !== undefined,
      getBalances: async (ref, signal) => {
        if (signal?.aborted)
          throw new DOMException("aborted before the sync started", "AbortError");
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
  granularOperationFamilies?(): Iterable<string>;
};

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
        return family !== undefined && granular.has(family);
      },
      getOperations: async (ref, query, signal) => {
        if (signal?.aborted)
          throw new DOMException("aborted before the read started", "AbortError");
        return getAccountOperationPage({
          accountId: ref.accountId,
          currencyId: ref.currencyId,
          address: ref.address,
          cursor: query.cursor,
          limit: query.limit,
        });
      },
    },
    {
      id: FULL_SYNC_SOURCE_ID,
      priority: 0,
      paginated: false,
      supports: ref => familyOf(ref.currencyId) !== undefined,
      getOperations: async (ref, _query, signal) => {
        if (signal?.aborted)
          throw new DOMException("aborted before the sync started", "AbortError");
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
