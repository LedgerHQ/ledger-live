import { createAction } from "redux-actions";
import { LaunchScreenActionTypes } from "~/actions/types";

export const setIsAppLoaded = createAction<boolean>(LaunchScreenActionTypes.SET_IS_APP_LOADED);
