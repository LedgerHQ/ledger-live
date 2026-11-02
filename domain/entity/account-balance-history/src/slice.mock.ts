import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountBalanceHistoriesState } from "./schema";
import { mockAssetBalanceHistory } from "./schema.mock";

export function mockAccountBalanceHistoriesState(
  overrides: AccountBalanceHistoriesState = {},
): AccountBalanceHistoriesState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: { month: [mockAssetBalanceHistory()] },
    ...overrides,
  };
}
