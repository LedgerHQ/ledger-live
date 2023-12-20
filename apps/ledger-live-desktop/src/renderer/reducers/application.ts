import { handleActions } from "redux-actions";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import { LanguageIds } from "~/config/languages";
import { LangAndRegion } from "~/renderer/reducers/settings";
import { Handlers } from "./types";
export type ApplicationState = {
  isLocked?: boolean;
  hasPassword?: boolean;
  osDarkMode?: boolean;
  osLanguage?: LangAndRegion;
  navigationLocked?: boolean;
  debug: {
    alwaysShowSkeletons: boolean;
  };
};
const { language, region } = getParsedSystemLocale();
const osLangSupported = LanguageIds.includes(language);
const state: ApplicationState = {
  osDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  osLanguage: {
    language: osLangSupported && language != null ? language : "en",
    region: osLangSupported ? region : "US",
    useSystem: true,
  },
  hasPassword: false,
  debug: {
    alwaysShowSkeletons: false,
  },
};

type HandlersPayloads = {
  APPLICATION_SET_DATA: Partial<ApplicationState>;
};
type ApplicationHandlers<PreciseKey = true> = Handlers<
  ApplicationState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: ApplicationHandlers = {
  APPLICATION_SET_DATA: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
};

// NOTE: V2 `lock` and `unlock` have been moved to actions/application.js

// Selectors

export const isLocked = (state: { application: ApplicationState }) =>
  state.application.isLocked === true;
export const hasPasswordSelector = (state: { application: ApplicationState }) =>
  state.application.hasPassword === true;
export const osDarkModeSelector = (state: { application: ApplicationState }) =>
  state.application.osDarkMode;
export const alwaysShowSkeletonsSelector = (state: { application: ApplicationState }) =>
  state.application.debug.alwaysShowSkeletons;
export const osLangAndRegionSelector = (state: { application: ApplicationState }) =>
  state.application.osLanguage;
export const isNavigationLocked = (state: { application: ApplicationState }) =>
  state.application.navigationLocked;

// Exporting reducer

export default handleActions<ApplicationState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as ApplicationHandlers<false>,
  state,
);
