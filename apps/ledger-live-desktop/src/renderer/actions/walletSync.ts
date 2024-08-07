import { TrustchainMember } from "@ledgerhq/trustchain/types";
import { Flow, Step } from "../reducers/walletSync";

export const setFlow = (payload: { flow: Flow; step: Step }) => ({
  type: "WALLET_SYNC_CHANGE_FLOW",
  payload,
});

export const setDrawerVisibility = (payload: boolean) => ({
  type: "WALLET_SYNC_CHANGE_DRAWER_VISIBILITY",
  payload,
});

export const setFaked = (payload: boolean) => ({
  type: "WALLET_SYNC_FAKED",
  payload,
});

export const addInstance = (payload: TrustchainMember) => ({
  type: "WALLET_SYNC_CHANGE_ADD_INSTANCE",
  payload,
});

export const removeInstance = (payload: TrustchainMember) => ({
  type: "WALLET_SYNC_CHANGE_REMOVE_INSTANCE",
  payload,
});

export const removeAllInstances = () => ({
  type: "WALLET_SYNC_CHANGE_CLEAN_INSTANCES",
});

export const resetWalletSync = () => ({
  type: "WALLET_SYNC_RESET",
});

export const setQrCodeUrl = (payload: string | null) => ({
  type: "WALLET_SYNC_CHANGE_QRCODE_URL",
  payload,
});

export const setQrCodePinCode = (payload: string | null) => ({
  type: "WALLET_SYNC_CHANGE_QRCODE_PINCODE",
  payload,
});
