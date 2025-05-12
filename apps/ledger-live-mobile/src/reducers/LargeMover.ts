import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";

export type LargeMoverState = {
  tutorial: boolean;
};

export enum LargeMoverActionTypes {
  SET_TUTORIAL = "LARGE_MOVER/SET_TUTORIAL",
}

export const LARGE_MOVER_INITIAL_STATE: LargeMoverState = {
  tutorial: true,
};

const handlers: ReducerMap<LargeMoverState, LargeMoverState> = {
  [LargeMoverActionTypes.SET_TUTORIAL]: (state, action) => ({
    tutorial: (action as Action<LargeMoverState>).payload?.tutorial,
  }),
};

export const tutorialSelector = (state: { largeMover: LargeMoverState }) =>
  state.largeMover.tutorial;

export default handleActions<LargeMoverState, LargeMoverState>(handlers, LARGE_MOVER_INITIAL_STATE);
