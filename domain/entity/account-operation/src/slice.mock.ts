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
  const queryKey = accountDataQueryKey(query);
  const byId: AccountOperationsEntry["byId"] = {};
  const countervalues: NonNullable<AccountOperationsEntry["countervalues"][string]> = {};
  for (const { countervalues: valued, ...row } of operations) {
    byId[row.id] = row;
    if (valued) countervalues[row.id] = valued;
  }
  return {
    byId,
    windows: { [queryKey]: operations.map(operation => operation.id) },
    countervalues: Object.keys(countervalues).length > 0 ? { [queryKey]: countervalues } : {},
    revisionById: Object.fromEntries(operations.map(operation => [operation.id, 0])),
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
