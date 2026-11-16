import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { SwapHistoryEntrySchema, SwapHistoryStateSchema, initialSwapHistoryState } from "./schema";
import { mockSwapHistoryEntry } from "./schema.mock";

describe("SwapHistoryEntrySchema", () => {
  it("should accept a mock entry", () => {
    expect(SwapHistoryEntrySchema.parse(mockSwapHistoryEntry())).toEqual(mockSwapHistoryEntry());
  });

  it("should honor overrides", () => {
    expect(mockSwapHistoryEntry({ status: "finished", finalAmount: "2.5" })).toMatchObject({
      status: "finished",
      finalAmount: "2.5",
    });
  });

  it("should accept an entry with no operation nor receiving account yet", () => {
    const entry = mockSwapHistoryEntry({
      operationId: undefined,
      toAccountUUID: undefined,
      toAssetId: undefined,
      createdAt: 1_700_000_000_000,
    });
    expect(entry.operationId).toBeUndefined();
  });

  it("should reject an empty swap id", () => {
    expect(
      SwapHistoryEntrySchema.safeParse({ ...mockSwapHistoryEntry(), swapId: "" }).success,
    ).toBe(false);
  });

  it("should reject a legacy account id as account", () => {
    expect(
      SwapHistoryEntrySchema.safeParse({
        ...mockSwapHistoryEntry(),
        accountUUID: "js:2:ethereum:0x71:",
      }).success,
    ).toBe(false);
  });

  it("should reject a fractional amount in the smallest unit", () => {
    expect(
      SwapHistoryEntrySchema.safeParse({ ...mockSwapHistoryEntry(), toAmount: "1.5" }).success,
    ).toBe(false);
  });

  it("should reject a negative final amount", () => {
    expect(
      SwapHistoryEntrySchema.safeParse({ ...mockSwapHistoryEntry(), finalAmount: "-1" }).success,
    ).toBe(false);
  });
});

describe("SwapHistoryStateSchema", () => {
  it("should accept the initial state", () => {
    expect(SwapHistoryStateSchema.parse(initialSwapHistoryState)).toEqual({});
  });

  it("should accept entries keyed by AccountUUID", () => {
    const accountUUID = computeAccountUUID(mockAddressAccountDescriptor());
    const state = { [accountUUID]: [mockSwapHistoryEntry()] };
    expect(SwapHistoryStateSchema.parse(state)).toEqual(state);
  });

  it("should reject a key that is not an AccountUUID", () => {
    expect(SwapHistoryStateSchema.safeParse({ "js:2:ethereum:0x71:": [] }).success).toBe(false);
  });
});
