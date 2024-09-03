import { createAction } from "redux-actions";
import { WalletSyncActionTypes } from "./types";
import type { WalletSyncSetActivateDrawer, WalletSyncSetManageKeyDrawerPayload } from "./types";

export const setWallectSyncManageKeyDrawer = createAction<WalletSyncSetManageKeyDrawerPayload>(
  WalletSyncActionTypes.WALLET_SYNC_SET_MANAGE_KEY_DRAWER,
);

export const setLedgerSyncActivateDrawer = createAction<WalletSyncSetActivateDrawer>(
  WalletSyncActionTypes.LEDGER_SYNC_SET_ACTIVATE_DRAWER,
);
