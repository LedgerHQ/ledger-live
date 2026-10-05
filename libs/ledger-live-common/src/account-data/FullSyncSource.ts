import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data-source";
import { TokenAccountIdSchema, parseAnyAccountId, type AccountId } from "@domain/entity-account";
import {
  currencyIdFromNetwork,
  accountDescriptorKey,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
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
import { accountDescriptorOf } from "./accountDescriptorOf";

export type FullSyncHost = {
  /** The legacy account a descriptor describes: how it is found is the app's business. */
  findAccount(descriptor: AccountDescriptor): Account | undefined;
  prepareCurrency(currency: Account["currency"]): Promise<unknown>;
  blacklistedTokenIds?(): string[];
  /** The most syncs at once when many accounts are read together, as the background sync allows. */
  concurrency?: number;
};

/** Legacy ids, as the sync reports them, to the ids the entity slices key the account by. */
type IdMap = (legacyId: string) => string;

// A legacy token account or operation id starts with the legacy id of the account it belongs to.
function idMapOf(accountId: AccountId, legacyAccountId: string): IdMap {
  return legacyId =>
    legacyId.startsWith(legacyAccountId)
      ? `${accountId}${legacyId.slice(legacyAccountId.length)}`
      : legacyId;
}

// The descriptor of an account is not free to compute, and the sync replaces the account objects.
const descriptorKeys = new WeakMap<Account, string | null>();

function descriptorKeyOf(account: Account): string | null {
  let key = descriptorKeys.get(account);
  if (key === undefined) {
    try {
      key = accountDescriptorKey(accountDescriptorOf(account));
    } catch {
      key = null;
    }
    descriptorKeys.set(account, key);
  }
  return key;
}

/** The account among `accounts` that `descriptor` describes. */
export function findAccountByDescriptor(
  accounts: readonly Account[],
  descriptor: AccountDescriptor,
): Account | undefined {
  const key = accountDescriptorKey(descriptor);
  return accounts.find(candidate => descriptorKeyOf(candidate) === key);
}

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

  supports(descriptor: AccountDescriptor): boolean {
    try {
      return findCryptoCurrencyById(currencyIdFromNetwork(descriptor.network)) !== undefined;
    } catch {
      return false;
    }
  }

  async balance(
    target: AccountTarget,
    _query: undefined,
    signal?: AbortSignal,
  ): Promise<AccountBalance[]> {
    const account = await this.sync(target, signal);
    return toAccountBalances(account, target.accountId, idMapOf(target.accountId, account.id));
  }

  async operations(
    target: AccountTarget,
    _query: AccountOperationsQuery | undefined,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage> {
    // A sync has no page: it answers with the whole history, so nothing is left below it.
    const account = await this.sync(target, signal);
    const operations = toAccountOperations(account, idMapOf(target.accountId, account.id));
    return { operations, complete: true, total: operations.length };
  }

  private find(descriptor: AccountDescriptor): Account {
    const account = this.host.findAccount(descriptor);
    if (!account) {
      throw new Error(
        `no account in the store is described by ${accountDescriptorKey(descriptor)}`,
      );
    }
    return account;
  }

  private async sync({ descriptor }: AccountTarget, signal?: AbortSignal): Promise<Account> {
    if (signal?.aborted) throw abortError("aborted before the sync started");
    const account = this.find(descriptor);
    const shared = this.inflight.get(account.id) ?? this.start(account);
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

  private start(account: Account): Promise<Account> {
    const run = this.run(account).finally(() => this.inflight.delete(account.id));
    void run.catch(() => undefined);
    this.inflight.set(account.id, run);
    return run;
  }

  private async run(account: Account): Promise<Account> {
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

function toTokenBalance(
  account: TokenAccount,
  at: string,
  parentId: AccountId,
  idOf: IdMap,
): AccountBalance {
  return {
    accountId: TokenAccountIdSchema.parse(idOf(account.id)),
    assetId: TokenCurrencyIdSchema.parse(account.token.id),
    balance: AmountStrSchema.parse(account.balance.toFixed()),
    spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
    parentId,
    at: DateTimeIsoSchema.parse(at),
  };
}

function toAccountBalances(account: Account, accountId: AccountId, idOf: IdMap): AccountBalance[] {
  const at = new Date().toISOString();
  return [
    {
      accountId,
      assetId: CryptoCurrencyIdSchema.parse(account.currency.id),
      balance: AmountStrSchema.parse(account.balance.toFixed()),
      spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
      at: DateTimeIsoSchema.parse(at),
    },
    ...(account.subAccounts ?? []).map(subAccount =>
      toTokenBalance(subAccount, at, accountId, idOf),
    ),
  ];
}

function toAccountOperation(
  operation: Operation,
  assetId: string,
  idOf: IdMap,
  parentOperationId?: string,
): AccountOperation {
  return AccountOperationSchema.parse({
    id: idOf(operation.id),
    accountId: parseAnyAccountId(idOf(operation.accountId)),
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
  idOf: IdMap,
): AccountOperation[] {
  const assetId = assetIdOf(operation.accountId);
  const rows = assetId === undefined ? [] : [toAccountOperation(operation, assetId, idOf)];
  for (const child of [
    ...(operation.subOperations ?? []),
    ...(operation.internalOperations ?? []),
  ]) {
    const childAssetId = assetIdOf(child.accountId);
    if (childAssetId !== undefined)
      rows.push(toAccountOperation(child, childAssetId, idOf, idOf(operation.id)));
  }
  return rows;
}

function toAccountOperations(account: Account, idOf: IdMap): AccountOperation[] {
  const assetIds = new Map<string, string>([[account.id, account.currency.id]]);
  for (const subAccount of account.subAccounts ?? [])
    assetIds.set(subAccount.id, subAccount.token.id);
  const assetIdOf = (accountId: string) => assetIds.get(accountId);

  const own = account.operations.flatMap(operation => flattenOperation(operation, assetIdOf, idOf));
  const tokens = (account.subAccounts ?? []).flatMap(subAccount =>
    subAccount.operations.flatMap(operation => flattenOperation(operation, assetIdOf, idOf)),
  );
  const byId = new Map<string, AccountOperation>();
  for (const operation of [...own, ...tokens]) {
    if (!byId.has(operation.id)) byId.set(operation.id, operation);
  }
  // Sorted here: the main and token lists are each ordered, their concatenation is not.
  return [...byId.values()].sort(compareAccountOperations);
}
