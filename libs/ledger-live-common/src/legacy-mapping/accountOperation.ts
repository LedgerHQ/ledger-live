import type { Account, Operation } from "@ledgerhq/types-live";
import {
  AccountOperationSchema,
  OperationAmountSchema,
  compareAccountOperations,
  type AccountOperation,
} from "@domain/entity-account-operations";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { parseAnyAccountId } from "@domain/entity-account";

export type AssetIdResolver = (accountId: string) => string | undefined;

export function assetIdsOf(account: Account): AssetIdResolver {
  const byAccountId = new Map<string, string>([[account.id, account.currency.id]]);
  for (const subAccount of account.subAccounts ?? []) {
    byAccountId.set(subAccount.id, subAccount.token.id);
  }
  return accountId => byAccountId.get(accountId);
}

export function toAccountOperation(
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

export function flattenOperation(
  operation: Operation,
  assetIdOf: AssetIdResolver,
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

export function toAccountOperations(account: Account): AccountOperation[] {
  const assetIdOf = assetIdsOf(account);
  const own = account.operations.flatMap(operation => flattenOperation(operation, assetIdOf));
  const tokens = (account.subAccounts ?? []).flatMap(subAccount =>
    subAccount.operations.flatMap(operation => flattenOperation(operation, assetIdOf)),
  );
  const byId = new Map<string, AccountOperation>();
  for (const operation of [...own, ...tokens]) {
    if (!byId.has(operation.id)) byId.set(operation.id, operation);
  }
  // Sorted here, not left to the slice: concatenating the main account's operations with its token
  // accounts' produces two ordered lists and one unordered result, and a consumer reading through
  // `readAccountOperations` without a store gets exactly this array.
  return [...byId.values()].sort(compareAccountOperations);
}
