import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import { AccountDataSourceIdSchema, type AccountDataKind } from "@domain/entity-account-data";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import {
  accountDescriptorKey,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  AccountOperationSchema,
  compareAccountOperations,
  type AccountOperation,
  type AccountOperationsPage,
} from "@domain/entity-account-operations";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "../bridge";
import { fromLegacyAccount } from "../account/accountDescriptor";

export type FullSyncHost = {
  /** The legacy account a descriptor describes: how it is found is the app's business. */
  findAccount(descriptor: AccountDescriptor): Account | undefined;
  prepareCurrency(currency: Account["currency"]): Promise<unknown>;
  blacklistedTokenIds?(): string[];
  /** The most syncs at once, as the background sync allows. */
  concurrency?: number;
};

// A descriptor is not free to compute, and the sync replaces the account objects.
const descriptorKeys = new WeakMap<Account, string | null>();

function descriptorKeyOf(account: Account): string | null {
  let key = descriptorKeys.get(account);
  if (key === undefined) {
    try {
      key = accountDescriptorKey(fromLegacyAccount(account));
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

function toBalances(account: Account): AccountAssetBalance[] {
  return [
    { assetId: account.currency.id, balance: account.balance, spendable: account.spendableBalance },
    ...(account.subAccounts ?? []).map(token => ({
      assetId: token.token.id,
      balance: token.balance,
      spendable: token.spendableBalance,
    })),
  ].map(({ assetId, balance, spendable }) =>
    AccountAssetBalanceSchema.parse({
      assetId,
      balance: balance.toFixed(),
      spendableBalance: spendable.toFixed(),
    }),
  );
}

function toOperation(
  operation: Operation,
  assetId: string,
  parentOperationId?: string,
  id = operation.id,
) {
  return AccountOperationSchema.parse({
    id,
    assetId,
    hash: operation.hash,
    type: operation.type,
    value: operation.value.toFixed(),
    fee: operation.fee.toFixed(),
    senders: operation.senders,
    recipients: operation.recipients,
    blockHeight: operation.blockHeight ?? null,
    date: operation.date.toISOString(),
    hasFailed: operation.hasFailed,
    parentOperationId,
  });
}

/** What the synced account holds: its operations and its tokens', each with its sub and internal ones. */
function toOperations(account: Account): AccountOperation[] {
  const assetIds = new Map<string, string>([[account.id, account.currency.id]]);
  for (const token of account.subAccounts ?? []) assetIds.set(token.id, token.token.id);
  const flatten = (operation: Operation): AccountOperation[] => {
    const assetId = assetIds.get(operation.accountId);
    // Internal transfers share their hash and type, so the bridge's id: number them within the
    // transaction, as every parent referencing them lists them alike.
    const children = [
      ...(operation.subOperations ?? []).map(child => ({ child, id: child.id })),
      ...(operation.internalOperations ?? []).map((child, index) => ({
        child,
        id: `${operation.hash}-internal-${index}`,
      })),
    ];
    return [
      ...(assetId === undefined ? [] : [toOperation(operation, assetId)]),
      ...children.flatMap(({ child, id }) => {
        const childAssetId = assetIds.get(child.accountId);
        return childAssetId === undefined
          ? []
          : [toOperation(child, childAssetId, operation.id, id)];
      }),
    ];
  };
  const all = [
    ...account.operations,
    ...(account.subAccounts ?? []).flatMap(token => token.operations),
  ].flatMap(flatten);
  // First copy wins: a token transfer comes first as its parent's sub-operation, with the parent's id.
  const byId = new Map<string, AccountOperation>();
  for (const operation of all) if (!byId.has(operation.id)) byId.set(operation.id, operation);
  return [...byId.values()].sort(compareAccountOperations);
}

/**
 * Every kind from one `AccountBridge.sync()`: the legacy path, for families no cheaper source serves.
 * One sync per account while in flight, so a balance and an operations read of it share the run.
 */
export function createFullSyncSource(host: FullSyncHost) {
  const inflight = new Map<string, Promise<Account>>();

  async function run(account: Account): Promise<Account> {
    await host.prepareCurrency(account.currency);
    const bridge = await getAccountBridge(account);
    return lastValueFrom(
      bridge
        .sync(account, {
          paginationConfig: {},
          blacklistedTokenIds: host.blacklistedTokenIds?.() ?? [],
        })
        .pipe(reduce((acc: Account, updater: (a: Account) => Account) => updater(acc), account)),
    );
  }

  function sync({ descriptor }: AccountTarget): Promise<Account> {
    const account = host.findAccount(descriptor);
    if (!account) {
      return Promise.reject(
        new Error(`No account in the store is described by ${accountDescriptorKey(descriptor)}`),
      );
    }
    const running = inflight.get(account.id);
    if (running) return running;
    const started = run(account).finally(() => inflight.delete(account.id));
    inflight.set(account.id, started);
    return started;
  }

  return {
    id: AccountDataSourceIdSchema.parse("full-sync"),
    concurrency: host.concurrency,
    supports(descriptor: AccountDescriptor, _kind: AccountDataKind) {
      try {
        return findCryptoCurrencyById(currencyIdFromNetwork(descriptor.network)) !== undefined;
      } catch {
        return false;
      }
    },
    read: {
      balance: async (target: AccountTarget) => toBalances(await sync(target)),
      // A sync has no page and bounds what it keeps: what it holds, without a cursor nor a total.
      operations: async (target: AccountTarget): Promise<AccountOperationsPage> => ({
        operations: toOperations(await sync(target)),
      }),
    },
  } satisfies AccountDataSource;
}
