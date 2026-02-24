import { handleActions } from "redux-actions";
import type { ReducerMap, Action } from "redux-actions";
import { LargeMoverState, State } from "./types";
import {
  LargeMoverActionTypes,
  LargeMoverImportPayload,
  LargeMoverPayload,
  LargeMoverTutorialPayload,
} from "~/actions/types";

export const LARGE_MOVER_INITIAL_STATE: LargeMoverState = {
  tutorial: true,
};

const handlers: ReducerMap<LargeMoverState, LargeMoverPayload> = {
  [LargeMoverActionTypes.SET_TUTORIAL]: (state, action) => ({
    ...state,
    tutorial: (action as Action<LargeMoverTutorialPayload>).payload,
  }),

  [LargeMoverActionTypes.LARGE_MOVER_IMPORT]: (state, action) => ({
    ...state,
    ...(action as Action<LargeMoverImportPayload>).payload,
  }),
};

export const tutorialSelector = (state: { largeMover: LargeMoverState }) =>
  state.largeMover.tutorial;

export const exportLargeMoverSelector = (s: State) => s.largeMover;

export default handleActions<LargeMoverState, boolean>(handlers, LARGE_MOVER_INITIAL_STATE);
