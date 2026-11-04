import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import type { AccountOperation } from "@domain/entity-account-operation";
import type { Account, AccountLike, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { OperationTableItem } from "../types";
import { getOperationCounterpartyAddress } from "./getOperationCounterpartyAddress";
import { isOperationUnread } from "./historyOperationItems";

type LocatedOperation = {
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
};

export type AccountDataOperationFilter = (operation: Operation, account: AccountLike) => boolean;

function isTokenAccount(account: AccountLike): account is TokenAccount {
  return account.type === "TokenAccount";
}

function recordedOnTokenAccount({ extra }: Operation): boolean {
  return typeof extra === "object" && extra !== null && "assetReference" in extra;
}

function operationKey(hash: string, type: string, assetId: string): string {
  return `${hash}\0${type}\0${assetId}`;
}

function indexLegacyOperations(root: Account): Map<string, LocatedOperation> {
  const byKey = new Map<string, LocatedOperation>();
  const assetIdByAccountId = new Map<string, string>([[root.id, root.currency.id]]);
  const subAccountById = new Map((root.subAccounts ?? []).map(sub => [sub.id, sub]));
  for (const sub of root.subAccounts ?? []) {
    if (isTokenAccount(sub)) assetIdByAccountId.set(sub.id, sub.token.id);
  }

  const put = (
    assetId: string,
    operation: Operation,
    account: AccountLike,
    parentAccount?: Account,
  ) => {
    const key = operationKey(operation.hash, operation.type, assetId);
    if (!byKey.has(key)) byKey.set(key, { operation, account, parentAccount });
  };

  const walk = (
    assetId: string,
    operation: Operation,
    account: AccountLike,
    parentAccount?: Account,
  ) => {
    put(assetId, operation, account, parentAccount);
    for (const sub of operation.subOperations ?? []) {
      const subAssetId = assetIdByAccountId.get(sub.accountId);
      const subAccount = subAccountById.get(sub.accountId);
      if (subAssetId && subAccount) put(subAssetId, sub, subAccount, root);
    }
    for (const internal of operation.internalOperations ?? []) {
      if (recordedOnTokenAccount(internal)) continue;
      put(assetId, internal, account, parentAccount);
    }
  };

  const walkAccount = (account: AccountLike, parentAccount?: Account) => {
    const assetId = isTokenAccount(account) ? account.token.id : root.currency.id;
    const confirmedHashes = new Set(account.operations.map(operation => operation.hash));
    for (const operation of account.operations) walk(assetId, operation, account, parentAccount);
    for (const operation of account.pendingOperations) {
      if (confirmedHashes.has(operation.hash)) continue;
      walk(assetId, operation, account, parentAccount);
    }
  };

  walkAccount(root);
  for (const sub of root.subAccounts ?? []) walkAccount(sub, root);
  return byKey;
}

function toTableItem(
  located: LocatedOperation,
  source: AccountOperation,
  lastSeenTs: number | null,
): OperationTableItem {
  const { operation, account, parentAccount } = located;
  return {
    id: `${account.id}_${operation.id}`,
    operation,
    account,
    parentAccount,
    date: operation.date,
    type: operation.type,
    address: getOperationCounterpartyAddress(operation),
    amount: getOperationAmountNumber(operation),
    currency: getAccountCurrency(account),
    isPending: source.blockHeight === null,
    isUnread: isOperationUnread(operation.date, lastSeenTs),
  };
}

export function toAccountDataOperationItems(
  account: Account,
  operations: readonly AccountOperation[],
  lastSeenTs: number | null,
  filterOperation: AccountDataOperationFilter = () => true,
): OperationTableItem[] {
  const located = indexLegacyOperations(account);
  return operations.flatMap(operation => {
    const match = located.get(operationKey(operation.hash, operation.type, operation.assetId));
    if (
      !match ||
      match.operation.type === "NONE" ||
      !filterOperation(match.operation, match.account)
    )
      return [];
    return [toTableItem(match, operation, lastSeenTs)];
  });
}

export function compareOperationTableItems(a: OperationTableItem, b: OperationTableItem): number {
  if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;
  return b.date.getTime() - a.date.getTime();
}
