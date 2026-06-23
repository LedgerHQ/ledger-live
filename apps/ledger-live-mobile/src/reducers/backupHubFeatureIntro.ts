import { createSlice } from "@reduxjs/toolkit";

export type BackupHubFeatureIntroState = {
  isOpen: boolean;
  /** Incremented when `ledgerlive://backup-hub` is handled so the drawer can open after navigation to Portfolio. */
  deeplinkNonce: number;
};

const initialState: BackupHubFeatureIntroState = {
  isOpen: false,
  deeplinkNonce: 0,
};

const backupHubFeatureIntroSlice = createSlice({
  name: "backupHubFeatureIntro",
  initialState,
  reducers: {
    openBackupHubFeatureIntro: state => {
      state.isOpen = true;
    },
    closeBackupHubFeatureIntro: state => {
      state.isOpen = false;
    },
    tickBackupHubFeatureIntroDeeplink: state => {
      state.deeplinkNonce += 1;
    },
  },
  selectors: {
    selectIsBackupHubFeatureIntroOpen: state => state.isOpen,
    selectBackupHubFeatureIntroDeeplinkNonce: state => state.deeplinkNonce,
  },
});

export const {
  openBackupHubFeatureIntro,
  closeBackupHubFeatureIntro,
  tickBackupHubFeatureIntroDeeplink,
} = backupHubFeatureIntroSlice.actions;

export const { selectIsBackupHubFeatureIntroOpen, selectBackupHubFeatureIntroDeeplinkNonce } =
  backupHubFeatureIntroSlice.selectors;

export default backupHubFeatureIntroSlice.reducer;
