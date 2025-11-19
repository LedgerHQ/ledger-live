import { Action, ReducerMap, handleActions } from "redux-actions";
import { LaunchScreenActionTypes } from "~/actions/types";
import { LaunchScreenState, LaunchScreenPayload } from "./types";

export const INITIAL_STATE: LaunchScreenState = {
  isAppLoaded: false,
};

const handlers: ReducerMap<LaunchScreenState, LaunchScreenPayload> = {
  [LaunchScreenActionTypes.SET_IS_APP_LOADED]: (state, action) => {
    const payload = (action as Action<LaunchScreenPayload>).payload;
    return {
      ...state,
      isAppLoaded: payload,
    };
  },
};

export default handleActions<LaunchScreenState, LaunchScreenPayload>(handlers, INITIAL_STATE);
