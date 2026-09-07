import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SettingsSetKnownDeviceModelIdsPayload } from "~/actions/types";

export const QA_NANO_MODELS = [
  { id: DeviceModelId.nanoS, labelKey: "nanoS" },
  { id: DeviceModelId.nanoSP, labelKey: "nanoSP" },
  { id: DeviceModelId.nanoX, labelKey: "nanoX" },
] as const;

export const QA_TOUCHSCREEN_MODELS = [
  { id: DeviceModelId.stax, labelKey: "stax" },
  { id: DeviceModelId.europa, labelKey: "europa" },
  { id: DeviceModelId.apex, labelKey: "apex" },
] as const;

export const QA_DEVICE_MODELS = [...QA_NANO_MODELS, ...QA_TOUCHSCREEN_MODELS] as const;

export const QA_DEVICE_MODEL_RESET_PAYLOAD: SettingsSetKnownDeviceModelIdsPayload =
  Object.fromEntries(QA_DEVICE_MODELS.map(model => [model.id, false]));
