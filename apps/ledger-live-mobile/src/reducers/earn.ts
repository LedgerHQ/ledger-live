import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import { createSelector } from "reselect";
import type { EarnState, State } from "./types";
import {
  EarnActionTypes,
  EarnPayload,
  EarnSetInfoModalPayload,
  EarnSetIsDeeplinkingPayload,
} from "../actions/types";

export const INITIAL_STATE: EarnState = {
  infoModal: {},
  isDeepLinking: false,
};

const handlers: ReducerMap<EarnState, EarnPayload> = {
  [EarnActionTypes.EARN_INFO_MODAL]: (state, action) => ({
    ...state,
    isDeepLinking: true,
    infoModal: (action as Action<EarnSetInfoModalPayload>)?.payload || {},
  }),
  /** Prevents deep links from triggering privacy lock. */
  [EarnActionTypes.SET_IS_DEEP_LINKING]: (state, action) => ({
    ...state,
    isDeepLinking: (action as Action<EarnSetIsDeeplinkingPayload>)?.payload || false,
  }),
};

const storeSelector = (state: State): EarnState => state.earn;

export const exportSelector = storeSelector;

export default handleActions<EarnState, EarnPayload>(handlers, INITIAL_STATE);

export const earnInfoModalSelector = createSelector(storeSelector, (state: EarnState) => {
  return state.infoModal;
});

export const isDeepLinkingSelector = createSelector(storeSelector, (state: EarnState) => {
  return state.isDeepLinking;
});
