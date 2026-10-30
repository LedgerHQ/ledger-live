import { accountDataQueryKey } from "@domain/entity-account-data";
import { computeAccountUUID, type AccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type {
  AccountOperation,
  AccountOperationsEntry,
  AccountOperationsQuery,
  AccountOperationsState,
} from "./schema";
import { mockAccountOperation } from "./schema.mock";

/** The entry of an account whose `query` window holds `operations`. */
export function mockAccountOperationsEntry(
  operations: AccountOperation[],
  query?: AccountOperationsQuery,
): AccountOperationsEntry {
  return {
    byId: Object.fromEntries(operations.map(operation => [operation.id, operation])),
    windows: { [accountDataQueryKey(query)]: operations.map(operation => operation.id) },
  };
}

/** Each account's unfiltered window. */
export function mockAccountOperationsState(
  overrides: Partial<Record<AccountUUID, AccountOperation[]>> = {},
): AccountOperationsState {
  const byAccount: Partial<Record<AccountUUID, AccountOperation[]>> = {
    [computeAccountUUID(mockAddressAccountDescriptor())]: [mockAccountOperation()],
    ...overrides,
  };
  return Object.fromEntries(
    Object.entries(byAccount).map(([accountUUID, operations]) => [
      accountUUID,
      mockAccountOperationsEntry(operations ?? []),
    ]),
  );
}
