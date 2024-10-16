import { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { ChangeFlowPayload } from "../reducers/walletSync";

export const setFlow = (payload: ChangeFlowPayload) => ({
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
