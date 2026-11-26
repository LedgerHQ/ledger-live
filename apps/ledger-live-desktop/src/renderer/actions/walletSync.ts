import type { KeyRingMember } from "@features/platform-key-ring";
import { ChangeFlowPayload } from "../reducers/walletSync";

export function setFlow(payload: ChangeFlowPayload) {
  return {
    type: "WALLET_SYNC_CHANGE_FLOW",
    payload,
  };
}

export function setDrawerVisibility(payload: boolean) {
  return {
    type: "WALLET_SYNC_CHANGE_DRAWER_VISIBILITY",
    payload,
  };
}

export function setFaked(payload: boolean) {
  return {
    type: "WALLET_SYNC_FAKED",
    payload,
  };
}

export function addInstance(payload: KeyRingMember) {
  return {
    type: "WALLET_SYNC_CHANGE_ADD_INSTANCE",
    payload,
  };
}

export function resetWalletSync() {
  return {
    type: "WALLET_SYNC_RESET",
  };
}

export function setQrCodeUrl(payload: string | null) {
  return {
    type: "WALLET_SYNC_CHANGE_QRCODE_URL",
    payload,
  };
}

export function setQrCodePinCode(payload: string | null) {
  return {
    type: "WALLET_SYNC_CHANGE_QRCODE_PINCODE",
    payload,
  };
}
