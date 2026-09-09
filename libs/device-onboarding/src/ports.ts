import type {
  DeviceManagementKit,
  DeviceModelId,
  DeviceSessionId,
} from "@ledgerhq/device-management-kit";

export type DeviceOnboardingSession = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
  deviceModelId: DeviceModelId;
};

export type FirmwareUpdateStep =
  | "preparingUpdate"
  | "allowSecureChannelRequested"
  | "allowSecureChannelDenied"
  | "installingOsu"
  | "installOsuDevicePermissionRequested"
  | "installOsuDevicePermissionGranted"
  | "installOsuDevicePermissionDenied"
  | "flashingMcu"
  | "flashingBootloader"
  | "firmwareUpdateCompleted";

export type FirmwareUpdateProgress = {
  step: FirmwareUpdateStep;
  progress: number;
};

export type FirmwareUpdateInput = {
  deviceId: string;
  deviceName: string | null;
  onProgress: (progress: FirmwareUpdateProgress) => void;
};

export type FirmwareUpdateFailure = {
  source: "updater" | "runtime";
  name: string;
  message?: string;
};

export type FirmwareUpdateResult =
  | { status: "completed" }
  | { status: "userRefused" }
  | { status: "failed"; error: FirmwareUpdateFailure };

/**
 * Implemented by each app without exposing its live-dmk transport types to this package.
 *
 * The app owns the session lifecycle. The machine reads the current id but never opens or closes
 * a session. `openSession` is the composition boundary that supplies the app's existing DMK
 * instance. `applyFirmwareUpdate` must resolve on a refusal event without waiting for the updater
 * observable to complete.
 */
export type DeviceOnboardingPorts = {
  openSession(): Promise<DeviceOnboardingSession>;
  currentSessionId(): DeviceSessionId;
  closeSession(): Promise<void>;
  applyFirmwareUpdate(input: FirmwareUpdateInput): Promise<FirmwareUpdateResult>;
};
