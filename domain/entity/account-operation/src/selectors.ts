import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountOperation, AccountOperationsState, OperationId } from "./schema";

export type WithAccountOperations = { accountOperations: AccountOperationsState };

export const selectAccountOperations = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
): AccountOperation[] | undefined => state.accountOperations[accountUUID];

export const selectAccountOperation = (
  state: WithAccountOperations,
  accountUUID: AccountUUID,
  operationId: OperationId,
): AccountOperation | undefined =>
  state.accountOperations[accountUUID]?.find(operation => operation.id === operationId);
