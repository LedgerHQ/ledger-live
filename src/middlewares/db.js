// @flow
/* eslint-disable consistent-return */

import db from "../db";
import { getAccounts, accountModel } from "../reducers/accounts";

export default (store: *) => (next: *) => (action: *) => {
  if (!action.type.startsWith("DB:")) {
    return next(action);
  }

  const { dispatch, getState } = store;
  const [, type] = action.type.split(":");

  dispatch({ type, payload: action.payload });

  const state = getState();
  const { settings, counterValues } = state;

  const accounts = getAccounts(state);

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
