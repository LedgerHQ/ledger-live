// @flow

// Regroup all the global selectors (selector that regroup selector from many reducers)
import { createSelector } from "reselect";
import { getBalanceHistorySum } from "@ledgerhq/wallet-common/lib/helpers/account";
import {
  getUniqueCurrenciesSelector,
  getVisibleAccounts
} from "./reducers/accounts";
import {
  getCurrenciesSettingsSelector,
  chartTimeRangeSelector,
  fiatUnitSelector,
  defaultCurrencySettingsForCurrency
} from "./reducers/settings";
import { calculateCounterValueSelector } from "./reducers/counterValues";

export const currenciesSettingsSelector = createSelector(
  getUniqueCurrenciesSelector,
  getCurrenciesSettingsSelector,
  (currencies, currenciesSettings) => {
    const byCoinType = {};
    currencies.forEach(currency => {
      byCoinType[currency.coinType] = {
        ...defaultCurrencySettingsForCurrency(currency),
        ...currenciesSettings[currency.coinType]
      };
    });
    return byCoinType;
  }
);

export const globalBalanceHistorySelector = createSelector(
  getVisibleAccounts,
  chartTimeRangeSelector,
  fiatUnitSelector,
  calculateCounterValueSelector,
  getBalanceHistorySum
);
