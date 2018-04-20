// @flow

// Regroup all the global selectors (selector that regroup selector from many reducers)

import { createSelector } from "reselect";
import { getBalanceHistorySum } from "@ledgerhq/wallet-common/lib/helpers/account";
import { visibleAccountsSelector } from "./reducers/accounts";
import { chartTimeRangeSelector, fiatUnitSelector } from "./reducers/settings";
import { calculateCounterValueSelector } from "./reducers/counterValues";

export const globalBalanceHistorySelector = createSelector(
  visibleAccountsSelector,
  chartTimeRangeSelector,
  fiatUnitSelector,
  calculateCounterValueSelector,
  getBalanceHistorySum
);
