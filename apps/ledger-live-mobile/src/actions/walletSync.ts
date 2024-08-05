import { createAction } from "redux-actions";
import { WalletSyncActionTypes } from "./types";
import type { WalletSyncSetManageKeyDrawerPayload } from "./types";

export const setWallectSyncManageKeyDrawer = createAction<WalletSyncSetManageKeyDrawerPayload>(
  WalletSyncActionTypes.WALLET_SYNC_SET_MANAGE_KEY_DRAWER,
);
