import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountOperationsState } from "./schema";
import { mockAccountOperation } from "./schema.mock";

export function mockAccountOperationsState(
  overrides: AccountOperationsState = {},
): AccountOperationsState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: [mockAccountOperation()],
    ...overrides,
  };
}
