import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { selectFeature } from "@shared/feature-flags";
import {
  hasUnreadOperations,
  getAddressPoisoningFamiliesForFilter,
} from "LLM/features/OperationsHistory/utils/unreadOperations";
import type { State } from "./types";
import { accountsSelector } from "./accounts";
import {
  counterValueCurrencySelector,
  filterTokenOperationsZeroAmountEnabledSelector,
  hideSmallValueTokenOperationsEffectiveSelector,
} from "./settings";
import { countervaluesStateSelector } from "./countervalues";

export type HistoryState = {
  lastSeenOperationDate: string | null;
};

export const INITIAL_STATE: HistoryState = {
  lastSeenOperationDate: null,
};

const historySlice = createSlice({
  name: "history",
  initialState: INITIAL_STATE,
  reducers: {
    markOperationsAsSeen: {
      reducer: (state, action: PayloadAction<string>) => {
        state.lastSeenOperationDate = action.payload;
      },
      prepare: () => ({ payload: new Date().toISOString() }),
    },
    initHistory: (_, action: PayloadAction<HistoryState>) => action.payload,
  },
});

export const { markOperationsAsSeen, initHistory } = historySlice.actions;

export default historySlice.reducer;

export const lastSeenOperationDateSelector = (state: Pick<State, "history">): string | null =>
  state.history.lastSeenOperationDate;

const dustFilterCountervaluesStateSelector = (state: State) =>
  hideSmallValueTokenOperationsEffectiveSelector(state)
    ? countervaluesStateSelector(state)
    : undefined;

const dustFilterCounterValueCurrencySelector = (state: State) =>
  hideSmallValueTokenOperationsEffectiveSelector(state)
    ? counterValueCurrencySelector(state)
    : undefined;

/**
 * Returns true when any operation shown in global History is newer than lastSeenOperationDate
 * (same pipeline as the History list: flattened accounts, pending ops, address-poisoning filter).
 * Returns false when lastSeenOperationDate is null (fresh install).
 */
export const hasUnreadOperationsSelector = createSelector(
  accountsSelector,
  lastSeenOperationDateSelector,
  filterTokenOperationsZeroAmountEnabledSelector,
  hideSmallValueTokenOperationsEffectiveSelector,
  dustFilterCountervaluesStateSelector,
  dustFilterCounterValueCurrencySelector,
  (state: State) => selectFeature(state, "addressPoisoningOperationsFilter"),
  (
    accounts,
    lastSeenDate,
    shouldFilterTokenOps,
    shouldHideSmallValueTokenOperations,
    countervaluesState,
    userCounterValueCurrency,
    poisoningFeature,
  ) => {
    if (!lastSeenDate) return false;
    const families = getAddressPoisoningFamiliesForFilter(shouldFilterTokenOps, poisoningFeature);
    return hasUnreadOperations(
      accounts,
      lastSeenDate,
      shouldFilterTokenOps,
      families,
      shouldHideSmallValueTokenOperations,
      countervaluesState,
      userCounterValueCurrency,
    );
  },
);
