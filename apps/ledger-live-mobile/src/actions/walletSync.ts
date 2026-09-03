import { createAction } from "redux-actions";
import { WalletSyncActionTypes } from "./types";
import type {
  WalletSyncSetActivateDrawer,
  WalletSyncSetActivateStep,
  WalletSyncSetManageKeyDrawerPayload,
  WalletSyncSetReturnsToEntryScreen,
} from "./types";

export const setWallectSyncManageKeyDrawer = createAction<WalletSyncSetManageKeyDrawerPayload>(
  WalletSyncActionTypes.WALLET_SYNC_SET_MANAGE_KEY_DRAWER,
);

export const setLedgerSyncActivateDrawer = createAction<WalletSyncSetActivateDrawer>(
  WalletSyncActionTypes.LEDGER_SYNC_SET_ACTIVATE_DRAWER,
);

export const setLedgerSyncActivateStep = createAction<WalletSyncSetActivateStep>(
  WalletSyncActionTypes.LEDGER_SYNC_SET_ACTIVATE_STEP,
);

export const setLedgerSyncReturnsToEntryScreen = createAction<WalletSyncSetReturnsToEntryScreen>(
  WalletSyncActionTypes.LEDGER_SYNC_SET_RETURNS_TO_ENTRY_SCREEN,
);
