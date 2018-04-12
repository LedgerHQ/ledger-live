// @flow
import merge from "lodash/merge";
import {
  fetchHistodayRates,
  fetchCurrentRates
} from "@ledgerhq/wallet-common/lib/api/countervalue";
import type { Dispatch } from "redux";
import { fiatUnitSelector } from "../reducers/settings";
import type { State } from "../reducers";
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

type PollRates = () => (Dispatch<*>, () => State) => Promise<*>;

// TODO pollRates will be abstracted out in wallet-common
// because it will implement our draft proposal for the next API
export const pollRates: PollRates = () => async (dispatch, getState) => {
  const state = getState();
  const { accounts, counterValues } = state;
  const fiatUnit = fiatUnitSelector(state);
  const currencies = [...new Set(accounts.map(a => a.currency))];
  const getLatestDayFetched = cur => {
    const all = {
      ...(counterValues[cur.ticker] || {})[fiatUnit.ticker]
    };
    delete all.latest;
    const latestDay = Object.keys(all).sort((a, b) => (a < b ? 1 : -1))[0];
    return latestDay;
  };
  // NB in the future, this will be one API call:
  const hist = await fetchHistodayRates(
    currencies,
    fiatUnit,
    getLatestDayFetched
  );
  const cur = await fetchCurrentRates(currencies, fiatUnit);
  const all = merge({}, hist, cur);
  dispatch(updateCounterValues(all));
};
