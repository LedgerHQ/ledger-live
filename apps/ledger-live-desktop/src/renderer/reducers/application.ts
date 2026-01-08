import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getParsedSystemLocale } from "~/helpers/systemLocale";
import { LanguageIdsNotFeatureFlagged } from "~/config/languages";
import { LangAndRegion } from "~/renderer/reducers/settings";

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
const osLangSupported = LanguageIdsNotFeatureFlagged.includes(language);

const initialState: ApplicationState = {
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

const applicationSlice = createSlice({
  name: "application",
  initialState,
  reducers: {
    unlock: state => {
      state.isLocked = false;
      state.hasPassword = true;
    },
    lock: state => {
      state.isLocked = true;
      state.hasPassword = true;
    },
    setHasPassword: (state, action: PayloadAction<boolean | undefined>) => {
      state.hasPassword = action.payload;
    },
    setOSDarkMode: (state, action: PayloadAction<boolean | undefined>) => {
      state.osDarkMode = action.payload;
    },
    setNavigationLock: (state, action: PayloadAction<boolean | undefined>) => {
      state.navigationLocked = action.payload;
    },
    toggleSkeletonVisibility: (state, action: PayloadAction<boolean>) => {
      state.debug.alwaysShowSkeletons = action.payload;
    },
  },
});

export const {
  unlock,
  lock,
  setHasPassword,
  setOSDarkMode,
  setNavigationLock,
  toggleSkeletonVisibility,
} = applicationSlice.actions;

export const isLocked = (state: { application: ApplicationState }) =>
  state.application.isLocked === true;
export const hasPasswordSelector = (state: { application: ApplicationState }) =>
  state.application.hasPassword === true;
export const osDarkModeSelector = (state: { application: ApplicationState }) =>
  state.application.osDarkMode;
export const alwaysShowSkeletonsSelector = (state: { application: ApplicationState }) =>
  state.application.debug.alwaysShowSkeletons;
export const isNavigationLocked = (state: { application: ApplicationState }) =>
  state.application.navigationLocked;

export default applicationSlice.reducer;
