import type { AccountUUID } from "@domain/entity-account-descriptor";
import type {
  AccountOperation,
  AccountOperationsState,
  BalanceAssetId,
  OperationId,
} from "./schema";

export type WithAccountOperations = { accountOperations: AccountOperationsState };

/** With `filterAsset`, only that asset's rows: a window read for another asset is never shown whole. */
export const selectAccountOperations = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  { filterAsset }: { filterAsset?: BalanceAssetId } = {},
): AccountOperation[] | undefined => {
  const operations = state.accountOperations[accountUUID];
  return filterAsset === undefined
    ? operations
    : operations?.filter(operation => operation.assetId === filterAsset);
};

export const selectAccountOperation = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  operationId: OperationId,
): AccountOperation | undefined =>
  state.accountOperations[accountUUID]?.find(operation => operation.id === operationId);
