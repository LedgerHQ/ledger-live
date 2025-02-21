import type { Action, ReducerMap } from "redux-actions";
import { handleActions } from "redux-actions";
import { createSelector } from "reselect";
import {
  EarnActionTypes,
  EarnPayload,
  EarnSetInfoModalPayload,
  EarnSetMenuModalPayload,
} from "../actions/types";
import type { EarnState, State } from "./types";

export const INITIAL_STATE: EarnState = {
  infoModal: {},
  menuModal: undefined,
};

const handlers: ReducerMap<EarnState, EarnPayload> = {
  [EarnActionTypes.EARN_INFO_MODAL]: (state, action): EarnState => ({
    ...state,
    infoModal: (action as Action<EarnSetInfoModalPayload>).payload ?? {},
  }),
  [EarnActionTypes.EARN_MENU_MODAL]: (state, action): EarnState => ({
    ...state,
    menuModal: (action as Action<EarnSetMenuModalPayload>).payload,
  }),
};

const storeSelector = (state: State): EarnState => state.earn;

export const exportSelector = storeSelector;

export default handleActions<EarnState, EarnPayload>(handlers, INITIAL_STATE);

export const earnInfoModalSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.infoModal,
);

export const earnMenuModalSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.menuModal,
);
