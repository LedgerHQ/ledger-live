import { StoredWalletSyncUserState } from "@ledgerhq/live-wallet/store";

export const setWalletSyncUserState = (payload: StoredWalletSyncUserState) => ({
  type: "SET_WALLET_SYNC_USER_STATE",
  payload,
});

export const setWalletSyncPending = (pending: boolean) => ({
  type: "SET_WALLET_SYNC_PENDING",
  payload: pending,
});

export const setWalletSyncError = (error: Error | null) => ({
  type: "SET_WALLET_SYNC_ERROR",
  payload: error,
});
