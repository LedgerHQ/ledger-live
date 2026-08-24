import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppLockState } from "./types";

export const appLockInitialState: AppLockState = {
  hasPassword: false,
  biometricsEnabled: false,
  isLocked: false,
  needsLongerPassword: false,
};

export const appLockSlice = createSlice({
  name: "appLock",
  initialState: appLockInitialState,
  reducers: {
    setHasPassword: (state, action: PayloadAction<boolean>) => {
      state.hasPassword = action.payload;
    },
    setBiometricsEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricsEnabled = action.payload;
    },
    setNeedsLongerPassword: (state, action: PayloadAction<boolean>) => {
      state.needsLongerPassword = action.payload;
    },
    lockApp: state => {
      state.isLocked = true;
    },
    unlockApp: state => {
      state.isLocked = false;
    },
    resetAppLock: () => appLockInitialState,
  },
});

export const {
  setHasPassword,
  setBiometricsEnabled,
  setNeedsLongerPassword,
  lockApp,
  unlockApp,
  resetAppLock,
} = appLockSlice.actions;
