import { Action, ReducerMap, handleActions } from "redux-actions";
import type { InViewPayload, InViewSetHasItemsPayload } from "../actions/types";
import { InViewActionTypes } from "../actions/types";
import type { InViewState, State } from "./types";

export const INITIAL_STATE: InViewState = {
  hasItems: false,
};

const handlers: ReducerMap<InViewState, InViewPayload> = {
  [InViewActionTypes.IN_VIEW_SET_HAS_ITEMS]: (state, action) => ({
    ...state,
    hasItems: (action as Action<InViewSetHasItemsPayload>).payload,
  }),
};

export const inViewHasItemsSelector = (state: State) => state.inView.hasItems;

export default handleActions(handlers, INITIAL_STATE);
