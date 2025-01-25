import { createAction } from "redux-actions";
import { WalletSyncActionTypes } from "./types";
import type {
  WalletSyncSetActivateDrawer,
  WalletSyncSetActivateStep,
  WalletSyncSetManageKeyDrawerPayload,
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
