/* eslint-disable consistent-return */

import db from "../db";
import { getAccounts, deserializeAccounts } from "../reducers/accounts";

export default store => next => action => {
  if (!action.type.startsWith("DB:")) {
    return next(action);
  }

  const { dispatch, getState } = store;
  const [, type] = action.type.split(":");

  dispatch({ type, payload: action.payload });

  const state = getState();
  const { settings, counterValues } = state;

  const accounts = getAccounts(state);

  db.save("settings", settings);
  db.save("accounts", deserializeAccounts(accounts));
  db.save("countervalues", counterValues);
};
