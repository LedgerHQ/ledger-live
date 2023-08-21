/* eslint-disable consistent-return */
import { Middleware } from "redux";
import { setKey } from "~/renderer/storage";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { actionTypePrefix as postOnboardingActionTypePrefix } from "@ledgerhq/live-common/postOnboarding/actions";
import { accountsSelector } from "./../reducers/accounts";
import { settingsExportSelector, areSettingsLoaded } from "./../reducers/settings";
import { State } from "../reducers";
let DB_MIDDLEWARE_ENABLED = true;

// ability to temporary disable the db middleware from outside
export const disable = (ms = 1000) => {
  DB_MIDDLEWARE_ENABLED = false;
  setTimeout(() => (DB_MIDDLEWARE_ENABLED = true), ms);
};

const DBMiddleware: Middleware<{}, State> = store => next => action => {
  if (DB_MIDDLEWARE_ENABLED && action.type.startsWith("DB:")) {
    const [, type] = action.type.split(":");
    store.dispatch({
      type,
      payload: action.payload,
    });
    const state = store.getState();
    setKey("app", "accounts", accountsSelector(state));
    // ^ TODO ultimately we'll do same for accounts to drop DB: pattern
  } else if (DB_MIDDLEWARE_ENABLED && action.type.startsWith(postOnboardingActionTypePrefix)) {
    next(action);
    const state = store.getState();
    setKey("app", "postOnboarding", postOnboardingSelector(state));
  } else {
    const oldState = store.getState();
    const res = next(action);
    const newState = store.getState();
    // NB Prevent write attempts when the app is locked.
    if (!oldState.application.isLocked || action.type === "APPLICATION_SET_DATA") {
      if (areSettingsLoaded(newState) && oldState.settings !== newState.settings) {
        setKey("app", "settings", settingsExportSelector(newState));
      }
    }
    return res;
  }
};

export default DBMiddleware;
