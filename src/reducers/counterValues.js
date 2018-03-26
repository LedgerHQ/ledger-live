// @flow
import { handleActions } from "redux-actions";
import {
  makeCalculateCounterValue,
  formatCounterValueDay
} from "@ledgerhq/wallet-common/lib/helpers/countervalue";
import get from "lodash/get";
import merge from "lodash/merge";
import type { CalculateCounterValue } from "@ledgerhq/wallet-common/lib/types";
import type { State } from ".";

export type CounterValuesState = {};

const state: CounterValuesState = {};

const handlers = {
  UPDATE_COUNTER_VALUES: (
    state: CounterValuesState,
    { payload: counterValues }: { payload: CounterValuesState }
  ): CounterValuesState => merge(state, counterValues)
};

export const calculateCounterValueSelector = (
  state: State
): CalculateCounterValue =>
  makeCalculateCounterValue((coinTicker, fiat) => date => {
    const d = date || new Date(); // TODO later, we need instead to branch the lookup to pick from latest value
    const byDate = get(state, `counterValues.${coinTicker}.${fiat}`);
    return (byDate && byDate[formatCounterValueDay(d)]) || 0;
  });

export default handleActions(handlers, state);
