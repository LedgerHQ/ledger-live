import { DeviceModelId, Device } from "@ledgerhq/types-devices";
import { isNewFirmwareUpdateUxSupported } from "./isFirmwareUpdateSupported";
import { DeviceModelInfo } from "@ledgerhq/types-live";

const staxDevice = {
  modelId: DeviceModelId.stax,
} as Device;
const staxDeviceModelInfo = {
  modelId: DeviceModelId.stax,
  deviceInfo: {
    version: "1.0.0",
  },
} as DeviceModelInfo;

const europaDevice = {
  modelId: DeviceModelId.europa,
} as Device;
const europaDeviceModelInfo = {
  modelId: DeviceModelId.europa,
  deviceInfo: {
    version: "1.0.0",
  },
} as DeviceModelInfo;

const nanoXSupportedDevice = {
  modelId: DeviceModelId.nanoX,
} as Device;
const nanoXSupportedDeviceModelInfo = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: {
    version: "1.3.0",
  },
} as DeviceModelInfo;

const nanoXNotSupportedDevice = {
  modelId: DeviceModelId.nanoX,
} as Device;
const nanoXNotSupportedDeviceModelInfo = {
  modelId: DeviceModelId.nanoX,
  deviceInfo: {
    version: "1.2.0",
  },
} as DeviceModelInfo;

const nanoSDeviceNotSupported = {
  modelId: DeviceModelId.nanoS,
} as Device;
const nanoSDeviceNotSupportedModelInfo = {
  modelId: DeviceModelId.nanoS,
  deviceInfo: {
    version: "1.6.0",
  },
} as DeviceModelInfo;

const nanoSDeviceSupported = {
  modelId: DeviceModelId.nanoS,
} as Device;
const nanoSDeviceSupportedModelInfo = {
  modelId: DeviceModelId.nanoS,
  deviceInfo: {
    version: "1.6.1",
  },
} as DeviceModelInfo;

const nanoSPDevice = {
  modelId: DeviceModelId.nanoSP,
} as Device;
const nanoSPDeviceModelInfo = {
  modelId: DeviceModelId.nanoSP,
  deviceInfo: {
    version: "1.0.0",
  },
} as DeviceModelInfo;

const blueDevice = {
  modelId: DeviceModelId.blue,
} as Device;
const blueDeviceModelInfo = {
  modelId: DeviceModelId.blue,
  deviceInfo: {
    version: "2.1.0",
  },
} as DeviceModelInfo;

const apexDevice = {
  modelId: DeviceModelId.apex,
} as Device;
const apexDeviceModelInfo = {
  modelId: DeviceModelId.apex,
  deviceInfo: {
    version: "0.0.0",
  },
} as DeviceModelInfo;

describe("isNewFirmwareUpdateUxSupported", () => {
  it("should return true if new firmware update flow is supported", () => {
    expect(isNewFirmwareUpdateUxSupported(staxDevice, staxDeviceModelInfo)).toBe(true);
    expect(isNewFirmwareUpdateUxSupported(europaDevice, europaDeviceModelInfo)).toBe(true);
    expect(
      isNewFirmwareUpdateUxSupported(nanoXSupportedDevice, nanoXSupportedDeviceModelInfo),
    ).toBe(true);
    expect(isNewFirmwareUpdateUxSupported(apexDevice, apexDeviceModelInfo)).toBe(true);
    expect(isNewFirmwareUpdateUxSupported(nanoSPDevice, nanoSPDeviceModelInfo)).toBe(true);
    expect(
      isNewFirmwareUpdateUxSupported(nanoSDeviceSupported, nanoSDeviceSupportedModelInfo),
    ).toBe(true);
  });

  it("should return false if new firmware update flow is not supported", () => {
    expect(
      isNewFirmwareUpdateUxSupported(nanoSDeviceNotSupported, nanoSDeviceNotSupportedModelInfo),
    ).toBe(false);
    expect(isNewFirmwareUpdateUxSupported(blueDevice, blueDeviceModelInfo)).toBe(false);
    expect(
      isNewFirmwareUpdateUxSupported(nanoXNotSupportedDevice, nanoXNotSupportedDeviceModelInfo),
    ).toBe(false);
  });
});
