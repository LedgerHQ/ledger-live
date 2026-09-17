import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { isAppLockConfigured } from "./authenticationType";
import type { AppLockState } from "./types";

// A lock with nothing left to open it: a removal can land after a background lock, and the unlock
// screen would then hold the user against a verifier that no longer exists.
function releaseLockIfUnprotected(state: AppLockState) {
  if (!isAppLockConfigured(state)) {
    state.isLocked = false;
  }
}

export const appLockInitialState: AppLockState = {
  isHydrated: false,
  hasPassword: false,
  biometricsEnabled: false,
  isLocked: false,
};

export const appLockSlice = createSlice({
  name: "appLock",
  initialState: appLockInitialState,
  reducers: {
    setHasPassword: (state, action: PayloadAction<boolean>) => {
      // Counts as hydrated: a setup beating the boot read is the newer truth.
      state.isHydrated = true;
      state.hasPassword = action.payload;
      releaseLockIfUnprotected(state);
    },
    // Ignored once hydrated: a read that resolves after a setup must not undo it.
    hydrateAppLock: (state, action: PayloadAction<boolean>) => {
      if (state.isHydrated) {
        return;
      }

      state.isHydrated = true;
      state.hasPassword = action.payload;
    },
    setBiometricsEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricsEnabled = action.payload;
      releaseLockIfUnprotected(state);
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
  hydrateAppLock,
  setBiometricsEnabled,
  lockApp,
  unlockApp,
  resetAppLock,
} = appLockSlice.actions;
