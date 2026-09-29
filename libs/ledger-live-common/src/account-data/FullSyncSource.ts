import type { Account } from "@ledgerhq/types-live";
import type { AccountDataSource } from "@domain/api-account-data-source";
import type { AccountRef } from "@domain/entity-account";
import type { AccountBalance } from "@domain/entity-account-balance";
import type {
  AccountOperationsPage,
  AccountOperationsQuery,
} from "@domain/entity-account-operations";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "../bridge";
import { toAccountBalances } from "../legacy-mapping/accountBalance";
import { toAccountOperations } from "../legacy-mapping/accountOperation";
import { syncAccountOnce } from "./fullSync";

export type FullSyncHost = {
  getAccount(accountId: string): Account | undefined;
  prepareCurrency(currency: Account["currency"]): Promise<unknown>;
  blacklistedTokenIds?(): string[];
};

/**
 * Every datum from one `AccountBridge.sync()`: the legacy path, for families no cheaper source
 * serves. Balance and operations read concurrently share one sync through `syncAccountOnce`.
 */
export class FullSyncSource implements AccountDataSource {
  readonly id = "full-sync";

  constructor(private readonly host: FullSyncHost) {}

  supports(ref: AccountRef): boolean {
    return (
      findCryptoCurrencyById(ref.currencyId) !== undefined &&
      this.host.getAccount(ref.accountId) !== undefined
    );
  }

  async balance(
    ref: AccountRef,
    _query: undefined,
    signal?: AbortSignal,
  ): Promise<AccountBalance[]> {
    return toAccountBalances(await this.sync(ref, signal));
  }

  async operations(
    ref: AccountRef,
    _query: AccountOperationsQuery | undefined,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage> {
    // A sync has no page: it answers with the whole history, so nothing is left below it.
    const operations = toAccountOperations(await this.sync(ref, signal));
    return { operations, complete: true, total: operations.length };
  }

  private async sync(ref: AccountRef, signal?: AbortSignal): Promise<Account> {
    if (signal?.aborted) throw new DOMException("aborted before the sync started", "AbortError");
    const account = this.host.getAccount(ref.accountId);
    if (!account) throw new Error(`account ${ref.accountId} is not in the store`);
    await this.host.prepareCurrency(account.currency);
    return syncAccountOnce({
      account,
      bridge: await getAccountBridge(account),
      blacklistedTokenIds: this.host.blacklistedTokenIds?.() ?? [],
      signal,
    });
  }
}
