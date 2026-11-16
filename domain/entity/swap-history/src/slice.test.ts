import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockUtxoAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { SwapIdSchema, initialSwapHistoryState } from "./schema";
import { mockSwapHistoryEntry } from "./schema.mock";
import { swapHistorySlice, swapHistorySynced } from "./slice";
import { mockSwapHistoryState } from "./slice.mock";

const { reducer } = swapHistorySlice;
const { selectAccountSwapHistory, selectSwapHistoryEntries, selectSwapHistoryEntry } =
  swapHistorySlice.getSelectors();

const ethSwap = mockSwapHistoryEntry();
const btcUUID = computeAccountUUID(mockUtxoAccountDescriptor());
const btcSwap = mockSwapHistoryEntry({
  swapId: "swap-2",
  accountUUID: btcUUID,
  assetId: "bitcoin",
});
const state = mockSwapHistoryState({ [btcUUID]: [btcSwap] });

describe("swapHistorySlice", () => {
  it("should start empty", () => {
    expect(reducer(undefined, { type: "" })).toEqual(initialSwapHistoryState);
  });

  it("should replace the whole history when synced", () => {
    const next = reducer(state, swapHistorySynced({ [btcUUID]: [btcSwap] }));
    expect(next).toEqual({ [btcUUID]: [btcSwap] });
  });

  it("should select the swaps of one account", () => {
    expect(selectAccountSwapHistory(state, btcUUID)).toEqual([btcSwap]);
  });

  it("should select a stable empty list for an account with no swap", () => {
    const empty = selectAccountSwapHistory(initialSwapHistoryState, btcUUID);
    expect(empty).toEqual([]);
    expect(selectAccountSwapHistory(initialSwapHistoryState, btcUUID)).toBe(empty);
  });

  it("should select every swap, memoized", () => {
    expect(selectSwapHistoryEntries(state)).toEqual([ethSwap, btcSwap]);
    expect(selectSwapHistoryEntries(state)).toBe(selectSwapHistoryEntries(state));
  });

  it("should select a swap by id", () => {
    expect(selectSwapHistoryEntry(state, SwapIdSchema.parse("swap-2"))).toEqual(btcSwap);
    expect(selectSwapHistoryEntry(state, SwapIdSchema.parse("unknown"))).toBeUndefined();
  });

  it("should bind the selectors to the root under its name", () => {
    expect(
      swapHistorySlice.selectors.selectAccountSwapHistory({ swapHistory: state }, btcUUID),
    ).toEqual([btcSwap]);
  });
});
