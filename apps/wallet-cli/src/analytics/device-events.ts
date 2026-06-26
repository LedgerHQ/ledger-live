import { classifyDeviceError } from "../device/classify-device-error";
import type { DeviceStateCode } from "../device/device-state";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import { track } from "./segment";

export type DeviceFlow = "discover" | "receive" | "send" | "swap" | "genuine";

const FAILURE_REASON_BY_CODE: Record<DeviceStateCode, string> = {
  disconnected: "not_detected",
  timeout: "transport_error",
  wrong_app: "wrong_app",
  rejected: "rejected",
  locked: "locked",
  app_not_installed: "app_not_installed",
  exchange_app_needed: "exchange_app_needed",
  awaiting_approval: "awaiting_approval",
  unknown: "unknown",
};

export function deviceFlowFailureReason(error: unknown): string {
  const state = error instanceof WalletCliDeviceError ? error.state : classifyDeviceError(error);
  return FAILURE_REASON_BY_CODE[state.code] ?? "unknown";
}

export function isDeviceRejection(error: unknown): boolean {
  const state = error instanceof WalletCliDeviceError ? error.state : classifyDeviceError(error);
  return state.code === "rejected";
}

export function trackDeviceFlowStarted(flow: DeviceFlow): void {
  track("deviceflow_started", { flow });
}

export function trackDeviceConnected(flow: DeviceFlow, device?: string): void {
  // wallet-cli only ever talks to the device over USB.
  track("device_connected", { flow, device, transport: "usb" });
}

export function trackDeviceFlowCompleted(flow: DeviceFlow, device?: string): void {
  track("deviceflow_completed", { flow, device });
}

export function trackDeviceFlowFailed(flow: DeviceFlow, reason: string): void {
  track("deviceflow_failed", { flow, reason });
}

export function trackAppRequested(flow: DeviceFlow, app: string): void {
  track("app_requested", { flow, app });
}

export function trackAppOpened(flow: DeviceFlow, app: string): void {
  track("app_opened", { flow, app });
}

export function trackSignatureRequested(flow: DeviceFlow, device?: string): void {
  track("signature_requested", { flow, device });
}

export function trackSignatureApproved(flow: DeviceFlow, device?: string): void {
  track("signature_approved", { flow, device });
}

export function trackSignatureRejected(flow: DeviceFlow, device?: string): void {
  track("signature_rejected", { flow, device });
}
