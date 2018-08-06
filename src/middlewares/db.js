// @flow

import db from "../db";
import CounterValues from "../countervalues";
import { exportSelector } from "../reducers/settings";
import { exportSelector as accountsExportSelector } from "../reducers/accounts";

export default (store: any) => (next: any) => (action: any) => {
  const oldState = store.getState();
  const res = next(action);
  const newState = store.getState();
  if (oldState.countervalues !== newState.countervalues) {
    const startTime = Date.now();
    db.save("countervalues", CounterValues.exportSelector(newState)).then(
      () => {
        console.log(
          `countervalues DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
      },
      e => {
        console.error(e);
      },
    );
  }
  if (oldState.settings !== newState.settings) {
    const startTime = Date.now();
    db.save("settings", exportSelector(newState)).then(
      () => {
        console.log(
          `settings DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
      },
      e => {
        console.error(e);
      },
    );
  }
  if (oldState.accounts !== newState.accounts) {
    const startTime = Date.now();
    db.save("accounts", accountsExportSelector(newState)).then(
      () => {
        console.log(
          `accounts DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
      },
      e => {
        console.error(e);
      },
    );
  }
  return res;
};
