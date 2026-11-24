import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { AccountStatusState } from "./schema";
import { mockAccountStatus, mockAssetStatus } from "./schema.mock";

/** The mock address account, ready, and its native ethereum read. */
export function mockAccountStatusState(overrides: AccountStatusState = {}): AccountStatusState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: {
      account: { revision: 0, status: mockAccountStatus() },
      assets: {
        [CryptoOrTokenCurrencyIdSchema.parse("ethereum")]: {
          revision: 0,
          status: mockAssetStatus(),
        },
      },
    },
    ...overrides,
  };
}
