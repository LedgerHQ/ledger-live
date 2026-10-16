import type { Account, Operation } from "@ledgerhq/types-live";
import {
  AccountOperationSchema,
  compareAccountOperations,
  type AccountOperation,
  type AccountOperationsPage,
} from "@domain/entity-account-operations";

function toOperation(
  operation: Operation,
  assetId: string,
  parentOperationId?: string,
  id = operation.id,
): AccountOperation[] {
  const parsed = AccountOperationSchema.safeParse({
    id,
    assetId,
    hash: operation.hash,
    type: operation.type,
    value: operation.value.toFixed(),
    fee: operation.fee.toFixed(),
    senders: operation.senders,
    recipients: operation.recipients,
    blockHeight: operation.blockHeight ?? null,
    date: operation.date.toJSON(),
    hasFailed: operation.hasFailed,
    parentOperationId,
  });
  return parsed.success ? [parsed.data] : [];
}

/** What the synced account holds, newest first, tokens and sub/internal ones included; a row the entity rejects is left out. */
export function toAccountOperations(account: Account): AccountOperationsPage {
  const assetIds = new Map<string, string>([[account.id, account.currency.id]]);
  for (const token of account.subAccounts ?? []) assetIds.set(token.id, token.token.id);
  const flatten = (operation: Operation): AccountOperation[] => {
    const assetId = assetIds.get(operation.accountId);
    // Internal transfers share the bridge's id: numbered within the transaction, alike under every parent.
    const children = [
      ...(operation.subOperations ?? []).map(child => ({ child, id: child.id })),
      ...(operation.internalOperations ?? []).map((child, index) => ({
        child,
        id: `${operation.hash}-internal-${index}`,
      })),
    ];
    return [
      ...(assetId === undefined ? [] : toOperation(operation, assetId)),
      ...children.flatMap(({ child, id }) => {
        const childAssetId = assetIds.get(child.accountId);
        return childAssetId === undefined ? [] : toOperation(child, childAssetId, operation.id, id);
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
  return { operations: [...byId.values()].sort(compareAccountOperations) };
}
