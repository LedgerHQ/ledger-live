import { DeviceModelId } from "@ledgerhq/device-management-kit";

const SPECULOS_DEVICE_TO_MODEL = new Map<string, DeviceModelId>([
  ["nanoS", DeviceModelId.NANO_S],
  ["nanoSP", DeviceModelId.NANO_SP],
  ["nanoX", DeviceModelId.NANO_X],
  ["stax", DeviceModelId.STAX],
  ["flex", DeviceModelId.FLEX],
  ["nanoGen5", DeviceModelId.APEX],
]);

/**
 * Maps a `SPECULOS_DEVICE` name (e.g. "nanoS") to the DMK model to pass as the transport
 * `model` option. Unknown or missing names give `undefined`.
 */
export function getSpeculosDeviceModel(speculosDevice?: string): DeviceModelId | undefined {
  return speculosDevice ? SPECULOS_DEVICE_TO_MODEL.get(speculosDevice) : undefined;
}
