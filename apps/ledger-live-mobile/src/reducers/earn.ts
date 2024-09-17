import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import { createSelector } from "reselect";
import type { EarnState, State } from "./types";
import { EarnActionTypes, EarnPayload, EarnSetInfoModalPayload } from "../actions/types";

export const INITIAL_STATE: EarnState = {
  infoModal: {},
};

const handlers: ReducerMap<EarnState, EarnPayload> = {
  [EarnActionTypes.EARN_INFO_MODAL]: (state, action: Action<EarnSetInfoModalPayload>) => ({
    ...state,
    infoModal: action.payload || {},
  }),
};

const storeSelector = (state: State): EarnState => state.earn;

export const exportSelector = storeSelector;

export default handleActions<EarnState, EarnPayload>(handlers, INITIAL_STATE);

export const earnInfoModalSelector = createSelector(
  storeSelector,
  (state: EarnState) => state.infoModal,
);
