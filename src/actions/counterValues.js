// @flow

import { getDefaultUnitByCoinType } from "@ledgerhq/currencies";
import type { Dispatch } from "redux";
import get from "lodash/get";
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

const twoDigits = (n: number) => (n > 9 ? `${n}` : `0${n}`);
export const formatCounterValueDate = (d: Date) =>
  `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}-${twoDigits(d.getDate())}`;

export const fetchCounterValues: FetchCounterValues = coinType => (
  dispatch,
  getState
) => {
  const { accounts, counterValues, settings } = getState();
  const { counterValue } = settings;

  let coinTypes = [];

  if (!coinType) {
    coinTypes = [...new Set(accounts.map(a => a.coinType))];
  } else {
    coinTypes = [coinType];
  }

  const today = formatCounterValueDate(new Date());

  const fetchCounterValuesByCoinType = coinType => {
    const { code } = getDefaultUnitByCoinType(coinType);
    const todayCounterValues = get(
      counterValues,
      `${code}-${counterValue}.${today}`,
      null
    );

    if (todayCounterValues !== null) {
      return null;
    }
    return fetch(
      `https://min-api.cryptocompare.com/data/histoday?&extraParams=ledger-test&fsym=${code}&tsym=${counterValue}&allData=1`
    )
      .then(r => r.json())
      .then(data => ({
        symbol: `${code}-${counterValue}`,
        values: data.Data.reduce((result, d) => {
          const date = formatCounterValueDate(new Date(d.time * 1000));
          result[date] = d.close; // eslint-disable-line no-param-reassign
          return result;
        }, {})
      }));
  };

  return Promise.all(coinTypes.map(fetchCounterValuesByCoinType)).then(
    result => {
      const newCounterValues = result.reduce((r, v) => {
        if (v !== null) {
          r[v.symbol] = v.values; // eslint-disable-line no-param-reassign
        }
        return r;
      }, {});

      if (Object.keys(newCounterValues).length !== 0) {
        dispatch(updateCounterValues(newCounterValues));
      }
    }
  );
};
