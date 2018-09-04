// @flow

import { createSelector, createStructuredSelector } from "reselect";
import CounterValues from "../countervalues";
import {
  intermediaryCurrency,
  currencySettingsForAccountSelector,
  orderAccountsSelector,
} from "../reducers/settings";
import { accountsSelector } from "../reducers/accounts";
import { sortAccounts } from "../logic/accountOrdering";

const accountsBtcBalanceSelector = createSelector(
  accountsSelector,
  state => state,
  (accounts, state) =>
    accounts.map(account => {
      const { exchange } = currencySettingsForAccountSelector(state, {
        account,
      });
      return CounterValues.calculateSelector(state, {
        from: account.currency,
        to: intermediaryCurrency,
        exchange,
        value: account.balance,
      });
    }),
);

const selectAccountsBalanceAndOrder = createStructuredSelector({
  accounts: accountsSelector,
  accountsBtcBalance: accountsBtcBalanceSelector,
  orderAccounts: orderAccountsSelector,
});

export const refreshAccountsOrdering = () => (dispatch: *, getState: *) => {
  const all = selectAccountsBalanceAndOrder(getState());
  const allRatesAvailable = all.accountsBtcBalance.every(b => !!b);
  if (allRatesAvailable) {
    dispatch({
      type: "REORDER_ACCOUNTS",
      payload: sortAccounts(all),
    });
  }
};
