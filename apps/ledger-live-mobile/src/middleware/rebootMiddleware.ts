import { ActionsPayload, AppStateActionTypes } from "../actions/types";
import SplashScreen from "react-native-splash-screen";
import { Middleware } from "redux";
import { AppStore } from "~/reducers";

const isRebootAction = (action: ActionsPayload): boolean => {
  return action.type === AppStateActionTypes.INCREMENT_REBOOT_ID;
};

export const rebootMiddleware: Middleware<object, AppStore> = _store => next => async action => {
  const result = next(action);

  if (isRebootAction(action)) {
    SplashScreen.show();
  }

  return result;
};
