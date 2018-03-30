// @flow
import { handleActions } from "redux-actions";
import {
  makeCalculateCounterValue,
  makeReverseCounterValue,
  formatCounterValueDay,
  makeGetCounterValue
} from "@ledgerhq/wallet-common/lib/helpers/countervalue";
import get from "lodash/get";
import merge from "lodash/merge";
import type {
  CalculateCounterValue,
  GetCounterValue
} from "@ledgerhq/wallet-common/lib/types";
import type { State } from ".";

export type CounterValuesState = {};

const state: CounterValuesState = {};

const handlers = {
  UPDATE_COUNTER_VALUES: (
    state: CounterValuesState,
    { payload: counterValues }: { payload: CounterValuesState }
  ): CounterValuesState => merge({ ...state }, counterValues)
};

const getPairHistory = state => (coinTicker, fiat) => {
  const byDate = get(state, `counterValues.${coinTicker}.${fiat}`);
  return date =>
    (byDate &&
      ((date && byDate[formatCounterValueDay(date)]) || byDate.latest)) ||
    0;
};

export const getCounterValueSelector = (state: State): GetCounterValue =>
  makeGetCounterValue(getPairHistory(state));

export const calculateCounterValueSelector = (
  state: State
): CalculateCounterValue => makeCalculateCounterValue(getPairHistory(state));

export const reverseCounterValueSelector = (
  state: State
): CalculateCounterValue => makeReverseCounterValue(getPairHistory(state));

export default handleActions(handlers, state);
