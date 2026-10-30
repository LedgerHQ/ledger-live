import { appConfigSlice } from "./internals/slice";
import type { AppConfigState } from "./types";

type AppConfigRootState = { readonly appConfig: AppConfigState };

/** Reducer of the `appConfig` slice: register it under `state.appConfig`. */
export const appConfigReducer = appConfigSlice.reducer;

/**
 * Saves what a switch or a fixed value selects, which the next session resolves to: an option of a
 * switch, or `dev` where the build accepts dev values. Nothing reloads.
 */
export const selectAppConfigOption = appConfigSlice.actions.selectOption;

/** Removes the saved selection of a switch or a fixed value: the next session follows the default. */
export const resetAppConfigSelection = appConfigSlice.actions.resetSelection;

/** Saves the dev value of a value, once the middleware has parsed it. Nothing reloads. */
export const setAppConfigDevValue = appConfigSlice.actions.setDevValue;

/** Removes the dev value of a value: on Dev, the next session runs on its base value. */
export const removeAppConfigDevValue = appConfigSlice.actions.removeDevValue;

/** What the configuration of this session was resolved from, or `null` until the middleware sets it. */
export const appConfigSessionSelector = (state: AppConfigRootState) => state.appConfig.session;

/** The selection of each switch and fixed value, which the next session resolves from. */
export const appConfigSavedSelectionsSelector = (state: AppConfigRootState) =>
  state.appConfig.savedSelections;

/** The dev values the next session resolves from. */
export const appConfigSavedDevValuesSelector = (state: AppConfigRootState) =>
  state.appConfig.savedDevValues;

/** The last dev value of each value that the middleware refused to save, and why. */
export const appConfigDevValueErrorsSelector = (state: AppConfigRootState) =>
  state.appConfig.devValueErrors;
