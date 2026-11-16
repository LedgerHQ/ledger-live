import { DeviceModelId, type ConnectedDevice } from "@ledgerhq/device-management-kit";

export const previewModels = [
  { modelId: DeviceModelId.STAX, label: "Stax" },
  { modelId: DeviceModelId.FLEX, label: "Flex" },
  { modelId: DeviceModelId.APEX, label: "Nano Gen5" },
  { modelId: DeviceModelId.NANO_X, label: "Nano X" },
  { modelId: DeviceModelId.NANO_SP, label: "Nano S Plus" },
] as const;

export type PreviewModelId = (typeof previewModels)[number]["modelId"];

export const updateCounts = [1, 3] as const;
export type UpdateCount = (typeof updateCounts)[number];

export const progressPresets = [0, 0.45, 1] as const;
export type ProgressPreset = (typeof progressPresets)[number];

export const previewConnectedDevice = (modelId: PreviewModelId, name: string) =>
  ({
    id: "preview-device",
    name: `Lily's ${name}`,
    modelId,
    sessionId: "preview-session",
    type: "BLE",
    transport: "ble",
  }) as ConnectedDevice;

export const previewTargetVersion = "1.8.0";

export const previewReleaseNotes = `- New lock screen gallery
- Faster app installation
- Improved Bluetooth stability
- Security fixes`;

export const previewBatteryPercentage = 12;

const BACKUP_AGE_MS = 25 * 60 * 60 * 1000;
export const previewBackupCreatedAt = () => new Date(Date.now() - BACKUP_AGE_MS);

export const previewError = new Error("Preview");

export const noop = () => undefined;
