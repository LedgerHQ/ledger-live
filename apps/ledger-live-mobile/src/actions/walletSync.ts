import { createAction } from "redux-actions";
import { WalletSyncActionTypes } from "./types";
import type { WalletSyncSetManageKeyDrawerPayload } from "./types";

export const setWallectSyncManageKeyDrawer = createAction<WalletSyncSetManageKeyDrawerPayload>(
  WalletSyncActionTypes.WALLET_SYNC_SET_MANAGE_KEY_DRAWER,
);

export const setWalletSyncQrCodeUrl = createAction<string>(
  WalletSyncActionTypes.WALLET_SYNC_CHANGE_QRCODE_URL,
);

export const setWalletSyncQrCodePinCode = createAction<string>(
  WalletSyncActionTypes.WALLET_SYNC_CHANGE_QRCODE_PINCODE,
);
