import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import { selectFeature } from "@shared/feature-flags";
import {
  getAddressPoisoningFamiliesForFilter,
  historyHasUnreadOperations,
  type HistoryOperationFilterOptions,
  type HistoryUnreadOperationsOptions,
} from "LLD/features/History/utils/historyOperationItems";
import type { State } from ".";
import { accountsSelector } from "./accounts";
import {
  counterValueCurrencySelector,
  filterTokenOperationsZeroAmountSelector,
  hideSmallValueTokenOperationsSelector,
  localeSelector,
} from "./settings";
import { countervaluesStateSelector } from "./countervalues";
import { SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";

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

export const historyDustFilteringFeatureEnabledSelector = (state: State) =>
  selectFeature(state, "lwdDustFiltering")?.enabled === true;

export const hideSmallValueTokenOperationsEffectiveSelector = createSelector(
  historyDustFilteringFeatureEnabledSelector,
  hideSmallValueTokenOperationsSelector,
  (isHistoryDustFilteringFeatureEnabled, hideSmallValueTokenOperations) =>
    isHistoryDustFilteringFeatureEnabled && hideSmallValueTokenOperations,
);

const selectWhenDustFilterEnabled = <T>(
  state: State,
  selector: (state: State) => T,
): T | undefined =>
  hideSmallValueTokenOperationsEffectiveSelector(state) ? selector(state) : undefined;

const dustFilterCountervaluesStateSelector = (state: State) =>
  selectWhenDustFilterEnabled(state, countervaluesStateSelector);

const dustFilterCounterValueCurrencySelector = (state: State) =>
  selectWhenDustFilterEnabled(state, counterValueCurrencySelector);

export const historyDustFilterOptionsSelector = createSelector(
  hideSmallValueTokenOperationsEffectiveSelector,
  dustFilterCountervaluesStateSelector,
  dustFilterCounterValueCurrencySelector,
  (
    shouldHideSmallValueTokenOperations,
    countervaluesState,
    userCounterValueCurrency,
  ): Pick<
    HistoryOperationFilterOptions,
    "shouldHideSmallValueTokenOperations" | "countervaluesState" | "userCounterValueCurrency"
  > => ({
    shouldHideSmallValueTokenOperations,
    countervaluesState,
    userCounterValueCurrency,
  }),
);

export const historyDustFilterCounterValueCurrencyForDisplaySelector = (state: State) =>
  historyDustFilteringFeatureEnabledSelector(state)
    ? counterValueCurrencySelector(state)
    : undefined;

export const historyDustFilterCountervaluesStateForDisplaySelector = (state: State) => {
  const counterValueCurrency = historyDustFilterCounterValueCurrencyForDisplaySelector(state);
  if (
    !counterValueCurrency ||
    counterValueCurrency.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker
  ) {
    return undefined;
  }

  return countervaluesStateSelector(state);
};

export const historyDustFilterLocaleSelector = (state: State) =>
  historyDustFilteringFeatureEnabledSelector(state) ? localeSelector(state) : undefined;

const historyUnreadOperationsOptionsSelector = createSelector(
  (state: State) => state.settings.currenciesSettings,
  filterTokenOperationsZeroAmountSelector,
  historyDustFilterOptionsSelector,
  (state: State) => selectFeature(state, "addressPoisoningOperationsFilter"),
  (
    currenciesSettings,
    shouldFilterTokenOps,
    dustFilterOptions,
    poisoningFeature,
  ): HistoryUnreadOperationsOptions => ({
    currenciesSettings,
    shouldFilterTokenOps,
    addressPoisoningFamilies: getAddressPoisoningFamiliesForFilter(
      shouldFilterTokenOps,
      poisoningFeature,
    ),
    ...dustFilterOptions,
  }),
);

/**
 * Returns true when any operation shown in global History is newer than lastSeenOperationDate
 * (same pipeline as the History list: flattened accounts, pending ops, address-poisoning filter).
 * Returns false when lastSeenOperationDate is null (fresh install).
 */
export const hasUnreadOperationsSelector = createSelector(
  accountsSelector,
  lastSeenOperationDateSelector,
  historyUnreadOperationsOptionsSelector,
  (accounts, lastSeenDate, options) => {
    if (!lastSeenDate) return false;
    return historyHasUnreadOperations(accounts, lastSeenDate, options);
  },
);
