import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { SwapHistoryEntrySchema, type SwapHistoryEntry } from "./schema";

type SwapHistoryEntryInput = { [K in keyof SwapHistoryEntry]: string | number | undefined };

export function mockSwapHistoryEntry(overrides?: Partial<SwapHistoryEntryInput>): SwapHistoryEntry {
  const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
  return SwapHistoryEntrySchema.parse({
    swapId: "swap-1",
    provider: "changelly",
    status: "pending",
    accountUUID,
    assetId: "ethereum",
    toAccountUUID: accountUUID,
    toAssetId: "ethereum/erc20/usd__coin",
    operationId: "js:2:ethereum:0x71:-0xabc-OUT",
    fromAmount: "1000000000000000000",
    toAmount: "3000000000",
    ...overrides,
  });
}
