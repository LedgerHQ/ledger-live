import { handleActions } from "redux-actions";
import type { ReducerMap } from "redux-actions";

export type LargeMoverState = {
  tutorial: boolean;
};

export enum LargeMoverActionTypes {
  SET_TUTORIAL = "LARGE_MOVER/SET_TUTORIAL",
}

export const LARGE_MOVER_INITIAL_STATE: LargeMoverState = {
  tutorial: true,
};

const handlers: ReducerMap<LargeMoverState, boolean> = {
  [LargeMoverActionTypes.SET_TUTORIAL]: (_state, action) => ({
    tutorial: action.payload,
  }),
};

export const tutorialSelector = (state: { largeMover: LargeMoverState }) =>
  state.largeMover.tutorial;

export default handleActions<LargeMoverState, boolean>(handlers, LARGE_MOVER_INITIAL_STATE);
