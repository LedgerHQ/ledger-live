import { Middleware } from "@reduxjs/toolkit";
import { AppStateActionTypes } from "../actions/types";
import { wipeCountervalues } from "../actions/countervalues";
import SplashScreen from "react-native-splash-screen";
import { State } from "~/reducers/types";

const isRebootAction = (action: unknown): boolean => {
  if (action && typeof action === "object" && "type" in action) {
    return action.type === AppStateActionTypes.INCREMENT_REBOOT_ID;
  }

  return false;
};

export const rebootMiddleware: Middleware<object, State> = store => next => async action => {
  const result = next(action);

  if (isRebootAction(action)) {
    SplashScreen.show(); // on iOS it seems to not be exposed
    // Dispatched in the same synchronous tick as the reboot so React batches both
    // into one commit: the RebootProvider key change unmounts the subtree before
    // any CounterValue consumer re-renders against the wiped state, which would
    // otherwise trigger a Fabric "child already has a parent" crash.
    store.dispatch(wipeCountervalues());
  }

  return result;
};
