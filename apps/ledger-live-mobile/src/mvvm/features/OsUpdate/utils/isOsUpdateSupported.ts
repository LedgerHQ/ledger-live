import { coerce, satisfies } from "semver";
import { DeviceModelId } from "@ledgerhq/devices";

const ANY_VERSION = ">=0.0.0";

// A model without an entry does not support the OS update on that connection.
const USB_SUPPORTED_VERSIONS: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.nanoS]: ">=1.6.1",
  [DeviceModelId.nanoX]: ">=1.3.0",
  [DeviceModelId.nanoSP]: ">=1.0.0",
  [DeviceModelId.stax]: ">=1.0.0",
  [DeviceModelId.europa]: ANY_VERSION,
  [DeviceModelId.apex]: ANY_VERSION,
};

// Nano S and Nano S+ have no Bluetooth.
const BLE_SUPPORTED_VERSIONS: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.nanoX]: ">=2.4.0",
  [DeviceModelId.stax]: ANY_VERSION,
  [DeviceModelId.europa]: ANY_VERSION,
  [DeviceModelId.apex]: ANY_VERSION,
};

function satisfiesRange(range: string | undefined, version: string): boolean {
  const coerced = coerce(version);
  return Boolean(range && coerced && satisfies(coerced, range));
}

export function isUsbUpdateSupported(modelId: DeviceModelId, version: string): boolean {
  return satisfiesRange(USB_SUPPORTED_VERSIONS[modelId], version);
}

export function isBleUpdateSupported(modelId: DeviceModelId, version: string): boolean {
  return satisfiesRange(BLE_SUPPORTED_VERSIONS[modelId], version);
}

type IsOsUpdateSupportedParams = {
  modelId: DeviceModelId;
  version: string;
  wired: boolean;
};

export function isOsUpdateSupported({ modelId, version, wired }: IsOsUpdateSupportedParams) {
  return wired ? isUsbUpdateSupported(modelId, version) : isBleUpdateSupported(modelId, version);
}
