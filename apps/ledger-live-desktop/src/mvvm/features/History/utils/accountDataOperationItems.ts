import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  isTokenInternal,
  toOperationId,
} from "@ledgerhq/live-common/account-data/full-sync/operations";
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

function indexLegacyOperations(root: Account): Map<string, LocatedOperation> {
  const byId = new Map<string, LocatedOperation>();
  const assetIdByAccountId = new Map<string, string>([[root.id, root.currency.id]]);
  for (const sub of root.subAccounts ?? []) {
    if (isTokenAccount(sub)) assetIdByAccountId.set(sub.id, sub.token.id);
  }

  const put = (
    assetId: string,
    operation: Operation,
    account: AccountLike,
    parentAccount: Account | undefined,
    internalIndex?: number,
  ) => {
    byId.set(toOperationId(assetId, operation, internalIndex), {
      operation,
      account,
      parentAccount,
    });
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
      const subAccount = root.subAccounts?.find(item => item.id === sub.accountId);
      if (subAssetId && subAccount) put(subAssetId, sub, subAccount, root);
    }
    (operation.internalOperations ?? []).forEach((internal, index) => {
      if (isTokenInternal(internal)) return;
      put(assetId, internal, account, parentAccount, index);
    });
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
  return byId;
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
    const match = located.get(operation.id);
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
