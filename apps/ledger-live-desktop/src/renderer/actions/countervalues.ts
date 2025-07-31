import { Action, ActionFunctionAny, createAction } from "redux-actions";
import { CountervaluesHandlersKey, CountervaluesHandlersPayloads } from "../reducers/types";

const createCountervaluesAction = <
  T extends CountervaluesHandlersKey,
  P extends CountervaluesHandlersPayloads[T],
>(
  type: T,
): ActionFunctionAny<Action<CountervaluesHandlersPayloads[T]>> => createAction<P>(type);

export const countervaluesActions = {
  COUNTERVALUES_MARKETCAP_SET_ERROR: createCountervaluesAction("COUNTERVALUES_MARKETCAP_SET_ERROR"),
  COUNTERVALUES_MARKETCAP_SET_IDS: createCountervaluesAction("COUNTERVALUES_MARKETCAP_SET_IDS"),
  COUNTERVALUES_MARKETCAP_SET_LOADING: createCountervaluesAction(
    "COUNTERVALUES_MARKETCAP_SET_LOADING",
  ),
  COUNTERVALUES_POLLING_SET_IS_POLLING: createCountervaluesAction(
    "COUNTERVALUES_POLLING_SET_IS_POLLING",
  ),
  COUNTERVALUES_POLLING_SET_TRIGGER_LOAD: createCountervaluesAction(
    "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD",
  ),
  COUNTERVALUES_STATE_SET_ERROR: createCountervaluesAction("COUNTERVALUES_STATE_SET_ERROR"),
  COUNTERVALUES_STATE_SET_PENDING: createCountervaluesAction("COUNTERVALUES_STATE_SET_PENDING"),
  COUNTERVALUES_STATE_SET: createCountervaluesAction("COUNTERVALUES_STATE_SET"),
  COUNTERVALUES_WIPE: createCountervaluesAction("COUNTERVALUES_WIPE"),
} satisfies Record<
  CountervaluesHandlersKey,
  ActionFunctionAny<Action<CountervaluesHandlersPayloads[CountervaluesHandlersKey]>>
>;
