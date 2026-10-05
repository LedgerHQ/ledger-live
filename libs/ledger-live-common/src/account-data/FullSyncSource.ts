import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { AccountDataSource } from "@domain/api-account-data-source";
import {
  AccountIdSchema,
  TokenAccountIdSchema,
  parseAnyAccountId,
  type AccountRef,
} from "@domain/entity-account";
import { AmountStrSchema, type AccountBalance } from "@domain/entity-account-balance";
import {
  AccountOperationSchema,
  OperationAmountSchema,
  compareAccountOperations,
  type AccountOperation,
  type AccountOperationsPage,
  type AccountOperationsQuery,
} from "@domain/entity-account-operations";
import { CryptoCurrencyIdSchema, findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { getAccountBridge } from "../bridge";

export type FullSyncHost = {
  getAccount(accountId: string): Account | undefined;
  prepareCurrency(currency: Account["currency"]): Promise<unknown>;
  blacklistedTokenIds?(): string[];
  /** The most syncs at once when many accounts are read together, as the background sync allows. */
  concurrency?: number;
};

const abortError = (message: string) => new DOMException(message, "AbortError");

/**
 * Every datum from one `AccountBridge.sync()`: the legacy path, for families no cheaper source
 * serves. One run per account while in flight, so a balance and an operations read of the same
 * account share it. A caller's signal stops that caller waiting; it does not cancel the shared run.
 */
export class FullSyncSource implements AccountDataSource {
  readonly id = "full-sync";
  readonly concurrency?: number;
  private readonly inflight = new Map<string, Promise<Account>>();

  constructor(private readonly host: FullSyncHost) {
    this.concurrency = host.concurrency;
  }

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
    return toAccountBalances(await this.sync(ref.accountId, signal));
  }

  async operations(
    ref: AccountRef,
    _query: AccountOperationsQuery | undefined,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage> {
    // A sync has no page: it answers with the whole history, so nothing is left below it.
    const operations = toAccountOperations(await this.sync(ref.accountId, signal));
    return { operations, complete: true, total: operations.length };
  }

  private async sync(accountId: string, signal?: AbortSignal): Promise<Account> {
    if (signal?.aborted) throw abortError("aborted before the sync started");
    const shared = this.inflight.get(accountId) ?? this.start(accountId);
    if (!signal) return shared;
    let onAbort: () => void = () => undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(abortError("sync aborted"));
      signal.addEventListener("abort", onAbort, { once: true });
    });
    try {
      return await Promise.race([shared, aborted]);
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }

  private start(accountId: string): Promise<Account> {
    const run = this.run(accountId).finally(() => this.inflight.delete(accountId));
    void run.catch(() => undefined);
    this.inflight.set(accountId, run);
    return run;
  }

  private async run(accountId: string): Promise<Account> {
    const account = this.host.getAccount(accountId);
    if (!account) throw new Error(`account ${accountId} is not in the store`);
    await this.host.prepareCurrency(account.currency);
    const bridge = await getAccountBridge(account);
    return lastValueFrom(
      bridge
        .sync(account, {
          paginationConfig: {},
          blacklistedTokenIds: this.host.blacklistedTokenIds?.() ?? [],
        })
        .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account)),
    );
  }
}

// Legacy `Account` to entity rows. Here on purpose: nothing but this source maps that way, and it
// goes when the legacy account model goes.

function toTokenBalance(account: TokenAccount, at: string): AccountBalance {
  return {
    accountId: TokenAccountIdSchema.parse(account.id),
    assetId: TokenCurrencyIdSchema.parse(account.token.id),
    balance: AmountStrSchema.parse(account.balance.toFixed()),
    spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
    parentId: AccountIdSchema.parse(account.parentId),
    at: DateTimeIsoSchema.parse(at),
  };
}

function toAccountBalances(account: Account): AccountBalance[] {
  const at = new Date().toISOString();
  return [
    {
      accountId: AccountIdSchema.parse(account.id),
      assetId: CryptoCurrencyIdSchema.parse(account.currency.id),
      balance: AmountStrSchema.parse(account.balance.toFixed()),
      spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
      at: DateTimeIsoSchema.parse(at),
    },
    ...(account.subAccounts ?? []).map(subAccount => toTokenBalance(subAccount, at)),
  ];
}

function toAccountOperation(
  operation: Operation,
  assetId: string,
  parentOperationId?: string,
): AccountOperation {
  return AccountOperationSchema.parse({
    id: operation.id,
    accountId: parseAnyAccountId(operation.accountId),
    assetId,
    hash: operation.hash,
    type: operation.type,
    value: OperationAmountSchema.parse(operation.value.toFixed()),
    fee: OperationAmountSchema.parse(operation.fee.toFixed()),
    senders: operation.senders,
    recipients: operation.recipients,
    blockHeight: operation.blockHeight ?? null,
    date: DateTimeIsoSchema.parse(operation.date.toISOString()),
    ...(operation.hasFailed === undefined ? {} : { hasFailed: operation.hasFailed }),
    ...(parentOperationId === undefined ? {} : { parentOperationId }),
  });
}

/** The operation, then its sub and internal operations, each on the asset of its own account. */
function flattenOperation(
  operation: Operation,
  assetIdOf: (accountId: string) => string | undefined,
): AccountOperation[] {
  const assetId = assetIdOf(operation.accountId);
  const rows = assetId === undefined ? [] : [toAccountOperation(operation, assetId)];
  for (const child of [
    ...(operation.subOperations ?? []),
    ...(operation.internalOperations ?? []),
  ]) {
    const childAssetId = assetIdOf(child.accountId);
    if (childAssetId !== undefined)
      rows.push(toAccountOperation(child, childAssetId, operation.id));
  }
  return rows;
}

function toAccountOperations(account: Account): AccountOperation[] {
  const assetIds = new Map<string, string>([[account.id, account.currency.id]]);
  for (const subAccount of account.subAccounts ?? [])
    assetIds.set(subAccount.id, subAccount.token.id);
  const assetIdOf = (accountId: string) => assetIds.get(accountId);

  const own = account.operations.flatMap(operation => flattenOperation(operation, assetIdOf));
  const tokens = (account.subAccounts ?? []).flatMap(subAccount =>
    subAccount.operations.flatMap(operation => flattenOperation(operation, assetIdOf)),
  );
  const byId = new Map<string, AccountOperation>();
  for (const operation of [...own, ...tokens]) {
    if (!byId.has(operation.id)) byId.set(operation.id, operation);
  }
  // Sorted here: the main and token lists are each ordered, their concatenation is not.
  return [...byId.values()].sort(compareAccountOperations);
}
