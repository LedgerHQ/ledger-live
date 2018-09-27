// @flow

import { handleActions } from "redux-actions";

export type ApplicationState = {
  isLocked?: boolean,
};

const INITIAL_STATE: ApplicationState = {
  isLocked: false,
};
const handlers = {
  APPLICATION_SET_DATA: (
    state,
    { payload }: { payload: ApplicationState },
  ) => ({
    ...state,
    ...payload,
  }),
};

export const isLockedSelector = (state: Object) =>
  state.application.isLocked === true;

export default handleActions(handlers, INITIAL_STATE);
