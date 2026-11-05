import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountReceivesState } from "./schema";
import { mockAccountReceive } from "./schema.mock";

export function mockAccountReceivesState(
  overrides: AccountReceivesState = {},
): AccountReceivesState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: mockAccountReceive(),
    ...overrides,
  };
}
