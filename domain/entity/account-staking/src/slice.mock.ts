import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountStakingState } from "./schema";
import { mockAccountStaking } from "./schema.mock";

/** The mock address account, with one delegation and one unbonding. */
export function mockAccountStakingState(overrides: AccountStakingState = {}): AccountStakingState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: {
      revision: 0,
      staking: mockAccountStaking(),
    },
    ...overrides,
  };
}
