// @flow

import { handleActions } from "redux-actions";
import type { Currency, Unit } from "@ledgerhq/currencies";
import type { State } from ".";
import { formatCounterValueDate } from "../actions/counterValues";

export type CounterValuesState = {};

const state: CounterValuesState = {};

const handlers = {
  UPDATE_COUNTER_VALUES: (
    state: CounterValuesState,
    { payload: counterValues }: { payload: CounterValuesState }
  ): CounterValuesState => ({
    ...state,
    ...counterValues
  })
};

type CalculateCounterValueSelector = State => (
  currency: Currency,
  fiatUnit: Unit
) => (value: number, date?: Date) => number;

export const calculateCounterValueSelector: CalculateCounterValueSelector = state => (
  currency,
  fiatUnit
) => {
  const byDate =
    state.counterValues[`${currency.units[0].code}-${fiatUnit.code}`];
  return (value, date = new Date()) => {
    const countervalue = byDate[formatCounterValueDate(date)];
    if (!countervalue) return 0;
    return Math.round(
      value *
        countervalue *
        10 ** (fiatUnit.magnitude - currency.units[0].magnitude)
    );
  };
};

export default handleActions(handlers, state);
