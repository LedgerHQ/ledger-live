import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { AccountIdSchema, TokenAccountIdSchema, parseAnyAccountId } from "@domain/entity-account";
import { AmountStrSchema, type AccountBalance } from "@domain/entity-account-balance";
import {
  AccountOperationSchema,
  OperationAmountSchema,
  compareAccountOperations,
  type AccountOperation,
} from "@domain/entity-account-operations";
import {
  CryptoCurrencyIdSchema,
  findCryptoCurrencyById,
  type CryptoCurrency,
} from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import type { AccountDataSource } from "@features/platform-account-data";
import { getAccountBridge } from "../bridge";

export type FullSyncSourceConfig = {
  getAccount(accountId: string): Account | undefined;
  prepareCurrency(currency: CryptoCurrency): Promise<unknown>;
  blacklistedTokenIds?(): string[];
};

const abortError = () => new DOMException("aborted", "AbortError");

/** The "full sync paradigm" as a source: one `AccountBridge.sync` per account, shared while in flight. */
export class FullSyncSource implements AccountDataSource {
  readonly id = "full-sync";
  private readonly inflight = new Map<string, Promise<Account>>();

  constructor(private readonly config: FullSyncSourceConfig) {}

  supports(ref: { currencyId: string }): boolean {
    return findCryptoCurrencyById(ref.currencyId) !== undefined;
  }

  async getBalances(ref: { accountId: string }, signal?: AbortSignal) {
    return toAccountBalances(await this.sync(ref.accountId, signal));
  }

  async getOperations(ref: { accountId: string }, _query: unknown, signal?: AbortSignal) {
    const operations = toAccountOperations(await this.sync(ref.accountId, signal));
    return { operations, complete: true, total: operations.length };
  }

  // A caller's signal stops that caller waiting; it does not cancel the run other callers share.
  private async sync(accountId: string, signal?: AbortSignal): Promise<Account> {
    if (signal?.aborted) throw abortError();
    const shared = this.inflight.get(accountId) ?? this.start(accountId);
    if (!signal) return shared;
    let onAbort: () => void = () => undefined;
    const aborted = new Promise<never>((_, reject) => {
      onAbort = () => reject(abortError());
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
    const account = this.config.getAccount(accountId);
    if (!account) throw new Error(`account ${accountId} is not in the store`);
    await this.config.prepareCurrency(account.currency);
    const bridge = await getAccountBridge(account);
    return lastValueFrom(
      bridge
        .sync(account, {
          paginationConfig: {},
          blacklistedTokenIds: this.config.blacklistedTokenIds?.() ?? [],
        })
        .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account)),
    );
  }
}

// Legacy `Account` → entity rows. Kept here on purpose: nothing else maps this way.

const toTokenBalance = (account: TokenAccount, at: string): AccountBalance => ({
  accountId: TokenAccountIdSchema.parse(account.id),
  assetId: TokenCurrencyIdSchema.parse(account.token.id),
  balance: AmountStrSchema.parse(account.balance.toFixed()),
  spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
  parentId: AccountIdSchema.parse(account.parentId),
  at: DateTimeIsoSchema.parse(at),
});

function toAccountBalances(account: Account, at: Date = new Date()): AccountBalance[] {
  const isoDate = at.toISOString();
  return [
    {
      accountId: AccountIdSchema.parse(account.id),
      assetId: CryptoCurrencyIdSchema.parse(account.currency.id),
      balance: AmountStrSchema.parse(account.balance.toFixed()),
      spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
      at: DateTimeIsoSchema.parse(isoDate),
    },
    ...(account.subAccounts ?? []).map(subAccount => toTokenBalance(subAccount, isoDate)),
  ];
}

const toAccountOperation = (
  operation: Operation,
  assetId: string,
  parentOperationId?: string,
): AccountOperation =>
  AccountOperationSchema.parse({
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
    if (childAssetId !== undefined) {
      rows.push(toAccountOperation(child, childAssetId, operation.id));
    }
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
  // Sorted here, not in the slice: the main and token lists are each ordered, their concatenation is not.
  return [...byId.values()].sort(compareAccountOperations);
}
