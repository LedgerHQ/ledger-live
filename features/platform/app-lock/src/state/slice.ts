import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppLockState } from "./types";

export const appLockInitialState: AppLockState = {
  hasPassword: false,
  biometricsEnabled: false,
  isLocked: false,
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
    lockApp: state => {
      state.isLocked = true;
    },
    unlockApp: state => {
      state.isLocked = false;
    },
    resetAppLock: () => appLockInitialState,
  },
});

export const { setHasPassword, setBiometricsEnabled, lockApp, unlockApp, resetAppLock } =
  appLockSlice.actions;
