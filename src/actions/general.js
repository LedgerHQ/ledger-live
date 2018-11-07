// @flow

import { createSelector, createStructuredSelector } from "reselect";
import isEqual from "lodash/isEqual";
import { sortAccounts } from "@ledgerhq/live-common/lib/account";
import CounterValues from "../countervalues";
import {
  intermediaryCurrency,
  currencySettingsForAccountSelector,
  orderAccountsSelector,
} from "../reducers/settings";
import { accountsSelector } from "../reducers/accounts";
import { flushAll } from "../components/DBSave";

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
    const payload = sortAccounts(all);
    if (!payload) return;
    const accounts = accountsSelector(getState()).map(a => a.id);
    if (!isEqual(accounts, payload)) {
      dispatch({
        type: "REORDER_ACCOUNTS",
        payload,
      });
    }
  }
};

const delay = ms => new Promise(success => setTimeout(success, ms));

export const cleanCache = () => async (dispatch: *) => {
  dispatch({ type: "CLEAN_CACHE" });
  dispatch({ type: "LEDGER_CV:WIPE" });
  await delay(100);
  flushAll();
};
