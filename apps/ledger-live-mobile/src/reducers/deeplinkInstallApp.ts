import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { State, DeeplinkInstallAppState } from "./types";

export const INITIAL_STATE: DeeplinkInstallAppState = {
  isDrawerOpen: false,
  appToInstall: null,
};

const deeplinkInstallAppSlice = createSlice({
  name: "deeplinkInstallApp",
  initialState: INITIAL_STATE,
  reducers: {
    openDeeplinkInstallAppDrawer: (state, action: PayloadAction<{ appToInstall: string }>) => {
      state.isDrawerOpen = true;
      state.appToInstall = action.payload.appToInstall;
    },
    closeDeeplinkInstallAppDrawer: state => {
      state.isDrawerOpen = false;
      state.appToInstall = null;
    },
  },
});

export const deeplinkInstallAppDrawerSelector = (state: State): boolean =>
  state.deeplinkInstallApp.isDrawerOpen;

export const deeplinkInstallAppSelector = (state: State): string | null =>
  state.deeplinkInstallApp.appToInstall;

export const { openDeeplinkInstallAppDrawer, closeDeeplinkInstallAppDrawer } =
  deeplinkInstallAppSlice.actions;

export default deeplinkInstallAppSlice.reducer;
