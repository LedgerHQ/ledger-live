import type { ReactNode } from "react";
import type { DeviceManagementKit, DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceBackupStorage } from "@features/platform-device-os-update";
import type { OsUpdateDeviceModel } from "./OsUpdateDeviceModel";

/** The dependencies each app injects into the flow through `OsUpdatePortsProvider`. */
export type OsUpdatePorts = Readonly<{
  dmk: DeviceManagementKit;
  backupStorage: DeviceBackupStorage;
  getDeviceModel: (modelId: DeviceModelId) => OsUpdateDeviceModel;
  /** The OS version last seen on a device of this model, when the app knows it. */
  getLastSeenOsVersion: (modelId: DeviceModelId) => string | undefined;
  /** Keeps the screen awake until the returned release function is called. */
  keepScreenAwake: () => () => void;
  openUrl: (url: string) => void;
  openSupport: () => void;
  renderReleaseNotes: (markdown: string) => ReactNode;
}>;
