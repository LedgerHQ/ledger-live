import ReactNative from "react-native";
import { DeviceModelId, Device } from "@ledgerhq/types-devices";
import {
  isOldFirmwareUpdateUxSupported,
  isNewFirmwareUpdateUxSupported,
} from "./isFirmwareUpdateSupported";
import { DeviceModelInfo } from "@ledgerhq/types-live";

// {
//   nanoS: ">=1.6.1",
//   nanoX: ">=1.3.0",
//   nanoSP: ">=1.0.0",
//   stax: ">=1.0.0",
// };
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

const nanoSDevice = {
  modelId: DeviceModelId.nanoS,
} as Device;
const nanoSDeviceModelInfo = {
  modelId: DeviceModelId.nanoS,
  deviceInfo: {
    version: "1.6.0",
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

describe("isNewFirmwareUpdateUxSupported", () => {
  it("should return true if new firmware update flow is supported", () => {
    expect(isNewFirmwareUpdateUxSupported(staxDevice, staxDeviceModelInfo)).toBe(true);
    expect(isNewFirmwareUpdateUxSupported(europaDevice, europaDeviceModelInfo)).toBe(true);
    expect(
      isNewFirmwareUpdateUxSupported(nanoXSupportedDevice, nanoXSupportedDeviceModelInfo),
    ).toBe(true);
  });

  it("should return false if new firmware update flow is not supported", () => {
    expect(isNewFirmwareUpdateUxSupported(nanoSDevice, nanoSDeviceModelInfo)).toBe(false);
    expect(isNewFirmwareUpdateUxSupported(nanoSPDevice, nanoSPDeviceModelInfo)).toBe(false);
    expect(isNewFirmwareUpdateUxSupported(blueDevice, blueDeviceModelInfo)).toBe(false);
    expect(
      isNewFirmwareUpdateUxSupported(nanoXNotSupportedDevice, nanoXNotSupportedDeviceModelInfo),
    ).toBe(false);
  });
});

describe("isOldFirmwareUpdateUxSupported", () => {
  let isFirmwareUpdateVersionSupportedSpy: jest.SpyInstance;
  let PlatformSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    isFirmwareUpdateVersionSupportedSpy = jest.spyOn(
      jest.requireActual("@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported"),
      "default",
    );
    PlatformSpy = jest.spyOn(ReactNative, "Platform", "get");
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: false } if lastSeenDeviceModelInfo is falsy", () => {
    const lastConnectedDevice = {} as Parameters<
      typeof isOldFirmwareUpdateUxSupported
    >[0]["lastConnectedDevice"];

    const lastSeenDeviceModelInfo = null;

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: false } if isFirmwareUpdateVersionSupported returns false", () => {
    const lastConnectedDevice = {} as Parameters<
      typeof isOldFirmwareUpdateUxSupported
    >[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(false);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: false } if Platform.OS is not android", () => {
    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(true);
    const lastConnectedDevice = {} as Parameters<
      typeof isOldFirmwareUpdateUxSupported
    >[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    PlatformSpy.mockReturnValue({
      OS: "ios",
    } as typeof ReactNative.Platform);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: false,
    });
  });

  it("should return { updateSupported:false, updateSupportedButDeviceNotWired: true } if device is not wired", () => {
    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(true);
    const lastConnectedDevice = {
      wired: false,
    } as Parameters<typeof isOldFirmwareUpdateUxSupported>[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    PlatformSpy.mockReturnValue({
      OS: "android",
    } as typeof ReactNative.Platform);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: false,
      updateSupportedButDeviceNotWired: true,
    });
  });

  it("should return { updateSupported:true, updateSupportedButDeviceNotWired: false } if device is wired", () => {
    isFirmwareUpdateVersionSupportedSpy.mockReturnValue(true);
    const lastConnectedDevice = {
      wired: true,
    } as Parameters<typeof isOldFirmwareUpdateUxSupported>[0]["lastConnectedDevice"];
    const lastSeenDeviceModelInfo = {} as DeviceModelInfo;

    PlatformSpy.mockReturnValue({
      OS: "android",
    } as typeof ReactNative.Platform);

    expect(
      isOldFirmwareUpdateUxSupported({
        lastSeenDeviceModelInfo,
        lastConnectedDevice,
      }),
    ).toEqual({
      updateSupported: true,
      updateSupportedButDeviceNotWired: false,
    });
  });
});
