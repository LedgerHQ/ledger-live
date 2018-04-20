// @flow
/* eslint-disable consistent-return */

import db from "../db";
import { accountsSelector, accountModel } from "../reducers/accounts";

export default (store: *) => (next: *) => (action: Object) => {
  if (!action.type.startsWith("DB:")) {
    return next(action);
  }

  const { dispatch, getState } = store;
  const [, type] = action.type.split(":");

  dispatch({ ...action, type });

  const state = getState();
  const { settings, counterValues } = state;

  const accounts = accountsSelector(state);

  const startTime = Date.now();
  db
    .save([
      ["settings", settings],
      ["accounts", accounts.map(accountModel.encode)],
      ["countervalues", counterValues]
    ])
    .then(
      () => {
        console.log(`DB saved in ${(Date.now() - startTime).toFixed(0)} ms`);
      },
      e => {
        console.error(e);
      }
    );
};
