import { appConfigSlice } from "./internals/slice";
import type { AppConfigState } from "./types";

type AppConfigRootState = { readonly appConfig: AppConfigState };

/** Reducer of the `appConfig` slice: register it under `state.appConfig`. */
export const appConfigReducer = appConfigSlice.reducer;

/** Saves an option of a declared switch, which the next session resolves to. Nothing reloads. */
export const selectAppConfigOption = appConfigSlice.actions.selectOption;

/** Removes the saved option of a declared switch: the next session follows the default. */
export const resetAppConfigSwitch = appConfigSlice.actions.resetSwitch;

/** What the configuration of this session was resolved from, or `null` until the middleware sets it. */
export const appConfigSessionSelector = (state: AppConfigRootState) => state.appConfig.session;

/** The option id saved for each switch, which the next session resolves from. */
export const appConfigSavedSelectionsSelector = (state: AppConfigRootState) =>
  state.appConfig.savedSelections;
