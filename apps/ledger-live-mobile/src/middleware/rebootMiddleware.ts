import { Middleware } from "@reduxjs/toolkit";
import { AppStateActionTypes } from "../actions/types";
import SplashScreen from "react-native-splash-screen";
import { State } from "~/reducers/types";

const isRebootAction = (action: unknown): boolean => {
  if (action && typeof action === "object" && "type" in action) {
    return action.type === AppStateActionTypes.INCREMENT_REBOOT_ID;
  }

  return false;
};

export const rebootMiddleware: Middleware<object, State> = _store => next => async action => {
  const result = next(action);

  // Display splash screen whenever reboot ID is incremented
  if (isRebootAction(action)) {
    SplashScreen.show(); // on iOS it seems to not be exposed
  }

  return result;
};
