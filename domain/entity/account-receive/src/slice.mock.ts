import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { AccountReceivesState } from "./schema";
import { mockAccountReceive } from "./schema.mock";

/** The mock address account receiving its native ethereum. */
export function mockAccountReceivesState(
  overrides: AccountReceivesState = {},
): AccountReceivesState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: {
      [CryptoOrTokenCurrencyIdSchema.parse("ethereum")]: {
        revision: 0,
        receive: mockAccountReceive(),
      },
    },
    ...overrides,
  };
}
