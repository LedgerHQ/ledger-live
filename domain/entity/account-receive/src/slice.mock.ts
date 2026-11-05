import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountReceivesState } from "./schema";
import { mockAccountReceive } from "./schema.mock";

/** The mock address account receiving on its ethereum address. */
export function mockAccountReceivesState(
  overrides: AccountReceivesState = {},
): AccountReceivesState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: {
      revision: 0,
      receive: mockAccountReceive(),
    },
    ...overrides,
  };
}
