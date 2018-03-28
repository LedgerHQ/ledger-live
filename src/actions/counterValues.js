// @flow
import { fetchHistodayCounterValuesMultiple } from "@ledgerhq/wallet-common/lib/api/countervalue";
import { getFiatUnit } from "@ledgerhq/currencies";
import type { Dispatch } from "redux";
import db from "../db";

export type InitCounterValues = () => (Dispatch<*>) => Promise<void>;
export const initCounterValues: InitCounterValues = () => async dispatch => {
  const payload = (await db.get("countervalues")) || {};
  dispatch({
    type: "UPDATE_COUNTER_VALUES",
    payload
  });
};

export type UpdateCounterValues = Object => { type: string, payload: Object };
export const updateCounterValues: UpdateCounterValues = payload => ({
  type: "DB:UPDATE_COUNTER_VALUES",
  payload
});

export type FetchCounterValues = (
  ?number
) => (Dispatch<*>, Function) => Promise<any>;

export const fetchCounterValues: FetchCounterValues = () => async (
  dispatch,
  getState
) => {
  const { accounts, settings } = getState();
  const { counterValue } = settings;
  const currencies = [...new Set(accounts.map(a => a.currency))];
  const res = await fetchHistodayCounterValuesMultiple(
    currencies,
    getFiatUnit(counterValue)
  );
  if (Object.keys(res).length !== 0) {
    dispatch(updateCounterValues(res));
  }
  return res;
};
