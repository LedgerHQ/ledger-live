// @flow
import {
  fetchHistodayRates,
  fetchCurrentRates
} from "@ledgerhq/wallet-common/lib/api/countervalue";
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

export type FetchCounterValuesHist = (
  ?number
) => (Dispatch<*>, Function) => Promise<any>;

export const fetchCounterValuesHist: FetchCounterValuesHist = () => async (
  dispatch,
  getState
) => {
  const { accounts, settings } = getState();
  const { counterValue } = settings;
  const currencies = [...new Set(accounts.map(a => a.currency))];

  const res = await fetchHistodayRates(currencies, getFiatUnit(counterValue));
  if (Object.keys(res).length !== 0) {
    dispatch(updateCounterValues(res));
  }
  return res;
};

export type FetchCounterValuesLatest = () => (Dispatch<*>, Function) => void;

export const fetchCounterValuesLatest: FetchCounterValuesLatest = () => (
  dispatch,
  getState
) => {
  const { accounts, settings } = getState();
  const { counterValue } = settings;
  const currencies = [...new Set(accounts.map(a => a.currency))];
  fetchCurrentRates(currencies, getFiatUnit(counterValue)).then(data => {
    dispatch(updateCounterValues(data));
  });
};
