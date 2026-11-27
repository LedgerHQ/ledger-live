import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { computeAccountUUID } from "@domain/entity-account/schema.mock";
import type { AccountBalanceHistoriesState } from "./schema";
import { mockAssetBalanceHistory } from "./schema.mock";

export function mockAccountBalanceHistoriesState(
  overrides: AccountBalanceHistoriesState = {},
): AccountBalanceHistoriesState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: {
      month: { revision: 0, series: [mockAssetBalanceHistory()] },
    },
    ...overrides,
  };
}
