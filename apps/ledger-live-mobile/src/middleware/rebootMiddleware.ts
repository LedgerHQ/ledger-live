import { clearDb } from "../db";
import { wipeCountervalues } from "../actions/countervalues";
import { ActionsPayload, AppStateActionTypes, AppStateRebootPayload } from "../actions/types";
import SplashScreen from "react-native-splash-screen";
import { Middleware } from "redux";
import { AppStore } from "~/reducers";

const isRebootAction = (
  action: ActionsPayload,
): action is { type: string; payload: AppStateRebootPayload } => {
  return action.type === AppStateActionTypes.INCREMENT_REBOOT_ID;
};

export const rebootMiddleware: Middleware<object, AppStore> = store => next => async action => {
  const result = next(action);

  if (isRebootAction(action)) {
    const { resetData = false, showSplashScreen: shouldShowSplash = true } = action.payload || {};

    if (shouldShowSplash) {
      SplashScreen.show();
    }

    if (resetData) {
      const wipeAction = wipeCountervalues();
      store.dispatch({ type: wipeAction.type });

      try {
        await clearDb();
      } catch (error) {
        console.error("Failed to clear database during reboot:", error);
      }
    }
  }

  return result;
};
