// @flow

import { handleActions } from "redux-actions";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import { getLanguages } from "~/config/languages";
import type { LangAndRegion } from "~/renderer/reducers/settings";

export type ApplicationState = {
  isLocked?: boolean,
  hasPassword?: boolean,
  dismissedCarousel?: boolean,
  osDarkMode?: boolean,
  osLanguage?: LangAndRegion,
  navigationLocked?: boolean,
  notSeededDeviceRelaunch?: boolean,
  debug: {
    alwaysShowSkeletons: boolean,
  },
  onboardingRelaunched: boolean,
};

const { language, region } = getParsedSystemLocale();
const languages = getLanguages();
const osLangSupported = languages.includes(language);

const state: ApplicationState = {
  osDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  osLanguage: {
    language: osLangSupported && language != null ? language : "en",
    region: osLangSupported ? region : "US",
    useSystem: true,
  },
  hasPassword: false,
  dismissedCarousel: false,
  notSeededDeviceRelaunch: false,
  debug: {
    alwaysShowSkeletons: false,
  },
  onboardingRelaunched: false,
};

const handlers = {
  APPLICATION_SET_DATA: (state, { payload }: { payload: ApplicationState }) => ({
    ...state,
    ...payload,
  }),
  RELAUNCH_ONBOARDING: (
    state: ApplicationState,
    { payload: onboardingRelaunched }: { payload: boolean },
  ) => {
    return {
      ...state,
      onboardingRelaunched,
    };
  },
};

// NOTE: V2 `lock` and `unlock` have been moved to actions/application.js

// Selectors

export const isLocked = (state: { application: ApplicationState }) =>
  state.application.isLocked === true;

export const hasPasswordSelector = (state: { application: ApplicationState }) =>
  state.application.hasPassword === true;

export const hasDismissedCarouselSelector = (state: { application: ApplicationState }) =>
  state.application.dismissedCarousel === true;

export const osDarkModeSelector = (state: { application: ApplicationState }) =>
  state.application.osDarkMode;

export const alwaysShowSkeletonsSelector = (state: { application: ApplicationState }) =>
  state.application.debug.alwaysShowSkeletons;

export const osLangAndRegionSelector = (state: { application: ApplicationState }) =>
  state.application.osLanguage;

export const notSeededDeviceRelaunchSelector = (state: { application: ApplicationState }) =>
  state.application.notSeededDeviceRelaunch;

export const onboardingRelaunchedSelector = (state: { application: ApplicationState }) =>
  state.application.onboardingRelaunched;

export const isNavigationLocked = (state: { application: ApplicationState }) =>
  state.application.navigationLocked;

// Exporting reducer

export default handleActions(handlers, state);
