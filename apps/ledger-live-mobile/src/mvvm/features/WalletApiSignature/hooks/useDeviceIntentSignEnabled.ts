import {
  useWalletApiSignAssignment,
  useWalletApiSignEnabled,
  type DeviceIntentSignAssignment,
} from "@features/platform-wallet-api-sign";

export type { DeviceIntentSignAssignment };

export function useDeviceIntentSignAssignment(manifestId: string): DeviceIntentSignAssignment {
  return useWalletApiSignAssignment("llmWalletApiDeviceIntentSign", manifestId);
}

export function useDeviceIntentSignEnabled(manifestId: string): boolean {
  return useWalletApiSignEnabled("llmWalletApiDeviceIntentSign", manifestId);
}
