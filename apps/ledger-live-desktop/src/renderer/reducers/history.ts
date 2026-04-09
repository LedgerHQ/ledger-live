import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { selectFeature } from "@shared/feature-flags";
import {
  getAddressPoisoningFamiliesForFilter,
  historyHasUnreadOperations,
} from "LLD/features/History/utils/historyOperationItems";
import type { State } from ".";
import { accountsSelector } from "./accounts";
import { filterTokenOperationsZeroAmountSelector } from "./settings";

export type HistoryState = {
  lastSeenOperationDate: string | null;
};

const initialState: HistoryState = {
  // null ensures existing users don't see their entire history as unread on first update
  lastSeenOperationDate: null,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    markOperationsAsSeen: state => {
      state.lastSeenOperationDate = new Date().toISOString();
    },
    initHistory: (_, action: PayloadAction<HistoryState>) => action.payload,
  },
});

export const { markOperationsAsSeen, initHistory } = historySlice.actions;

export default historySlice.reducer;

export const lastSeenOperationDateSelector = (state: Pick<State, "history">): string | null =>
  state.history.lastSeenOperationDate;

/**
 * Returns true when any operation shown in global History is newer than lastSeenOperationDate
 * (same pipeline as the History list: flattened accounts, pending ops, address-poisoning filter).
 * Returns false when lastSeenOperationDate is null (fresh install).
 */
export const hasUnreadOperationsSelector = createSelector(
  accountsSelector,
  lastSeenOperationDateSelector,
  (state: State) => state.settings.currenciesSettings,
  filterTokenOperationsZeroAmountSelector,
  (state: State) => selectFeature(state, "addressPoisoningOperationsFilter"),
  (accounts, lastSeenDate, currenciesSettings, shouldFilterTokenOps, poisoningFeature) => {
    if (!lastSeenDate) return false;
    const families = getAddressPoisoningFamiliesForFilter(shouldFilterTokenOps, poisoningFeature);
    return historyHasUnreadOperations(
      accounts,
      lastSeenDate,
      currenciesSettings,
      shouldFilterTokenOps,
      families,
    );
  },
);
