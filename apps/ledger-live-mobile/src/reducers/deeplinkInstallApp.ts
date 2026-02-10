import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { State, DeeplinkInstallAppState } from "./types";

export const INITIAL_STATE: DeeplinkInstallAppState = {
  isDrawerOpen: false,
  appToInstall: null,
  selectedDevice: null,
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
    setSelectedDevice: (state, action: PayloadAction<Device | null>) => {
      state.selectedDevice = action.payload;
    },
  },
});

export const deeplinkInstallAppDrawerSelector = (state: State): boolean =>
  state.deeplinkInstallApp.isDrawerOpen;

export const deeplinkInstallAppSelector = (state: State): string | null =>
  state.deeplinkInstallApp.appToInstall;

export const selectSelectedDevice = (state: State): Device | null =>
  state.deeplinkInstallApp.selectedDevice;

export const {
  openDeeplinkInstallAppDrawer,
  closeDeeplinkInstallAppDrawer,
  setSelectedDevice,
} = deeplinkInstallAppSlice.actions;

export default deeplinkInstallAppSlice.reducer;
