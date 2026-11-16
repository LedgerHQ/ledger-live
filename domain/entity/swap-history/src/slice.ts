import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import {
  initialSwapHistoryState,
  type SwapHistoryEntry,
  type SwapHistoryState,
  type SwapId,
} from "./schema";

const noEntries: SwapHistoryEntry[] = [];

export const swapHistorySlice = createSlice({
  name: "swapHistory",
  initialState: initialSwapHistoryState,
  reducers: {
    /** Replaces every account's swaps: the mirror of the legacy accounts sends the whole history. */
    swapHistorySynced: (_, { payload }: PayloadAction<SwapHistoryState>) => payload,
  },
  selectors: {
    /** The swaps recorded on one account, in the order they were made. */
    selectAccountSwapHistory: (state, accountUUID: AccountUUID): SwapHistoryEntry[] =>
      state[accountUUID] ?? noEntries,
    /** Every swap of every account. */
    selectSwapHistoryEntries: createSelector(
      [(state: SwapHistoryState) => state],
      (state): SwapHistoryEntry[] => Object.values(state).flatMap(entries => entries ?? noEntries),
    ),
    selectSwapHistoryEntry: (state, swapId: SwapId): SwapHistoryEntry | undefined => {
      for (const entries of Object.values(state)) {
        const entry = entries?.find(candidate => candidate.swapId === swapId);
        if (entry) return entry;
      }
      return undefined;
    },
  },
});

export const { swapHistorySynced } = swapHistorySlice.actions;
export const { selectAccountSwapHistory, selectSwapHistoryEntries, selectSwapHistoryEntry } =
  swapHistorySlice.selectors;

export default swapHistorySlice.reducer;
