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
        /* eslint-disable no-console */
        console.log(
          `countervalues DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
        /* eslint-enable no-console */
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
        /* eslint-disable no-console */
        console.log(
          `settings DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
        /* eslint-enable no-console */
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
        /* eslint-disable no-console */
        console.log(
          `accounts DB saved in ${(Date.now() - startTime).toFixed(0)} ms`,
        );
        /* eslint-enable no-console */
      },
      e => {
        console.error(e);
      },
    );
  }
  return res;
};
