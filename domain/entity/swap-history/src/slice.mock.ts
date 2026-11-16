import { computeAccountUUID, type AccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { SwapHistoryEntry, SwapHistoryState } from "./schema";
import { mockSwapHistoryEntry } from "./schema.mock";

/** One swap on the mock address account, unless overridden. */
export function mockSwapHistoryState(
  overrides: Partial<Record<AccountUUID, SwapHistoryEntry[]>> = {},
): SwapHistoryState {
  return {
    [computeAccountUUID(mockAddressAccountDescriptor())]: [mockSwapHistoryEntry()],
    ...overrides,
  };
}
