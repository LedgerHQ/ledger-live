import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountTronState } from "./schema";
import { mockTronResources } from "./schema.mock";

/** The mock address account, its resources read. */
export function mockAccountTronState(overrides: AccountTronState = {}): AccountTronState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: {
      revision: 0,
      resources: mockTronResources(),
    },
    ...overrides,
  };
}
